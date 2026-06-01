"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  Truck,
  CheckCircle2,
  Clock,
  ChevronLeft,
  MapPin,
  Package,
  Star,
  XCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { formatVND } from "@/lib/products";
import {
  fetchOrderById,
  cancelOrder,
  isCancellable,
  FULFILLMENT_LABEL,
  type Order,
} from "@/lib/orders";
import { getOrderSnapshot } from "@/lib/cart";
import { fetchSellerPublicProfile, type PublicShop } from "@/lib/seller";
import { isLoggedIn } from "@/lib/auth";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];
const PLACEHOLDER_IMG = "https://placehold.co/80x80/e2e2e2/6a7a7b?text=IMG";

function fmt(iso?: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

type Step = {
  label: string;
  date: string;
  done: boolean;
  active?: boolean;
  icon: typeof CheckCircle2;
};

function buildSteps(order: Order): Step[] {
  const fs = order.fulfillmentStatus;
  const reached = (s: Order["fulfillmentStatus"][]) => s.includes(fs);
  const paid = order.status === "paid";
  return [
    {
      label: "Order Placed",
      date: fmt(order.createdAt),
      done: true,
      icon: CheckCircle2,
    },
    {
      label: "Payment Confirmed",
      date: paid ? fmt(order.paidAt) || "Paid" : "Pending",
      done: paid,
      icon: CheckCircle2,
    },
    {
      label: "Processing",
      date: reached(["processing", "shipped", "delivered"]) ? "Confirmed" : "",
      done: reached(["processing", "shipped", "delivered"]),
      active: fs === "processing",
      icon: Clock,
    },
    {
      label: "Shipped",
      date: order.trackingNo ? `Tracking ${order.trackingNo}` : "",
      done: reached(["shipped", "delivered"]),
      active: fs === "shipped",
      icon: Truck,
    },
    {
      label: "Delivered",
      date: fs === "delivered" ? "Completed" : "",
      done: fs === "delivered",
      active: fs === "delivered",
      icon: MapPin,
    },
  ];
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params?.id ?? "";
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [shop, setShop] = useState<PublicShop | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [actionError, setActionError] = useState("");

  // Snapshot gives instant line items while the live order loads.
  const snapshot = useMemo(
    () => (orderId ? getOrderSnapshot(orderId) : null),
    [orderId],
  );

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace(`/login?redirect=/orders/${orderId}`);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchOrderById(orderId)
      .then(async (o) => {
        if (cancelled) return;
        if (!o) {
          setNotFound(true);
          return;
        }
        setOrder(o);
        const sellerId = o.items?.find((i) => i.sellerId)?.sellerId;
        if (sellerId) {
          const sp = await fetchSellerPublicProfile(sellerId);
          if (!cancelled) setShop(sp);
        }
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId, router]);

  const handleCancel = async () => {
    if (!order) return;
    setActionError("");
    setCancelling(true);
    try {
      const updated = await cancelOrder(order.orderId);
      setOrder(updated);
    } catch (e) {
      setActionError(
        (e as { message?: string })?.message || "Failed to cancel order.",
      );
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-on-surface-variant" />
        </main>
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <Package className="w-12 h-12 text-outline mx-auto mb-4" />
            <h1 className="text-headline-md text-deep-navy mb-2">
              Order not found
            </h1>
            <p className="text-sm text-on-surface-variant mb-8">
              We couldn&apos;t find this order on your account.
            </p>
            <Link
              href="/orders"
              className="inline-flex items-center gap-2 bg-primary-container text-deep-navy text-label-caps font-bold px-8 py-3.5 rounded-xl border-2 border-transparent hover:border-deep-navy transition-colors"
            >
              Back to Orders
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const items =
    order.items && order.items.length > 0 ? order.items : snapshot?.items ?? [];
  const isCancelled = order.fulfillmentStatus === "cancelled";
  const steps = buildSteps(order);
  const progressPct = Math.round(
    (steps.filter((s) => s.done).length / steps.length) * 100,
  );
  const addr = order.shippingAddress;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-10 py-12">
        {/* Breadcrumb */}
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface mb-6 transition-colors duration-150"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Orders
        </Link>

        <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
          <div>
            <p className="text-label-caps text-primary mb-1">
              Order #{order.orderId.slice(0, 8)}
            </p>
            <h1 className="text-display-lg-mobile text-on-surface">
              Order Details
            </h1>
            <p className="text-on-surface-variant mt-1">
              Placed on {fmt(order.createdAt)}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {isCancellable(order) && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex items-center gap-2 border-2 border-error text-error px-4 py-2.5 rounded-lg text-button hover:bg-error/5 transition-all duration-150 disabled:opacity-50"
              >
                {cancelling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Cancel Order
              </button>
            )}
            {order.fulfillmentStatus === "delivered" && (
              <Link
                href={`/orders/${order.orderId}/review`}
                className="flex items-center gap-2 bg-primary-container text-deep-navy px-4 py-2.5 rounded-lg text-button border-2 border-transparent hover:border-deep-navy transition-all duration-150 active:scale-[0.97]"
              >
                <Star className="w-4 h-4" />
                Write Review
              </Link>
            )}
          </div>
        </div>

        {actionError && (
          <div className="mb-6 flex items-center gap-2 text-sm text-error border-2 border-error/30 bg-error/5 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 shrink-0" /> {actionError}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Tracking + Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tracking / Status Card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { duration: 0.4, ease: EASE },
              }}
              className="border-2 border-deep-navy rounded-xl p-6 bg-surface-container-lowest"
            >
              {isCancelled ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-error rounded-lg flex items-center justify-center shrink-0">
                    <XCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-on-surface">
                      Order Cancelled
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {order.refundedAt
                        ? `Refunded on ${fmt(order.refundedAt)}`
                        : "This order was cancelled."}
                    </p>
                  </div>
                  <span className="text-label-caps border border-error/30 text-error bg-error/5 px-2 py-0.5 rounded-full">
                    Cancelled
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 bg-deep-navy rounded-lg flex items-center justify-center shrink-0">
                      <Truck className="w-5 h-5 text-primary-container" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-on-surface">
                        {FULFILLMENT_LABEL[order.fulfillmentStatus]}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {order.status === "paid"
                          ? "Payment confirmed"
                          : "Awaiting payment"}
                      </p>
                    </div>
                    <span className="text-label-caps border border-tertiary/30 text-tertiary bg-tertiary/5 px-2 py-0.5 rounded-full">
                      {FULFILLMENT_LABEL[order.fulfillmentStatus]}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="relative h-1.5 bg-surface-container-high rounded-full overflow-hidden mb-8">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${progressPct}%`,
                        transition: { duration: 0.8, ease: EASE, delay: 0.3 },
                      }}
                      className="absolute inset-y-0 left-0 bg-primary-container rounded-full"
                    />
                  </div>

                  {/* Steps */}
                  <div className="relative">
                    {steps.map((step, i) => {
                      const Icon = step.icon;
                      const isLast = i === steps.length - 1;
                      const isActive = !!step.active && !step.done;
                      const isFuture = !step.done && !isActive;
                      return (
                        <div key={step.label} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0 ${
                                step.done
                                  ? "bg-deep-navy border-deep-navy"
                                  : isActive
                                    ? "bg-primary-container border-primary-container"
                                    : "bg-surface-container border-outline-variant"
                              }`}
                            >
                              <Icon
                                className={`w-3.5 h-3.5 ${
                                  step.done
                                    ? "text-primary-container"
                                    : isActive
                                      ? "text-deep-navy"
                                      : "text-outline"
                                }`}
                              />
                            </div>
                            {!isLast && (
                              <div
                                className={`w-0.5 my-1 ${
                                  step.done ? "bg-deep-navy" : "bg-outline-variant"
                                }`}
                                style={{ minHeight: "2rem" }}
                              />
                            )}
                          </div>
                          <div className={`pb-4 ${isLast ? "pb-0" : ""}`}>
                            <p
                              className={`font-semibold text-sm ${
                                isFuture
                                  ? "text-on-surface-variant"
                                  : "text-on-surface"
                              }`}
                            >
                              {step.label}
                              {isActive && (
                                <span className="ml-2 text-label-caps text-primary-container bg-deep-navy px-1.5 py-0.5 rounded">
                                  Current
                                </span>
                              )}
                            </p>
                            {step.date && (
                              <p
                                className={`text-xs mt-0.5 ${
                                  isFuture
                                    ? "text-outline"
                                    : "text-on-surface-variant"
                                }`}
                              >
                                {step.date}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </motion.div>

            {/* Items */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { duration: 0.4, ease: EASE, delay: 0.1 },
              }}
              className="border-2 border-deep-navy rounded-xl p-6 bg-surface-container-lowest"
            >
              <h2 className="font-semibold text-on-surface mb-4">
                Items Ordered
              </h2>
              <div className="space-y-4">
                {items.map((item, idx) => {
                  const img =
                    "image" in item
                      ? item.image || PLACEHOLDER_IMG
                      : PLACEHOLDER_IMG;
                  const qty = "quantity" in item ? item.quantity : item.qty;
                  const line =
                    "totalPrice" in item
                      ? item.totalPrice
                      : item.price * item.qty;
                  return (
                    <div
                      key={`${item.name}-${idx}`}
                      className="flex gap-4 items-start"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img || PLACEHOLDER_IMG}
                        alt={item.name}
                        className="w-20 h-20 rounded-lg object-cover border border-outline-variant shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = PLACEHOLDER_IMG;
                        }}
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-on-surface">
                          {item.name}
                        </p>
                        <p className="text-sm text-on-surface-variant mt-1">
                          Qty: {qty}
                        </p>
                      </div>
                      <p className="font-bold text-on-surface">
                        {formatVND(line)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Right: Summary Cards */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { duration: 0.4, ease: EASE, delay: 0.15 },
              }}
              className="border-2 border-deep-navy rounded-xl p-5 bg-surface-container-lowest"
            >
              <h3 className="font-semibold text-on-surface mb-4">
                Order Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-on-surface-variant">
                  <span>Payment</span>
                  <span>
                    {order.partnerCode === "WALLET" ? "Wallet" : "MoMo"}
                  </span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>Status</span>
                  <span className="capitalize">{order.status}</span>
                </div>
                <div className="border-t border-outline-variant pt-2 flex justify-between font-bold text-on-surface">
                  <span>Total</span>
                  <span>{formatVND(order.amount)}</span>
                </div>
              </div>
            </motion.div>

            {addr && (addr.fullName || addr.line1) && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.4, ease: EASE, delay: 0.2 },
                }}
                className="border-2 border-deep-navy rounded-xl p-5 bg-surface-container-lowest"
              >
                <h3 className="font-semibold text-on-surface mb-3">
                  Delivery Address
                </h3>
                <div className="text-sm text-on-surface-variant space-y-0.5">
                  {addr.fullName && (
                    <p className="font-medium text-on-surface">
                      {addr.fullName}
                    </p>
                  )}
                  {addr.line1 && <p>{addr.line1}</p>}
                  {(addr.city || addr.zip) && (
                    <p>
                      {[addr.city, addr.zip].filter(Boolean).join(", ")}
                    </p>
                  )}
                  {addr.phone && <p>{addr.phone}</p>}
                </div>
              </motion.div>
            )}

            {order.trackingNo && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.4, ease: EASE, delay: 0.25 },
                }}
                className="border-2 border-deep-navy rounded-xl p-5 bg-surface-container-lowest"
              >
                <h3 className="font-semibold text-on-surface mb-3">
                  Tracking Number
                </h3>
                <p className="text-sm font-mono text-primary bg-primary/5 px-3 py-2 rounded border border-primary/20 break-all">
                  {order.trackingNo}
                </p>
              </motion.div>
            )}

            {shop && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.4, ease: EASE, delay: 0.3 },
                }}
                className="border-2 border-deep-navy rounded-xl p-5 bg-surface-container-lowest"
              >
                <h3 className="font-semibold text-on-surface mb-3">Sold by</h3>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-deep-navy rounded-lg flex items-center justify-center text-xs font-bold text-primary-container shrink-0 uppercase">
                    {shop.name.slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-on-surface">
                      {shop.name}
                    </p>
                    {shop.address && (
                      <p className="text-xs text-on-surface-variant">
                        {shop.address}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
