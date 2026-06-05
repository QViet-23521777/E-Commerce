"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronRight,
  ChevronLeft,
  Wallet as WalletIcon,
  Truck,
  ShoppingBag,
  CheckCircle2,
  Lock,
  Tag,
  Smartphone,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { formatVND, fetchShopByProduct } from "@/lib/products";
import {
  useCart,
  cartSubtotal,
  getAppliedCoupon,
  setAppliedCoupon,
  clearCart,
  saveOrderSnapshot,
  type CartItem,
} from "@/lib/cart";
import { validatePromotion, redeemPromotion, type PromotionValidation } from "@/lib/promotions";
import { walletCheckout, createMomoPayment } from "@/lib/payments";
import { fetchWallet, type Wallet } from "@/lib/wallet";
import { isLoggedIn, getUser } from "@/lib/auth";
import { flushActivities } from "@/lib/activity";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];
const SHIPPING_THRESHOLD = 500000;
const SHIPPING_FEE = 25000;

type Step = 0 | 1 | 2 | 3;
type PayMethod = "wallet" | "momo";

const STEPS = [
  { label: "Cart", icon: ShoppingBag },
  { label: "Delivery", icon: Truck },
  { label: "Payment", icon: WalletIcon },
  { label: "Confirm", icon: CheckCircle2 },
];

