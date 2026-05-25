"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Minus, Plus, X, ShoppingBag, ArrowLeft, Tag, ChevronRight } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

type CartItem = {
  id: number;
  name: string;
  variant: string;
  price: number;
  qty: number;
  image: string;
};

const INITIAL_ITEMS: CartItem[] = [
  {
    id: 1,
    name: "V60 Ceramic Dripper",
    variant: "White / 02",
    price: 45,
    qty: 1,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDuYPHC5ZucXkMLQdPzRtMwA5fwVf4vodbpXzIAj1S6x4XKjM2fAlF7-u-Z-AU3MWyNLivbqT5NJVyhECEfYebs0h9qutzgtz955zo46r6UKJ_32aNcoy_7_fNGgqJzQY7CDeFPibKGTiQOwhV3lPfA9eC6I9W4_XCDYFh4FgdiwfC_x7VTV8hox8fmMw3BIDeUe8i7OCB11qcswwjZTdPA83Cj2SJY5IbVEXpLsg6dQg6vLyyj5o-lN_LUe6-ocebtxqygqhHLieN3",
  },
  {
    id: 2,
    name: "Cylindrical Tumbler Set",
    variant: "Matte Black · Set of 4",
    price: 32,
    qty: 2,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAgZgxJBL_cQBXBw5VzGLXPpgE5RrL1cjMbWzL19VtO-XmfNNZV1pTCD8rc39nQXx99rcFwYIBT_DXnucwl9RgW8yKfo4HhdOSq_L0oCSntd6PaPXphuxOKKyW1xWwfBGwb72fuxp_0uPUaDG4DJGiKGwxMoyC3d6Miv61WWKFUAWGd3H-IlEY28QsPuHJioAksGYxaOHKRI2Qg3AG52p3ws5sxT3xorquBUeftVmdxuHfT73crxvuynz2znqMFjVdss1scuZQ8o4Nz",
  },
  {
    id: 3,
    name: "Task Lamp T-1",
    variant: "Bone White",
    price: 120,
    qty: 1,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBqiE_3yYfaa9MGAf4ckjwM4q7Mqu2_Iz1nKbpM0LLiQiglJWVhM0M2cfKayFDUrfgnwhjus7cAj6Jm4tLDHon9-mSigEVHGvRoiKbCZGnDSEk6mTI3Ilu7ivPq83PedR7syPOMj7Echsltht2GcxDbvBHGrK2XDC3utMl7Hq4ZKuy1vCBtuybpYu4hfAVauclNgV2rdeiE4NS6_ImSl5Hcc74MRjZAc2-3ub60TPbLQ-qGPv4ZSop3evz7-r4Hh7LmhrVVRrYJzAyt",
  },
];

const SHIPPING_THRESHOLD = 150;

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>(INITIAL_ITEMS);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState("");

  function updateQty(id: number, delta: number) {
    setItems((prev) =>
      prev
        .map((it) => (it.id === id ? { ...it, qty: Math.max(1, it.qty + delta) } : it))
    );
  }

  function removeItem(id: number) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  function applyPromo() {
    if (promoCode.trim().toUpperCase() === "FROST25") {
      setPromoApplied(true);
      setPromoError("");
    } else {
      setPromoError("Invalid promo code.");
      setPromoApplied(false);
    }
  }

  const subtotal = items.reduce((sum, it) => sum + it.price * it.qty, 0);
  const discount = promoApplied ? Math.round(subtotal * 0.25) : 0;
  const shipping = subtotal - discount >= SHIPPING_THRESHOLD ? 0 : 9.99;
  const tax = Math.round((subtotal - discount + shipping) * 0.15 * 100) / 100;
  const total = subtotal - discount + shipping + tax;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
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
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

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
          {subtotal - discount < SHIPPING_THRESHOLD && (
            <div className="mb-6 px-5 py-3.5 bg-white border-2 border-deep-navy/10 rounded-xl flex items-center gap-4">
              <div className="flex-1">
                <p className="text-xs font-bold text-deep-navy">
                  Add{" "}
                  <span className="text-primary">
                    ${(SHIPPING_THRESHOLD - (subtotal - discount)).toFixed(2)}
                  </span>{" "}
                  more to get free shipping
                </p>
                <div className="mt-2 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, ((subtotal - discount) / SHIPPING_THRESHOLD) * 100)}%` }}
                    transition={{ duration: 0.5, ease: EASE }}
                    className="h-full bg-primary-container rounded-full"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Items list */}
            <div className="lg:col-span-2 space-y-3">
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <motion.div
                    key={item.id}
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
                          <p className="text-xs text-on-surface-variant mt-0.5">{item.variant}</p>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
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
                            onClick={() => updateQty(item.id, -1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-surface-container transition-colors active:scale-[0.93]"
                          >
                            <Minus className="w-3 h-3 text-deep-navy" />
                          </button>
                          <span className="w-8 h-8 flex items-center justify-center text-xs font-bold text-deep-navy border-x border-deep-navy/20">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => updateQty(item.id, 1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-surface-container transition-colors active:scale-[0.93]"
                          >
                            <Plus className="w-3 h-3 text-deep-navy" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <p className="font-bold text-deep-navy">
                            ${(item.price * item.qty).toFixed(2)}
                          </p>
                          {item.qty > 1 && (
                            <p className="text-[10px] text-on-surface-variant mt-0.5">
                              ${item.price.toFixed(2)} each
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
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
                        onChange={(e) => { setPromoCode(e.target.value); setPromoError(""); setPromoApplied(false); }}
                        placeholder="FROST25"
                        className="w-full h-10 pl-8 pr-3 border border-deep-navy/20 rounded-lg text-xs text-on-surface bg-transparent focus:border-primary-container outline-none transition-colors"
                      />
                    </div>
                    <button
                      onClick={applyPromo}
                      className="px-4 h-10 bg-deep-navy text-primary-container text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-deep-navy/80 transition-colors active:scale-[0.97] shrink-0"
                    >
                      Apply
                    </button>
                  </div>
                  {promoApplied && (
                    <p className="text-[11px] text-primary font-semibold mt-1.5">
                      ✓ FROST25 applied — 25% off
                    </p>
                  )}
                  {promoError && (
                    <p className="text-[11px] text-error font-semibold mt-1.5">{promoError}</p>
                  )}
                </div>

                {/* Line items */}
                <div className="space-y-2 text-sm border-t border-deep-navy/10 pt-4">
                  {[
                    { label: "Subtotal", val: `$${subtotal.toFixed(2)}` },
                    ...(promoApplied ? [{ label: "Discount (25%)", val: `-$${discount.toFixed(2)}` }] : []),
                    { label: "Shipping", val: shipping === 0 ? "Free" : `$${shipping.toFixed(2)}` },
                    { label: "Tax (15%)", val: `$${tax.toFixed(2)}` },
                  ].map(({ label, val }) => (
                    <div key={label} className="flex justify-between text-on-surface-variant">
                      <span>{label}</span>
                      <span className={label === "Discount (25%)" ? "text-primary font-semibold" : ""}>
                        {val}
                      </span>
                    </div>
                  ))}
                  <div className="border-t-2 border-deep-navy pt-3 flex justify-between font-bold text-deep-navy text-base">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
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

      <Footer />
    </div>
  );
}
