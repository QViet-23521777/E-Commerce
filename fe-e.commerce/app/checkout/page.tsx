"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronRight,
  ChevronLeft,
  CreditCard,
  Truck,
  ShoppingBag,
  CheckCircle2,
  Lock,
  Tag,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

type Step = 0 | 1 | 2 | 3;
type PayMethod = "card" | "apple" | "google";

const STEPS = [
  { label: "Cart", icon: ShoppingBag },
  { label: "Delivery", icon: Truck },
  { label: "Payment", icon: CreditCard },
  { label: "Confirm", icon: CheckCircle2 },
];

const CART_ITEMS = [
  {
    id: 1,
    name: "V60 Ceramic Dripper",
    variant: "White / 02",
    price: 145.5,
    qty: 1,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDuYPHC5ZucXkMLQdPzRtMwA5fwVf4vodbpXzIAj1S6x4XKjM2fAlF7-u-Z-AU3MWyNLivbqT5NJVyhECEfYebs0h9qutzgtz955zo46r6UKJ_32aNcoy_7_fNGgqJzQY7CDeFPibKGTiQOwhV3lPfA9eC6I9W4_XCDYFh4FgdiwfC_x7VTV8hox8fmMw3BIDeUe8i7OCB11qcswwjZTdPA83Cj2SJY5IbVEXpLsg6dQg6vLyyj5o-lN_LUe6-ocebtxqygqhHLieN3",
  },
  {
    id: 2,
    name: "Merino Wool Throw",
    variant: "Frost Grey / L",
    price: 220.0,
    qty: 1,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBQnttJbzpiC4QRt8GQvgN_K-LPivaoWxQbJdHzb6kosJGev_3CVhSB--6w9rlF8agmBGyseznO-fU5e1Y510XVbDyymty-zPapnIeQH0i2v-czpBGaZUG686ds_gVZg8Yt2DZzTsztQzLti-onPa5W4qfl6OsvhvxKFZgqmbBaWe72wtwVwwZQuR9HEBPYH3t82nWIzD50ODtN_69mApTqtSBSltL2RWLb-lr-ZAJHgfzLF2T9M8XCj94gw-qjt3zBlxgWDXT7jHus",
  },
];

const DELIVERY_FIELDS = [
  { key: "fn", label: "First Name", span: 1 },
  { key: "ln", label: "Last Name", span: 1 },
  { key: "email", label: "Email Address", span: 2 },
  { key: "phone", label: "Phone Number", span: 2 },
  { key: "line1", label: "Street Address", span: 2 },
  { key: "line2", label: "Apartment / Suite (optional)", span: 2 },
  { key: "city", label: "City", span: 1 },
  { key: "zip", label: "ZIP / Postal Code", span: 1 },
  { key: "country", label: "Country", span: 2 },
] as const;

