"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  CheckCircle2,
  Package,
  ArrowRight,
  Home,
  Clock,
  XCircle,
  Loader2,
  Smartphone,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatVND } from "@/lib/products";
import { getOrderSnapshot, type OrderSnapshot } from "@/lib/cart";
import { getPaymentStatus, type Payment, type PaymentStatus } from "@/lib/payments";
import { getUser } from "@/lib/auth";
import { postActivity } from "@/lib/activity";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

const STATUS_META: Record<
  PaymentStatus,
  { label: string; tone: string; icon: typeof CheckCircle2; ring: string; heading: string }
> = {
  paid: {
    label: "Payment Confirmed",
    tone: "text-primary",
    icon: CheckCircle2,
    ring: "border-primary-container",
    heading: "Thank you!",
  },
  pending: {
    label: "Awaiting Payment",
    tone: "text-on-surface-variant",
    icon: Clock,
    ring: "border-outline-variant",
    heading: "Almost there",
  },
  failed: {
    label: "Payment Failed",
    tone: "text-error",
    icon: XCircle,
    ring: "border-error/40",
    heading: "Payment failed",
  },
};

function ConfirmationContent() {
  const params = useSearchParams();
  const orderId = params.get("orderId");
  const payUrl = params.get("payUrl");

  const [payment, setPayment] = useState<Payment | null>(null);
  const [snapshot, setSnapshot] = useState<OrderSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    setSnapshot(getOrderSnapshot(orderId));

    let active = true;
    const load = async () => {
      const p = await getPaymentStatus(orderId);
      if (!active) return;
      setPayment(p);
      setLoading(false);
      // Stop polling once settled.
      if (p && p.status !== "pending" && pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
    load();
    // Poll while a MoMo payment is still pending.
    pollRef.current = setInterval(load, 4000);
    return () => {
      active = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [orderId]);

  const trackedRef = useRef(false);
  useEffect(() => {
    if (payment?.status !== "paid" || trackedRef.current || !snapshot) return;
    const user = getUser();
    if (!user) return;
    trackedRef.current = true;
    for (const item of snapshot.items) {
      if (item.productId) {
        postActivity({ userId: user.userId, activity: "buy", productId: item.productId });
      }
    }
  }, [payment?.status, snapshot]);

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center px-4 py-24">
        <Loader2 className="w-8 h-8 animate-spin text-deep-navy" />
      </main>
    );
  }

  if (!orderId || !payment) {
    return (
      <main className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 border-2 border-deep-navy rounded-2xl flex items-center justify-center mx-auto mb-6 bg-surface-container">
            <Package className="w-9 h-9 text-on-surface-variant" />
          </div>
          <h1 className="text-headline-md text-deep-navy mb-2">Order not found</h1>
          <p className="text-sm text-on-surface-variant mb-8">
            We couldn&apos;t locate this order. It may have expired or never completed.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-primary-container text-deep-navy text-label-caps font-bold px-8 py-3.5 rounded-xl border-2 border-transparent hover:border-deep-navy transition-colors"
          >
            Back to Shop
          </Link>
        </div>
      </main>
    );
  }

  const meta = STATUS_META[payment.status];
  const StatusIcon = meta.icon;
  const shortId = payment.orderId.slice(0, 8).toUpperCase();
  const lineItems = snapshot?.items ?? [];

  return (
    <main className="flex-1 max-w-[1280px] mx-auto px-4 sm:px-10 py-16 w-full">
      <div className="max-w-2xl mx-auto">
        {/* Status mark */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1], delay: 0.1 }}
          className="flex justify-center mb-8"
        >
          <div className="relative">
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center border-4 border-deep-navy ${
                payment.status === "paid"
                  ? "bg-primary-container"
                  : payment.status === "failed"
                  ? "bg-error-container"
                  : "bg-surface-container"
              }`}
            >
              <StatusIcon className="w-12 h-12 text-deep-navy" strokeWidth={2} />
            </div>
            {payment.status === "paid" && (
              <motion.div
                initial={{ scale: 1, opacity: 0.4 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                className="absolute inset-0 rounded-full border-2 border-primary-container"
              />
            )}
          </div>
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE, delay: 0.25 }}
          className="text-center mb-10"
        >
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <div className="h-px w-8 bg-primary-container flex-shrink-0" />
            <p className={`text-label-caps ${meta.tone}`}>{meta.label}</p>
            <div className="h-px w-8 bg-primary-container flex-shrink-0" />
          </div>
          <h1 className="text-display-lg-mobile text-deep-navy">{meta.heading}</h1>
          <p className="text-on-surface-variant mt-2 text-sm">
            Order <span className="font-bold text-deep-navy">#{shortId}</span>{" "}
            {payment.status === "paid"
              ? "has been placed and paid."
              : payment.status === "failed"
              ? "could not be completed."
              : "is awaiting payment confirmation."}
          </p>
        </motion.div>

        {/* Pending MoMo CTA */}
        {payment.status === "pending" && payUrl && (
          <motion.a
            href={payUrl}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE, delay: 0.3 }}
            className="flex items-center justify-center gap-2 h-12 mb-6 text-white text-label-caps font-bold rounded-xl"
            style={{ backgroundColor: "#a50064" }}
          >
            <Smartphone className="w-4 h-4" /> Complete payment on MoMo
          </motion.a>
        )}
        {payment.status === "pending" && (
          <p className="text-center text-xs text-on-surface-variant -mt-2 mb-6 flex items-center justify-center gap-1.5">
            <Loader2 className="w-3 h-3 animate-spin" /> Checking status automatically…
          </p>
        )}

        {/* Order card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE, delay: 0.35 }}
          className="bg-white border-2 border-deep-navy rounded-2xl overflow-hidden mb-6"
        >
          <div className="h-1 bg-primary-container w-full" />
          <div className="p-6 space-y-6">
            {/* Items */}
            {lineItems.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">
                  Items Ordered
                </p>
                <div className="space-y-3">
                  {lineItems.map((item) => (
                    <div key={item.productId} className="flex gap-3 items-center">
                      <div className="w-14 h-14 border border-deep-navy/15 rounded-xl bg-surface-container-low p-2 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://placehold.co/56x56/e2e2e2/6a7a7b?text=IMG";
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-deep-navy truncate">{item.name}</p>
                        <p className="text-xs text-on-surface-variant">Qty {item.qty}</p>
                      </div>
                      <p className="text-sm font-bold text-deep-navy shrink-0">
                        {formatVND(item.price * item.qty)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Totals */}
            <div className="border-t border-deep-navy/10 pt-4 space-y-2 text-sm">
              {snapshot && (
                <>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Subtotal</span>
                    <span>{formatVND(snapshot.subtotal)}</span>
                  </div>
                  {snapshot.discount > 0 && (
                    <div className="flex justify-between text-primary">
                      <span>Discount {snapshot.couponCode ? `(${snapshot.couponCode})` : ""}</span>
                      <span>-{formatVND(snapshot.discount)}</span>
                    </div>
                  )}
                </>
              )}
              <div className="flex justify-between items-center border-t-2 border-deep-navy pt-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Amount {payment.status === "paid" ? "Paid" : "Due"}
                </span>
                <span className="text-xl font-bold text-deep-navy">{formatVND(payment.amount)}</span>
              </div>
              <div className="flex justify-between text-xs text-on-surface-variant pt-1">
                <span>Payment Method</span>
                <span className="font-semibold text-deep-navy">
                  {snapshot?.method === "momo" ? "MoMo" : "Wallet"}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <Link
            href="/profile"
            className="flex-1 flex items-center justify-center gap-2 h-12 bg-primary-container text-deep-navy text-label-caps font-bold rounded-xl border-2 border-transparent hover:border-deep-navy transition-colors active:scale-[0.97]"
          >
            View Activity
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 h-12 border-2 border-deep-navy text-deep-navy text-label-caps font-bold rounded-xl hover:bg-surface-container transition-colors active:scale-[0.97]"
          >
            <Home className="w-4 h-4" />
            Back to Shop
          </Link>
        </motion.div>
      </div>
    </main>
  );
}

export default function OrderConfirmationPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Suspense
        fallback={
          <main className="flex-1 flex items-center justify-center px-4 py-24">
            <Loader2 className="w-8 h-8 animate-spin text-deep-navy" />
          </main>
        }
      >
        <ConfirmationContent />
      </Suspense>
    </div>
  );
}
