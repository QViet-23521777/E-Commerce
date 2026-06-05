"use client";

import { useEffect, useState } from "react";
import { getAccessToken, currentKind } from "./auth";

/**
 * Per-account shopping cart, backed by the cart microservice (gateway
 * `/api/cart`). The public API stays synchronous: localStorage is a fast local
 * MIRROR for instant render, and every mutation is pushed to the server in the
 * background (debounced) when a buyer is signed in. On load the cart is
 * hydrated from the server, and on login the local guest cart is merged into
 * the account cart. Guests (no token) work entirely locally until they sign in.
 *
 * Server sync is best-effort: a failed request never breaks the UI — the cart
 * keeps working off the local mirror and re-syncs on the next mutation.
 * Prices are integer Vietnamese Dong.
 */
export interface CartItem {
  productId: string;
  name: string;
  image: string;
  price: number; // VND, integer
  qty: number;
  variant?: string;
  // Real inventory linkage — present when the item was added from a product
  // page whose shop lookup succeeded. Required for stock deduction + seller
  // attribution at checkout. Absent on legacy/demo items (amount-only fallback).
  inventoryId?: string;
  sellerId?: string;
}

const CART_KEY = "cart_v1";
const ORDER_PREFIX = "order_snapshot_";
const COUPON_KEY = "applied_coupon_v1";
const CART_EVENT = "cart:changed";

/** A snapshot of a completed order, stashed so the confirmation page can show
 *  line items (the payment record itself only stores an amount). */
export interface OrderSnapshot {
  orderId: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  total: number;
  method: "wallet" | "momo";
  createdAt: string;
}

// ── Local mirror (localStorage) ──────────────────────────────────────────────

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(CART_KEY);
  if (raw === null) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Write the local mirror and notify listeners, WITHOUT a server push. */
function writeLocal(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CART_EVENT));
}

/** Write the local mirror, notify listeners, and schedule a server push. */
function write(items: CartItem[]) {
  writeLocal(items);
  schedulePush();
}

// ── Server sync (best-effort) ────────────────────────────────────────────────

const API_BASE = (() => {
  const u = process.env.NEXT_PUBLIC_API_URL;
  return u && u.startsWith("http") ? u : "http://localhost:3000";
})();

// The cart only belongs to the buyer storefront. Only sync when we're on a
// buyer page AND signed in — never touch the server for guests or for the
// shop/admin portals (which have no cart).
function canSync(): boolean {
  return (
    typeof window !== "undefined" &&
    currentKind() === "user" &&
    !!getAccessToken()
  );
}

async function cartApi<T = unknown>(
  path: string,
  method: "GET" | "PUT" | "DELETE" | "POST",
  body?: unknown,
): Promise<T | null> {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) return null;
    return (await res.json().catch(() => null)) as T | null;
  } catch {
    return null;
  }
}

let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pushPending = false;

async function doPush() {
  pushPending = false;
  if (!canSync()) return;
  await cartApi("/api/cart", "PUT", {
    items: read(),
    couponCode: getAppliedCouponLocal(),
  });
}

/** Debounce a full-cart PUT so a burst of mutations collapses into one write. */
function schedulePush() {
  if (!canSync()) return;
  pushPending = true;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    void doPush();
  }, 400);
}

/** Flush any pending push immediately (so reads see the latest server state). */
async function flushPush() {
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  if (pushPending) await doPush();
}

let hydrated = false;

/**
 * Pull the cart from the server and replace the local mirror. Runs once per
 * page load when a buyer is signed in. Any locally pending mutation is flushed
 * first so an in-flight change isn't clobbered by stale server state.
 */
export async function hydrateCart(): Promise<void> {
  if (hydrated || !canSync()) return;
  hydrated = true;
  await flushPush();
  const res = await cartApi<{ data?: { items?: CartItem[]; couponCode?: string | null } }>(
    "/api/cart",
    "GET",
  );
  if (!res?.data) return;
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_KEY, JSON.stringify(res.data.items ?? []));
  if (res.data.couponCode) localStorage.setItem(COUPON_KEY, res.data.couponCode);
  else localStorage.removeItem(COUPON_KEY);
  window.dispatchEvent(new Event(CART_EVENT));
}

/**
 * Merge the current local (guest) cart into the account cart on the server,
 * then adopt the merged result locally. Call this right after a buyer signs in.
 */
