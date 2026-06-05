import { Cart, ICartItem } from "../models/cart.model";
import { OrderSnapshot } from "../models/orderSnapshot.model";

export type CartView = {
  items: ICartItem[];
  couponCode: string | null;
};

const EMPTY: CartView = { items: [], couponCode: null };

// Strip to the known item fields and coerce qty so a malformed client payload
// can't write junk into the document.
const sanitizeItem = (raw: any): ICartItem | null => {
  if (!raw || typeof raw.productId !== "string" || !raw.productId.trim()) {
    return null;
  }
  const qty = Math.max(1, Math.floor(Number(raw.qty) || 1));
  return {
    productId: raw.productId,
    name: typeof raw.name === "string" ? raw.name : "",
    image: typeof raw.image === "string" ? raw.image : "",
    price: Math.max(0, Math.floor(Number(raw.price) || 0)),
    qty,
    variant: typeof raw.variant === "string" ? raw.variant : undefined,
    inventoryId: typeof raw.inventoryId === "string" ? raw.inventoryId : undefined,
    sellerId: typeof raw.sellerId === "string" ? raw.sellerId : undefined,
  };
};

const sanitizeItems = (raw: any): ICartItem[] => {
  if (!Array.isArray(raw)) return [];
  const out: ICartItem[] = [];
  for (const r of raw) {
    const item = sanitizeItem(r);
    if (item) out.push(item);
  }
  return out;
};

const toView = (doc: { items: ICartItem[]; couponCode: string | null } | null): CartView => {
  if (!doc) return { ...EMPTY };
  return { items: doc.items ?? [], couponCode: doc.couponCode ?? null };
};

/** The user's current cart (empty view if none stored yet). */
export const getCart = async (userId: string): Promise<CartView> => {
  const doc = await Cart.findOne({ userId }).lean();
  return toView(doc as any);
};

/** Replace the whole cart with the supplied state. */
export const replaceCart = async (
  userId: string,
  rawItems: any,
  rawCoupon: any,
): Promise<CartView> => {
  const items = sanitizeItems(rawItems);
  const couponCode =
    typeof rawCoupon === "string" && rawCoupon.trim() ? rawCoupon.trim() : null;
  const doc = await Cart.findOneAndUpdate(
    { userId },
    { $set: { items, couponCode } },
    { upsert: true, new: true },
  ).lean();
  return toView(doc as any);
};

/** Clear the cart (items + coupon). */
export const clearCart = async (userId: string): Promise<CartView> => {
  await Cart.findOneAndUpdate(
    { userId },
    { $set: { items: [], couponCode: null } },
    { upsert: true },
  );
  return { ...EMPTY };
};

/**
 * Merge a set of local (guest) items into the account's stored cart, summing
 * quantities for items that share a productId. Used right after login so a
 * guest never loses what they added before signing in. The incoming coupon
 * only fills an empty slot — an existing account coupon wins.
 */
export const mergeCart = async (
  userId: string,
  rawItems: any,
  rawCoupon: any,
): Promise<CartView> => {
  const incoming = sanitizeItems(rawItems);
  // .lean() so existing items are plain objects we can spread/sum safely.
  const existing = await Cart.findOne({ userId }).lean();

  const byId = new Map<string, ICartItem>();
  for (const it of (existing?.items ?? []) as ICartItem[]) {
    byId.set(it.productId, { ...it });
  }
  for (const it of incoming) {
    const prev = byId.get(it.productId);
    if (prev) {
      // Sum quantities; keep the freshest metadata from the incoming item.
      byId.set(it.productId, { ...prev, ...it, qty: prev.qty + it.qty });
    } else {
      byId.set(it.productId, it);
    }
  }

  const incomingCoupon =
    typeof rawCoupon === "string" && rawCoupon.trim() ? rawCoupon.trim() : null;
  const couponCode = existing?.couponCode ?? incomingCoupon;

  const doc = await Cart.findOneAndUpdate(
    { userId },
    { $set: { items: Array.from(byId.values()), couponCode } },
    { upsert: true, new: true },
  ).lean();
  return toView(doc as any);
};

// ── Order snapshots ──────────────────────────────────────────────────────────

export type SnapshotInput = {
  orderId: string;
  items: any;
  subtotal: number;
  discount: number;
  couponCode?: string;
  total: number;
  method: "wallet" | "momo";
  createdAt?: string;
};

export const saveSnapshot = async (userId: string, input: SnapshotInput) => {
  const orderId = String(input.orderId || "").trim();
  if (!orderId) return null;
  const doc = await OrderSnapshot.findOneAndUpdate(
    { userId, orderId },
    {
      $set: {
        items: sanitizeItems(input.items),
        subtotal: Math.max(0, Math.floor(Number(input.subtotal) || 0)),
        discount: Math.max(0, Math.floor(Number(input.discount) || 0)),
        couponCode: input.couponCode || undefined,
        total: Math.max(0, Math.floor(Number(input.total) || 0)),
        method: input.method === "momo" ? "momo" : "wallet",
      },
    },
    { upsert: true, new: true },
  ).lean();
  return doc;
};

export const getSnapshot = async (userId: string, orderId: string) => {
  const doc = await OrderSnapshot.findOne({ userId, orderId: String(orderId).trim() }).lean();
  if (!doc) return null;
  return {
    orderId: (doc as any).orderId,
    items: (doc as any).items ?? [],
    subtotal: (doc as any).subtotal ?? 0,
    discount: (doc as any).discount ?? 0,
    couponCode: (doc as any).couponCode,
    total: (doc as any).total ?? 0,
    method: (doc as any).method ?? "wallet",
    createdAt: (doc as any).createdAt,
  };
};
