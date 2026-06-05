"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Minus,
  Plus,
  X,
  ShoppingBag,
  ArrowLeft,
  Tag,
  ChevronRight,
  Loader2,
  Check,
  Store,
} from "lucide-react";
import Link from "next/link";
import { formatVND } from "@/lib/products";
import {
  useCart,
  updateQty,
  removeFromCart,
  cartSubtotal,
  setAppliedCoupon,
  getAppliedCoupon,
  type CartItem,
} from "@/lib/cart";
import { fetchSellerPublicProfile } from "@/lib/seller";
import {
  fetchActivePromotions,
  validatePromotion,
  lookupPromotionByCode,
  type Promotion,
  type PromotionValidation,
} from "@/lib/promotions";
import { isLoggedIn } from "@/lib/auth";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];
const SHIPPING_THRESHOLD = 500000;
const SHIPPING_FEE = 25000;

export default function CartPage() {
  const items = useCart();
  const [promoCode, setPromoCode] = useState("");
  const [applying, setApplying] = useState(false);
  const [validation, setValidation] = useState<PromotionValidation | null>(null);
  const [promoError, setPromoError] = useState("");
  const [offers, setOffers] = useState<Promotion[]>([]);

  const subtotal = useMemo(() => cartSubtotal(items), [items]);

  // Resolve a friendly shop name for every distinct seller in the cart so the
  // basket can be grouped per shop (a cart commonly mixes several sellers).
  const [shopNames, setShopNames] = useState<Record<string, string>>({});
  const sellerIds = useMemo(() => {
    const ids = new Set<string>();
    for (const i of items) if (i.sellerId) ids.add(i.sellerId);
    return Array.from(ids);
  }, [items]);

  useEffect(() => {
    let cancelled = false;
    const missing = sellerIds.filter((id) => !(id in shopNames));
    if (missing.length === 0) return;
    (async () => {
      const entries = await Promise.all(
        missing.map(async (id) => {
          const shop = await fetchSellerPublicProfile(id).catch(() => null);
          return [id, shop?.name?.trim() || "Shop"] as const;
        }),
      );
      if (!cancelled) {
        setShopNames((prev) => {
          const next = { ...prev };
          for (const [id, name] of entries) next[id] = name;
          return next;
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sellerIds, shopNames]);

  // Group cart lines by shop. Items with no seller linkage fall into a trailing
  // "Other items" group so legacy/demo entries still render.
  const groups = useMemo(() => {
    const byShop = new Map<string, CartItem[]>();
    for (const item of items) {
      const key = item.sellerId || "__other__";
      const list = byShop.get(key) ?? [];
      list.push(item);
      byShop.set(key, list);
    }
    return Array.from(byShop.entries()).map(([sellerId, groupItems]) => ({
      sellerId,
      name:
        sellerId === "__other__"
          ? "Other items"
          : shopNames[sellerId] ?? "Shop",
      items: groupItems,
      subtotal: cartSubtotal(groupItems),
    }));
  }, [items, shopNames]);

  // Available offers (public endpoint).
  useEffect(() => {
    fetchActivePromotions().then(setOffers);
  }, []);

  const promoItems = useMemo(
    () =>
      items.map((i) => ({
        productId: i.productId,
        quantity: i.qty,
        unitPrice: i.price,
      })),
    [items],
  );

  const applyPromo = useCallback(
    async (rawCode: string) => {
      const code = rawCode.trim().toUpperCase();
      if (!code) return;
      setPromoCode(code);
      setPromoError("");
      setApplying(true);
      try {
        if (isLoggedIn()) {
          // Authoritative: validates eligibility + computes the discount.
          const result = await validatePromotion(code, promoItems);
          setValidation(result);
          setAppliedCoupon(code);
        } else {
          // Guest: confirm the code exists; it'll be applied at checkout.
          const promo = await lookupPromotionByCode(code);
          if (!promo) {
            setPromoError("That code doesn't exist.");
            setValidation(null);
            setAppliedCoupon(null);
          } else {
            setValidation(null);
            setAppliedCoupon(code);
            setPromoError("Sign in at checkout to apply this code.");
          }
        }
      } catch (err) {
        const message =
          (err as { message?: string })?.message || "Couldn't apply that code.";
        setPromoError(message);
        setValidation(null);
        setAppliedCoupon(null);
      } finally {
        setApplying(false);
      }
    },
    [promoItems],
  );

  // Restore a previously-applied coupon and re-validate when the cart changes.
  useEffect(() => {
    const saved = getAppliedCoupon();
    if (saved && items.length > 0 && isLoggedIn()) {
      setPromoCode(saved);
      validatePromotion(saved, promoItems)
        .then((r) => setValidation(r))
        .catch(() => {
          setValidation(null);
          setAppliedCoupon(null);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  function clearPromo() {
    setValidation(null);
    setPromoCode("");
    setPromoError("");
    setAppliedCoupon(null);
  }

  const discount = validation?.discountAmount ?? 0;
  const afterDiscount = Math.max(0, subtotal - discount);
  const shipping = afterDiscount >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = afterDiscount + shipping;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <main className="flex-1 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } }}
            className="text-center max-w-sm"
          >
            <div className="w-20 h-20 border-2 border-deep-navy rounded-2xl flex items-center justify-center mx-auto mb-6 bg-surface-container">
              <ShoppingBag className="w-9 h-9 text-on-surface-variant" />
            </div>
            <h1 className="text-headline-md text-deep-navy mb-2">Your cart is empty</h1>
            <p className="text-sm text-on-surface-variant mb-8">
              Add items from our collections to get started.
            </p>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 bg-primary-container text-deep-navy text-label-caps font-bold px-8 py-3.5 rounded-xl border-2 border-transparent hover:border-deep-navy transition-colors active:scale-[0.97]"
            >
              Browse Collections
            </Link>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">

      <main className="flex-1">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-10 py-10">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/search"
              className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Continue Shopping
            </Link>
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-primary-container flex-shrink-0" />
              <span className="text-label-caps text-primary">Shopping Bag</span>
            </div>
            <h1 className="text-display-lg-mobile text-deep-navy mt-1">
              Your Cart
              <span className="text-sm font-normal text-on-surface-variant ml-3">
                {items.length} {items.length === 1 ? "item" : "items"}
              </span>
            </h1>
          </div>

          {/* Free shipping progress */}
          {afterDiscount < SHIPPING_THRESHOLD && (
            <div className="mb-6 px-5 py-3.5 bg-white border-2 border-deep-navy/10 rounded-xl flex items-center gap-4">
              <div className="flex-1">
                <p className="text-xs font-bold text-deep-navy">
                  Add{" "}
                  <span className="text-primary">
                    {formatVND(SHIPPING_THRESHOLD - afterDiscount)}
                  </span>{" "}
                  more to get free shipping
                </p>
                <div className="mt-2 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (afterDiscount / SHIPPING_THRESHOLD) * 100)}%` }}
                    transition={{ duration: 0.5, ease: EASE }}
                    className="h-full bg-primary-container rounded-full"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Items list — grouped by shop */}
            <div className="lg:col-span-2 space-y-6">
              {groups.map((group) => (
                <div key={group.sellerId} className="space-y-3">
                  {/* Shop header */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg border-2 border-deep-navy/15 bg-surface-container flex items-center justify-center">
                        <Store className="w-3.5 h-3.5 text-deep-navy" />
                      </div>
                      <span className="text-sm font-bold text-deep-navy">{group.name}</span>
                      <span className="text-[11px] text-on-surface-variant">
                        · {group.items.length} {group.items.length === 1 ? "item" : "items"}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-on-surface-variant">
                      {formatVND(group.subtotal)}
                    </span>
                  </div>

              <AnimatePresence mode="popLayout">
                {group.items.map((item) => (
                  <motion.div
                    key={item.productId}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE } }}
                    exit={{ opacity: 0, x: 40, transition: { duration: 0.25 } }}
                    className="flex gap-4 p-5 bg-white border-2 border-deep-navy/15 hover:border-deep-navy rounded-2xl transition-colors duration-150"
                  >
                    {/* Image */}
                    <div className="w-24 h-24 border border-deep-navy/15 rounded-xl bg-surface-container-low p-3 shrink-0 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://placehold.co/96x96/e2e2e2/6a7a7b?text=IMG";
                        }}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-deep-navy text-sm leading-tight">{item.name}</p>
                          {item.variant && (
                            <p className="text-xs text-on-surface-variant mt-0.5">{item.variant}</p>
                          )}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="p-1.5 text-outline hover:text-error transition-colors shrink-0"
                          aria-label="Remove item"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        {/* Qty control */}
                        <div className="flex items-center gap-0 border-2 border-deep-navy/20 rounded-xl overflow-hidden">
                          <button
                            onClick={() => updateQty(item.productId, item.qty - 1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-surface-container transition-colors active:scale-[0.93]"
                          >
                            <Minus className="w-3 h-3 text-deep-navy" />
                          </button>
                          <span className="w-8 h-8 flex items-center justify-center text-xs font-bold text-deep-navy border-x border-deep-navy/20">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => updateQty(item.productId, item.qty + 1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-surface-container transition-colors active:scale-[0.93]"
                          >
                            <Plus className="w-3 h-3 text-deep-navy" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <p className="font-bold text-deep-navy">
                            {formatVND(item.price * item.qty)}
                          </p>
                          {item.qty > 1 && (
                            <p className="text-[10px] text-on-surface-variant mt-0.5">
                              {formatVND(item.price)} each
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
                </div>
              ))}

              {/* Available offers */}
              {offers.length > 0 && (
                <div className="pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                    Available Offers
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {offers.map((o) => (
                      <button
                        key={o.id}
                        onClick={() => applyPromo(o.code)}
                        className="group flex items-center gap-2 border-2 border-dashed border-deep-navy/30 hover:border-deep-navy rounded-lg px-3 py-2 transition-colors text-left"
                      >
                        <Tag className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>
                          <span className="block text-xs font-bold text-deep-navy">{o.code}</span>
                          <span className="block text-[10px] text-on-surface-variant">{o.title}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE, delay: 0.1 } }}
                className="bg-white border-2 border-deep-navy rounded-2xl p-6 space-y-5 sticky top-28"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-px w-5 bg-primary-container flex-shrink-0" />
                    <p className="text-label-caps text-primary">Summary</p>
                  </div>
                  <h2 className="text-headline-md text-deep-navy">Order Total</h2>
                </div>

                {/* Promo code */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                    Promo Code
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-outline pointer-events-none" />
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => {
                          setPromoCode(e.target.value);
                          setPromoError("");
                        }}
                        onKeyDown={(e) => e.key === "Enter" && applyPromo(promoCode)}
                        placeholder="FROST10"
                        disabled={!!validation}
                        className="w-full h-10 pl-8 pr-3 border border-deep-navy/20 rounded-lg text-xs text-on-surface bg-transparent focus:border-primary-container outline-none transition-colors disabled:opacity-60 uppercase"
                      />
                    </div>
                    {validation ? (
                      <button
                        onClick={clearPromo}
                        className="px-4 h-10 border-2 border-deep-navy text-deep-navy text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-surface-container transition-colors active:scale-[0.97] shrink-0"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        onClick={() => applyPromo(promoCode)}
                        disabled={applying}
                        className="px-4 h-10 bg-deep-navy text-primary-container text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-deep-navy/80 transition-colors active:scale-[0.97] shrink-0 disabled:opacity-60 flex items-center gap-1.5"
                      >
                        {applying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Apply"}
                      </button>
                    )}
                  </div>
                  {validation && (
                    <p className="text-[11px] text-primary font-semibold mt-1.5 flex items-center gap-1">
                      <Check className="w-3 h-3" /> {validation.promotion.code} applied —
                      {validation.promotion.discountType === "percentage"
                        ? ` ${validation.promotion.discountValue}% off`
                        : ` ${formatVND(validation.promotion.discountValue)} off`}
                    </p>
                  )}
                  {promoError && (
                    <p className="text-[11px] text-error font-semibold mt-1.5">{promoError}</p>
                  )}
                </div>

                {/* Line items */}
                <div className="space-y-2 text-sm border-t border-deep-navy/10 pt-4">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Subtotal</span>
                    <span>{formatVND(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-primary font-semibold">
                      <span>Discount</span>
                      <span>-{formatVND(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? "Free" : formatVND(shipping)}</span>
                  </div>
                  <div className="border-t-2 border-deep-navy pt-3 flex justify-between font-bold text-deep-navy text-base">
                    <span>Total</span>
                    <span>{formatVND(total)}</span>
                  </div>
                </div>

                {/* Checkout */}
                <Link
                  href="/checkout"
                  className="flex items-center justify-center gap-2 w-full h-12 bg-primary-container text-deep-navy text-label-caps font-bold rounded-xl border-2 border-transparent hover:border-deep-navy transition-colors active:scale-[0.97]"
                >
                  Proceed to Checkout
                  <ChevronRight className="w-4 h-4" />
                </Link>

                <p className="text-center text-[10px] text-on-surface-variant">
                  Secure checkout · Free returns within 30 days
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}