export async function mergeCartOnLogin(): Promise<void> {
  if (!canSync()) return;
  const res = await cartApi<{ data?: { items?: CartItem[]; couponCode?: string | null } }>(
    "/api/cart/merge",
    "POST",
    { items: read(), couponCode: getAppliedCouponLocal() },
  );
  if (!res?.data || typeof window === "undefined") return;
  localStorage.setItem(CART_KEY, JSON.stringify(res.data.items ?? []));
  if (res.data.couponCode) localStorage.setItem(COUPON_KEY, res.data.couponCode);
  else localStorage.removeItem(COUPON_KEY);
  window.dispatchEvent(new Event(CART_EVENT));
}

/**
 * Drop the local cart mirror. Call this on logout so the next account signed in
 * on this browser doesn't inherit the previous buyer's basket. (The server copy
 * is untouched — it rehydrates when that buyer signs back in.)
 */
export function clearLocalCart() {
  if (typeof window === "undefined") return;
  hydrated = false;
  localStorage.removeItem(CART_KEY);
  localStorage.removeItem(COUPON_KEY);
  window.dispatchEvent(new Event(CART_EVENT));
}

// ── Public cart API (synchronous) ────────────────────────────────────────────

export function getCart(): CartItem[] {
  return read();
}

export function addToCart(item: Omit<CartItem, "qty"> & { qty?: number }) {
  const items = read();
  const qty = Math.max(1, item.qty ?? 1);
  const existing = items.find((i) => i.productId === item.productId);
  if (existing) {
    existing.qty += qty;
  } else {
    items.push({ ...item, qty });
  }
  write(items);
}

export function updateQty(productId: string, qty: number) {
  const items = read().map((i) =>
    i.productId === productId ? { ...i, qty: Math.max(1, qty) } : i,
  );
  write(items);
}

export function removeFromCart(productId: string) {
  write(read().filter((i) => i.productId !== productId));
}

export function clearCart() {
  write([]);
}

export function cartCount(items?: CartItem[]): number {
  return (items ?? read()).reduce((n, i) => n + i.qty, 0);
}

export function cartSubtotal(items?: CartItem[]): number {
  return (items ?? read()).reduce((s, i) => s + i.price * i.qty, 0);
}

// ── Order snapshots ──────────────────────────────────────────────────────────

export function saveOrderSnapshot(snapshot: OrderSnapshot) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ORDER_PREFIX + snapshot.orderId, JSON.stringify(snapshot));
  // Best-effort server persistence so the snapshot is recoverable on other
  // devices. Fire-and-forget — the local copy already covers this browser.
  if (canSync()) {
    void cartApi(`/api/cart/orders/${snapshot.orderId}/snapshot`, "POST", snapshot);
  }
}

/** Local-first read used for the current-browser confirmation flow. */
export function getOrderSnapshot(orderId: string): OrderSnapshot | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(ORDER_PREFIX + orderId);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OrderSnapshot;
  } catch {
    return null;
  }
}

/** Server fallback for when the local snapshot is missing (e.g. another device). */
export async function fetchOrderSnapshot(orderId: string): Promise<OrderSnapshot | null> {
  const local = getOrderSnapshot(orderId);
  if (local) return local;
  const res = await cartApi<{ data?: OrderSnapshot }>(
    `/api/cart/orders/${orderId}/snapshot`,
    "GET",
  );
  return res?.data ?? null;
}

// ── Applied coupon (carried from cart → checkout) ────────────────────────────

function getAppliedCouponLocal(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(COUPON_KEY);
}

export function getAppliedCoupon(): string | null {
  return getAppliedCouponLocal();
}

export function setAppliedCoupon(code: string | null) {
  if (typeof window === "undefined") return;
  if (code) localStorage.setItem(COUPON_KEY, code);
  else localStorage.removeItem(COUPON_KEY);
  // The coupon rides inside the cart blob on the server.
  schedulePush();
}

// ── React hook ───────────────────────────────────────────────────────────────

/** Reactive cart hook — re-renders on any cart mutation (this tab or others).
 *  Also triggers a one-time hydrate from the server when a buyer is signed in. */
export function useCart(): CartItem[] {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const sync = () => setItems(read());
    sync();
    void hydrateCart();
    window.addEventListener(CART_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CART_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return items;
}