export default function CheckoutPage() {
  const [step, setStep] = useState<Step>(0);
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [payMethod, setPayMethod] = useState<PayMethod>("card");
  const [placed, setPlaced] = useState(false);
  const [shipping, setShipping] = useState<"standard" | "express">("standard");

  const subtotal = CART_ITEMS.reduce((s, i) => s + i.price * i.qty, 0);
  const discount = couponApplied ? subtotal * 0.1 : 0;
  const shippingFee = shipping === "express" ? 12 : 0;
  const tax = (subtotal - discount) * 0.15;
  const total = subtotal - discount + shippingFee + tax;

  function applyC() {
    if (coupon.trim().toUpperCase() === "FROST10") setCouponApplied(true);
  }

  if (placed) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-[600px] mx-auto px-4 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{
              opacity: 1,
              scale: 1,
              transition: { duration: 0.5, ease: EASE },
            }}
          >
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: 1,
                transition: { type: "spring", duration: 0.6, bounce: 0.3, delay: 0.1 },
              }}
              className="w-20 h-20 bg-deep-navy rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle2 className="w-10 h-10 text-primary-container" />
            </motion.div>
            <h1 className="text-display-lg-mobile text-on-surface mb-3">
              Order Placed!
            </h1>
            <p className="text-on-surface-variant text-body-md mb-2">
              Your order #4921 has been confirmed.
            </p>
            <p className="text-on-surface-variant text-sm mb-8">
              Confirmation sent to alex.chen@email.com
            </p>
            <div className="relative h-1 bg-surface-container-high rounded-full overflow-hidden mb-8">
              <div className="absolute inset-y-0 left-0 w-full bg-primary-container rounded-full animate-scan" />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/orders/4921"
                className="bg-deep-navy text-primary-container px-6 py-3 rounded-lg text-button"
              >
                Track Order
              </Link>
              <Link
                href="/"
                className="border-2 border-deep-navy text-on-surface px-6 py-3 rounded-lg text-button"
              >
                Continue Shopping
              </Link>
            </div>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-[1280px] mx-auto px-4 sm:px-10 py-12">
        {/* Header */}
        <div className="mb-8">
          <p className="text-label-caps text-primary mb-1">Secure Checkout</p>
          <h1 className="text-display-lg-mobile text-on-surface">Checkout</h1>
        </div>

        {/* Step Progress */}
        <div className="flex items-center mb-10 gap-0">
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            const Icon = s.icon;
            return (
              <div key={s.label} className="flex items-center flex-1">
                <div className="flex items-center gap-2 shrink-0">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
                      done
                        ? "bg-deep-navy border-deep-navy text-primary-container"
                        : active
                        ? "border-deep-navy text-on-surface"
                        : "border-outline-variant text-outline"
                    }`}
                  >
                    {done ? <Icon className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span
                    className={`text-sm font-medium hidden sm:inline transition-colors duration-300 ${
                      active
                        ? "text-on-surface"
                        : done
                        ? "text-on-surface-variant"
                        : "text-outline"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <motion.div
                    animate={{
                      backgroundColor: done ? "#001a41" : "#b9cacb",
                      transition: { duration: 0.4 },
                    }}
                    className="flex-1 h-0.5 mx-2"
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Step Content */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {/* Step 0: Cart */}
              {step === 0 && (
                <motion.div
                  key="cart"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0, transition: { duration: 0.3, ease: EASE } }}
                  exit={{ opacity: 0, x: 16, transition: { duration: 0.2 } }}
                >
                  <h2 className="font-semibold text-on-surface mb-4 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5" /> Your Cart (
                    {CART_ITEMS.length} items)
                  </h2>
                  <div className="space-y-3 mb-6">
                    {CART_ITEMS.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-4 border-2 border-deep-navy rounded-xl p-4 bg-surface-container-lowest"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-20 h-20 rounded-lg object-cover border border-outline-variant shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://placehold.co/80x80/e2e2e2/6a7a7b?text=IMG";
                          }}
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-on-surface">
                            {item.name}
                          </p>
                          <p className="text-sm text-on-surface-variant">
                            {item.variant}
                          </p>
                          <p className="text-sm text-on-surface-variant mt-1">
                            Qty: {item.qty}
                          </p>
                        </div>
                        <p className="font-bold text-on-surface">
                          ${item.price.toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Coupon */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Coupon code — try FROST10"
                        value={coupon}
                        onChange={(e) => setCoupon(e.target.value)}
                        disabled={couponApplied}
                        className="w-full border-2 border-deep-navy rounded-lg pl-9 pr-4 py-2.5 text-sm bg-transparent text-on-surface placeholder:text-on-surface-variant disabled:opacity-50"
                      />
                    </div>
                    <button
                      onClick={applyC}
                      disabled={couponApplied}
                      className={`px-5 py-2.5 rounded-lg text-button transition-all duration-150 disabled:opacity-50 ${
                        couponApplied
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-deep-navy text-primary-container"
                      }`}
                    >
                      {couponApplied ? "Applied ✓" : "Apply"}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 1: Delivery */}
              {step === 1 && (
                <motion.div
                  key="delivery"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0, transition: { duration: 0.3, ease: EASE } }}
                  exit={{ opacity: 0, x: 16, transition: { duration: 0.2 } }}
                >
                  <h2 className="font-semibold text-on-surface mb-5 flex items-center gap-2">
                    <Truck className="w-5 h-5" /> Delivery Details
                  </h2>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {DELIVERY_FIELDS.map(({ key, label, span }) => (
                      <div
                        key={key}
                        className={span === 2 ? "col-span-2" : ""}
                      >
                        <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                          {label}
                        </label>
                        <input
                          type="text"
                          className="w-full border-2 border-deep-navy rounded-lg px-4 py-2.5 text-sm bg-transparent text-on-surface"
                        />
                      </div>
                    ))}
                  </div>

                  <h3 className="font-semibold text-on-surface mb-3">
                    Shipping Method
                  </h3>
                  <div className="space-y-2">
                    {[
                      {
                        id: "standard" as const,
                        label: "Standard Shipping",
                        sub: "5–7 business days",
                        price: "Free",
                      },
                      {
                        id: "express" as const,
                        label: "Express Shipping",
                        sub: "1–2 business days",
                        price: "$12.00",
                      },
                    ].map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex items-center gap-3 border-2 rounded-xl px-4 py-3 cursor-pointer transition-all duration-150 ${
                          shipping === opt.id
                            ? "border-deep-navy bg-surface-container"
                            : "border-outline-variant hover:border-deep-navy"
                        }`}
                      >
                        <input
                          type="radio"
                          name="shipping"
                          checked={shipping === opt.id}
                          onChange={() => setShipping(opt.id)}
                          className="accent-deep-navy"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm text-on-surface">
                            {opt.label}
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            {opt.sub}
                          </p>
                        </div>
                        <p className="font-semibold text-sm text-on-surface">
                          {opt.price}
                        </p>
                      </label>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Payment */}
              {step === 2 && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0, transition: { duration: 0.3, ease: EASE } }}
                  exit={{ opacity: 0, x: 16, transition: { duration: 0.2 } }}
                >
                  <h2 className="font-semibold text-on-surface mb-5 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" /> Payment
                  </h2>

                  {/* Payment Tabs */}
                  <div className="flex border-2 border-deep-navy rounded-xl overflow-hidden mb-5">
                    {(
                      [
                        { id: "card", label: "Card" },
                        { id: "apple", label: "Apple Pay" },
                        { id: "google", label: "Google Pay" },
                      ] as { id: PayMethod; label: string }[]
                    ).map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setPayMethod(m.id)}
                        className={`flex-1 py-2.5 text-sm font-semibold transition-all duration-150 ${
                          payMethod === m.id
                            ? "bg-deep-navy text-primary-container"
                            : "text-on-surface hover:bg-surface-container"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    {payMethod === "card" && (
                      <motion.div
                        key="card"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0, transition: { duration: 0.25, ease: EASE } }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                      >
                        {[
                          { label: "Cardholder Name", placeholder: "Alex Chen", mono: false },
                          { label: "Card Number", placeholder: "0000 0000 0000 0000", mono: true },
                        ].map(({ label, placeholder, mono }) => (
                          <div key={label}>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                              {label}
                            </label>
                            <input
                              type="text"
                              placeholder={placeholder}
                              className={`w-full border-2 border-deep-navy rounded-lg px-4 py-2.5 text-sm bg-transparent text-on-surface placeholder:text-on-surface-variant ${mono ? "font-mono" : ""}`}
                            />
                          </div>
                        ))}
                        <div className="grid grid-cols-2 gap-4">
                          {[
                            { label: "Expiry", placeholder: "MM / YY" },
                            { label: "CVV", placeholder: "•••" },
                          ].map(({ label, placeholder }) => (
                            <div key={label}>
                              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                                {label}
                              </label>
                              <input
                                type="text"
                                placeholder={placeholder}
                                className="w-full border-2 border-deep-navy rounded-lg px-4 py-2.5 text-sm bg-transparent text-on-surface placeholder:text-on-surface-variant font-mono"
                              />
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {(payMethod === "apple" || payMethod === "google") && (
                      <motion.div
                        key={payMethod}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0, transition: { duration: 0.25, ease: EASE } }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center border-2 border-dashed border-outline-variant rounded-xl py-12 gap-3"
                      >
                        <div className="w-14 h-14 bg-deep-navy rounded-2xl flex items-center justify-center">
                          <span className="text-primary-container font-bold text-2xl">
                            {payMethod === "apple" ? "✦" : "G"}
                          </span>
                        </div>
                        <p className="font-semibold text-on-surface">
                          {payMethod === "apple" ? "Apple Pay" : "Google Pay"}
                        </p>
                        <p className="text-sm text-on-surface-variant text-center max-w-xs">
                          You&apos;ll be prompted to authenticate when you place your order.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-center gap-2 mt-4 text-xs text-on-surface-variant">
                    <Lock className="w-3 h-3 shrink-0" />
                    <span>
                      Your payment information is encrypted and never stored.
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Confirm */}
              {step === 3 && (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0, transition: { duration: 0.3, ease: EASE } }}
                  exit={{ opacity: 0, x: 16, transition: { duration: 0.2 } }}
                >
                  <h2 className="font-semibold text-on-surface mb-5">
                    Review & Confirm
                  </h2>
                  <div className="space-y-3">
                    {[
                      {
                        label: "Items",
                        content: CART_ITEMS.map((i) => i.name).join(", "),
                      },
                      {
                        label: "Delivery Address",
                        content: "14 Fjord Street, Oslo 0150, Norway",
                      },
                      {
                        label: "Shipping Method",
                        content:
                          shipping === "standard"
                            ? "Standard Shipping (5–7 days) — Free"
                            : "Express Shipping (1–2 days) — $12.00",
                      },
                      {
                        label: "Payment",
                        content:
                          payMethod === "card"
                            ? "Credit Card ending in ••••"
                            : payMethod === "apple"
                            ? "Apple Pay"
                            : "Google Pay",
                      },
                      {
                        label: "Order Total",
                        content: `$${total.toFixed(2)} (incl. tax)`,
                      },
                    ].map(({ label, content }) => (
                      <div
                        key={label}
                        className="border-2 border-deep-navy rounded-xl p-4 bg-surface-container-lowest"
                      >
                        <p className="text-label-caps text-on-surface-variant mb-1">
                          {label}
                        </p>
                        <p className="text-sm text-on-surface font-medium">
                          {content}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              {step > 0 ? (
                <button
                  onClick={() => setStep((s) => (s - 1) as Step)}
                  className="flex items-center gap-2 border-2 border-deep-navy text-on-surface px-5 py-2.5 rounded-lg text-button"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              ) : (
                <Link
                  href="/search"
                  className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors duration-150"
                >
                  <ChevronLeft className="w-4 h-4" /> Continue Shopping
                </Link>
              )}

              {step < 3 ? (
                <button
                  onClick={() => setStep((s) => (s + 1) as Step)}
                  className="flex items-center gap-2 bg-deep-navy text-primary-container px-6 py-2.5 rounded-lg text-button"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setPlaced(true)}
                  className="flex items-center gap-2 bg-primary-container text-deep-navy px-6 py-2.5 rounded-lg text-button font-bold"
                >
                  Place Order <CheckCircle2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { duration: 0.4, ease: EASE, delay: 0.1 },
            }}
            className="border-2 border-deep-navy rounded-xl p-5 bg-surface-container-lowest h-fit"
          >
            <h3 className="font-semibold text-on-surface mb-4">
              Order Summary
            </h3>
            <div className="space-y-3 mb-4">
              {CART_ITEMS.map((item) => (
                <div key={item.id} className="flex gap-3 items-start">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-12 h-12 rounded-lg object-cover border border-outline-variant shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://placehold.co/48x48/e2e2e2/6a7a7b?text=IMG";
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-on-surface truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {item.variant}
                    </p>
                  </div>
                  <p className="text-xs font-bold text-on-surface shrink-0">
                    ${item.price.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
            <div className="border-t border-outline-variant pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-on-surface-variant">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {couponApplied && (
                <div className="flex justify-between text-primary">
                  <span>Discount (FROST10)</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-on-surface-variant">
                <span>Shipping</span>
                <span>{shippingFee === 0 ? "Free" : `$${shippingFee.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <span>Tax (15%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-on-surface border-t border-outline-variant pt-2">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