const DELIVERY_FIELDS = [
  { key: "fn", label: "First Name", span: 1 },
  { key: "ln", label: "Last Name", span: 1 },
  { key: "phone", label: "Phone Number", span: 2 },
  { key: "line1", label: "Street Address", span: 2 },
  { key: "city", label: "City", span: 1 },
  { key: "zip", label: "ZIP / Postal Code", span: 1 },
] as const;

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCart();

  const [step, setStep] = useState<Step>(0);
  const [payMethod, setPayMethod] = useState<PayMethod>("wallet");
  const [shipping, setShipping] = useState<"standard" | "express">("standard");

  // Controlled delivery fields (keyed by DELIVERY_FIELDS[].key).
  const [delivery, setDelivery] = useState<Record<string, string>>({
    fn: "",
    ln: "",
    phone: "",
    line1: "",
    city: "",
    zip: "",
  });
  const deliveryComplete = useMemo(
    () =>
      ["fn", "ln", "phone", "line1", "city"].every((k) =>
        (delivery[k] ?? "").trim(),
      ),
    [delivery],
  );

  const [validation, setValidation] = useState<PromotionValidation | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);

  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState("");

  const subtotal = useMemo(() => cartSubtotal(items), [items]);
  const promoItems = useMemo(
    () => items.map((i) => ({ productId: i.productId, quantity: i.qty, unitPrice: i.price })),
    [items],
  );

  // Re-validate the carried coupon and load the wallet (auth users only).
  useEffect(() => {
    if (!isLoggedIn()) return;
    fetchWallet().then(setWallet).catch(() => setWallet(null));
  }, []);

  useEffect(() => {
    const code = getAppliedCoupon();
    if (!code || items.length === 0 || !isLoggedIn()) return;
    validatePromotion(code, promoItems)
      .then(setValidation)
      .catch(() => {
        setValidation(null);
        setAppliedCoupon(null);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  const discount = validation?.discountAmount ?? 0;
  const afterDiscount = Math.max(0, subtotal - discount);
  const expressFee = shipping === "express" ? 40000 : 0;
  const baseShipping = afterDiscount >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const shippingFee = baseShipping + expressFee;
  const total = afterDiscount + shippingFee;

  const insufficientWallet =
    payMethod === "wallet" && wallet !== null && wallet.balance < total;

  const placeOrder = useCallback(async () => {
    setOrderError("");
    if (!isLoggedIn()) {
      router.push("/login?redirect=/checkout");
      return;
    }
    if (items.length === 0) return;

    setPlacing(true);
    const couponCode = getAppliedCoupon();
    try {
      // Record the redemption (also re-checks eligibility server-side).
      if (couponCode && validation) {
        try {
          await redeemPromotion(couponCode, promoItems);
        } catch {
          // Non-fatal: proceed with payment even if redemption bookkeeping fails.
        }
      }

      const orderInfo = `MiniSupermarket order · ${items.length} item${items.length > 1 ? "s" : ""}`;
      const snapshotBase = {
        items: items as CartItem[],
        subtotal,
        discount,
        couponCode: couponCode ?? undefined,
        total,
        createdAt: new Date().toISOString(),
      };

      // Resolve the inventory linkage for EVERY line so the order is always
      // seller-attributed and stock-deducting — never silently amount-only.
      // The catalog `productId` is always present, so re-resolve any line whose
      // `inventoryId` is missing (added before the shop lookup, merged from a
      // guest cart, or where the lookup hadn't finished). A single unlinked
      // line must NOT collapse the whole order to amount-only (the old bug that
      // hid orders from sellers).
      const inventoryIds = await Promise.all(
        items.map(async (i) =>
          i.inventoryId ||
          (await fetchShopByProduct(i.productId).catch(() => null))?.inventoryId,
        ),
      );
      const checkoutItems = items
        .map((i, idx) => ({ inventoryId: inventoryIds[idx], quantity: i.qty }))
        .filter(
          (x): x is { inventoryId: string; quantity: number } => !!x.inventoryId,
        )
        .map((x) => ({ productId: x.inventoryId, quantity: x.quantity }));

      const shippingAddress = {
        fullName: `${delivery.fn} ${delivery.ln}`.trim(),
        phone: delivery.phone,
        line1: delivery.line1,
        city: delivery.city,
        zip: delivery.zip,
      };

      // Always charge the storefront `total` (it carries shipping + discount,
      // which the backend can't recompute). When item lines resolved, send them
      // too so the order is recorded per-seller and stock is deducted; the
      // backend now accepts `items` alongside `amount`.
      const checkoutBase =
        checkoutItems.length > 0
          ? {
              amount: total,
              orderInfo,
              items: checkoutItems,
              shippingAddress,
              shippingMethod: shipping,
            }
          : {
              amount: total,
              orderInfo,
              shippingAddress,
              shippingMethod: shipping,
            };

      if (payMethod === "wallet") {
        const payment = await walletCheckout(checkoutBase);
        saveOrderSnapshot({ orderId: payment.orderId, method: "wallet", ...snapshotBase });
        clearCart();
        setAppliedCoupon(null);
        // Order is confirmed now → the payment service has recorded "buy"
        // activities; flush them so "Customers also bought" can learn from them.
        const u = getUser();
        if (u?.userId) flushActivities(u.userId);
        router.push(`/order-confirmation?orderId=${encodeURIComponent(payment.orderId)}`);
      } else {
        const payment = await createMomoPayment(checkoutBase);
        saveOrderSnapshot({ orderId: payment.orderId, method: "momo", ...snapshotBase });
        clearCart();
        setAppliedCoupon(null);
        const url = `/order-confirmation?orderId=${encodeURIComponent(payment.orderId)}`;
        // Hand off to MoMo's pay page when available; the confirmation page
        // polls the live status either way.
        if (payment.payUrl) {
          router.push(`${url}&payUrl=${encodeURIComponent(payment.payUrl)}`);
        } else {
          router.push(url);
        }
      }
    } catch (err) {
      const e = err as { status?: number; message?: string };
      if (e.status === 402) {
        setOrderError("Insufficient wallet balance. Top up your wallet or use MoMo.");
      } else {
        setOrderError(e.message || "Payment failed. Please try again.");
      }
      setPlacing(false);
    }
  }, [items, payMethod, total, subtotal, discount, validation, promoItems, router, delivery, shipping]);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 border-2 border-deep-navy rounded-2xl flex items-center justify-center mx-auto mb-6 bg-surface-container">
              <ShoppingBag className="w-9 h-9 text-on-surface-variant" />
            </div>
            <h1 className="text-headline-md text-deep-navy mb-2">Nothing to check out</h1>
            <p className="text-sm text-on-surface-variant mb-8">
              Your cart is empty. Add a few items first.
            </p>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 bg-primary-container text-deep-navy text-label-caps font-bold px-8 py-3.5 rounded-xl border-2 border-transparent hover:border-deep-navy transition-colors active:scale-[0.97]"
            >
              Browse Collections
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
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
                      active ? "text-on-surface" : done ? "text-on-surface-variant" : "text-outline"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <motion.div
                    animate={{ backgroundColor: done ? "#001a41" : "#b9cacb", transition: { duration: 0.4 } }}
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
                    <ShoppingBag className="w-5 h-5" /> Your Cart ({items.length} items)
                  </h2>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.productId}
                        className="flex gap-4 border-2 border-deep-navy rounded-xl p-4 bg-surface-container-lowest"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
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
                          <p className="font-semibold text-on-surface">{item.name}</p>
                          {item.variant && (
                            <p className="text-sm text-on-surface-variant">{item.variant}</p>
                          )}
                          <p className="text-sm text-on-surface-variant mt-1">Qty: {item.qty}</p>
                        </div>
                        <p className="font-bold text-on-surface">{formatVND(item.price * item.qty)}</p>
                      </div>
                    ))}
                  </div>
                  {validation && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-primary border-2 border-primary/20 bg-primary/5 rounded-xl px-4 py-3">
                      <Tag className="w-4 h-4" />
                      Coupon <strong>{validation.promotion.code}</strong> applied — you save{" "}
                      {formatVND(validation.discountAmount)}.
                    </div>
                  )}
                  <Link
                    href="/cart"
                    className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface mt-4 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" /> Edit cart / coupon
                  </Link>
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
                      <div key={key} className={span === 2 ? "col-span-2" : ""}>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                          {label}
                          {key !== "zip" && <span className="text-error"> *</span>}
                        </label>
                        <input
                          type="text"
                          value={delivery[key] ?? ""}
                          onChange={(e) =>
                            setDelivery((d) => ({ ...d, [key]: e.target.value }))
                          }
                          className="w-full border-2 border-deep-navy rounded-lg px-4 py-2.5 text-sm bg-transparent text-on-surface focus:border-primary-container focus:outline-none transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                  {!deliveryComplete && (
                    <p className="text-xs text-on-surface-variant mb-6 -mt-3">
                      Fill in all required fields to continue.
                    </p>
                  )}

                  <h3 className="font-semibold text-on-surface mb-3">Shipping Method</h3>
                  <div className="space-y-2">
                    {[
                      { id: "standard" as const, label: "Standard Shipping", sub: "5–7 business days", price: baseShipping === 0 ? "Free" : formatVND(SHIPPING_FEE) },
                      { id: "express" as const, label: "Express Shipping", sub: "1–2 business days", price: `+${formatVND(40000)}` },
                    ].map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex items-center gap-3 border-2 rounded-xl px-4 py-3 cursor-pointer transition-all duration-150 ${
                          shipping === opt.id ? "border-deep-navy bg-surface-container" : "border-outline-variant hover:border-deep-navy"
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
                          <p className="font-medium text-sm text-on-surface">{opt.label}</p>
                          <p className="text-xs text-on-surface-variant">{opt.sub}</p>
                        </div>
                        <p className="font-semibold text-sm text-on-surface">{opt.price}</p>
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
                    <WalletIcon className="w-5 h-5" /> Payment Method
                  </h2>

                  {/* Payment Tabs: Wallet + MoMo */}
                  <div className="flex border-2 border-deep-navy rounded-xl overflow-hidden mb-5">
                    {(
                      [
                        { id: "wallet", label: "Wallet" },
                        { id: "momo", label: "MoMo" },
                      ] as { id: PayMethod; label: string }[]
                    ).map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setPayMethod(m.id)}
                        className={`flex-1 py-2.5 text-sm font-semibold transition-all duration-150 ${
                          payMethod === m.id ? "bg-deep-navy text-primary-container" : "text-on-surface hover:bg-surface-container"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    {payMethod === "wallet" ? (
                      <motion.div
                        key="wallet"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0, transition: { duration: 0.25, ease: EASE } }}
                        exit={{ opacity: 0 }}
                        className="border-2 border-deep-navy rounded-xl p-5 bg-deep-navy text-white"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-primary-container/80">
                              Wallet Balance
                            </p>
                            <p className="text-2xl font-bold mt-1">
                              {wallet ? formatVND(wallet.balance) : "—"}
                            </p>
                          </div>
                          <div className="w-12 h-12 rounded-xl bg-primary-container/15 flex items-center justify-center">
                            <WalletIcon className="w-6 h-6 text-primary-container" />
                          </div>
                        </div>
                        {insufficientWallet ? (
                          <div className="mt-4 flex items-center gap-2 text-sm bg-error/20 text-error-container rounded-lg px-3 py-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>
                              Not enough balance for {formatVND(total)}.{" "}
                              <Link href="/profile" className="underline font-semibold">Top up</Link>.
                            </span>
                          </div>
                        ) : (
                          <p className="mt-3 text-xs text-primary-container/70">
                            {formatVND(total)} will be deducted instantly on order.
                          </p>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="momo"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0, transition: { duration: 0.25, ease: EASE } }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center border-2 border-dashed border-outline-variant rounded-xl py-12 gap-3"
                      >
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#a50064" }}>
                          <Smartphone className="w-7 h-7 text-white" />
                        </div>
                        <p className="font-semibold text-on-surface">Pay with MoMo</p>
                        <p className="text-sm text-on-surface-variant text-center max-w-xs">
                          You&apos;ll be taken to MoMo to authorize {formatVND(total)}. Your order
                          stays pending until payment is confirmed.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-center gap-2 mt-4 text-xs text-on-surface-variant">
                    <Lock className="w-3 h-3 shrink-0" />
                    <span>Payments are processed securely. We never store card details.</span>
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
                  <h2 className="font-semibold text-on-surface mb-5">Review & Confirm</h2>
                  <div className="space-y-3">
                    {[
                      { label: "Items", content: items.map((i) => `${i.name} ×${i.qty}`).join(", ") },
                      {
                        label: "Shipping Method",
                        content:
                          shipping === "standard"
                            ? `Standard (5–7 days) — ${baseShipping === 0 ? "Free" : formatVND(SHIPPING_FEE)}`
                            : `Express (1–2 days) — ${formatVND(SHIPPING_FEE + 40000)}`,
                      },
                      { label: "Payment", content: payMethod === "wallet" ? "MiniSupermarket Wallet" : "MoMo e-wallet" },
                      ...(validation ? [{ label: "Coupon", content: `${validation.promotion.code} (−${formatVND(discount)})` }] : []),
                      { label: "Order Total", content: formatVND(total) },
                    ].map(({ label, content }) => (
                      <div key={label} className="border-2 border-deep-navy rounded-xl p-4 bg-surface-container-lowest">
                        <p className="text-label-caps text-on-surface-variant mb-1">{label}</p>
                        <p className="text-sm text-on-surface font-medium">{content}</p>
                      </div>
                    ))}
                  </div>
                  {orderError && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-error border-2 border-error/30 bg-error/5 rounded-xl px-4 py-3">
                      <AlertCircle className="w-4 h-4 shrink-0" /> {orderError}
                    </div>
                  )}
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
                  href="/cart"
                  className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors duration-150"
                >
                  <ChevronLeft className="w-4 h-4" /> Back to Cart
                </Link>
              )}

              {step < 3 ? (
                <button
                  onClick={() => setStep((s) => (s + 1) as Step)}
                  disabled={step === 1 && !deliveryComplete}
                  className="flex items-center gap-2 bg-deep-navy text-primary-container px-6 py-2.5 rounded-lg text-button disabled:opacity-50"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={placeOrder}
                  disabled={placing || (payMethod === "wallet" && insufficientWallet)}
                  className="flex items-center gap-2 bg-primary-container text-deep-navy px-6 py-2.5 rounded-lg text-button font-bold disabled:opacity-50"
                >
                  {placing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Processing…
                    </>
                  ) : (
                    <>
                      Place Order <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE, delay: 0.1 } }}
            className="border-2 border-deep-navy rounded-xl p-5 bg-surface-container-lowest h-fit"
          >
            <h3 className="font-semibold text-on-surface mb-4">Order Summary</h3>
            <div className="space-y-3 mb-4">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-3 items-start">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
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
                    <p className="text-xs font-semibold text-on-surface truncate">{item.name}</p>
                    <p className="text-xs text-on-surface-variant">Qty {item.qty}</p>
                  </div>
                  <p className="text-xs font-bold text-on-surface shrink-0">
                    {formatVND(item.price * item.qty)}
                  </p>
                </div>
              ))}
            </div>
            <div className="border-t border-outline-variant pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-on-surface-variant">
                <span>Subtotal</span>
                <span>{formatVND(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-primary">
                  <span>Discount {validation ? `(${validation.promotion.code})` : ""}</span>
                  <span>-{formatVND(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-on-surface-variant">
                <span>Shipping</span>
                <span>{shippingFee === 0 ? "Free" : formatVND(shippingFee)}</span>
              </div>
              <div className="flex justify-between font-bold text-on-surface border-t border-outline-variant pt-2">
                <span>Total</span>
                <span>{formatVND(total)}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
