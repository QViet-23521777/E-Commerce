"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Package,
  Search,
  ChevronRight,
  SlidersHorizontal,
  Loader2,
} from "lucide-react";
import { formatVND } from "@/lib/products";
import {
  fetchMyOrders,
  FULFILLMENT_LABEL,
  type Order,
  type FulfillmentStatus,
} from "@/lib/orders";
import { isLoggedIn } from "@/lib/auth";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

type StatusFilter = "All" | FulfillmentStatus;

const FILTERS: StatusFilter[] = [
  "All",
  "to_confirm",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const STATUS_CHIP: Record<FulfillmentStatus, string> = {
  to_confirm: "text-on-surface bg-surface-container border-outline-variant",
  processing: "text-secondary bg-secondary/5 border-secondary/20",
  shipped: "text-tertiary bg-tertiary/5 border-tertiary/20",
  delivered: "text-primary bg-primary/5 border-primary/20",
  cancelled: "text-error bg-error/5 border-error/20",
};

const PLACEHOLDER_IMG = "https://placehold.co/64x64/e2e2e2/6a7a7b?text=IMG";

function formatDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function orderTitle(order: Order): string {
  const items = order.items ?? [];
  if (items.length === 0) return order.orderInfo || "Order";
  if (items.length === 1) return items[0].name;
  return `${items[0].name} + ${items.length - 1} more`;
}

function orderQty(order: Order): number {
  return (order.items ?? []).reduce((n, i) => n + (i.quantity || 0), 0);
}

export default function OrderHistoryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login?redirect=/orders");
      return;
    }
    let cancelled = false;
    fetchMyOrders()
      .then((data) => {
        if (!cancelled) setOrders(data);
      })
      .catch((e) => {
        if (!cancelled)
          setError(
            (e as { message?: string })?.message || "Failed to load orders.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  const filtered = orders.filter((o) => {
    const matchStatus = filter === "All" || o.fulfillmentStatus === filter;
    const title = orderTitle(o).toLowerCase();
    const matchSearch =
      title.includes(search.toLowerCase()) || o.orderId.includes(search);
    return matchStatus && matchSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-10 py-12">
        {/* Header */}
        <div className="mb-8">
          <p className="text-label-caps text-primary mb-1">Buyer Account</p>
          <h1 className="text-display-lg-mobile text-on-surface">
            Order History
          </h1>
          <p className="text-on-surface-variant mt-1">
            Track and manage all your purchases.
          </p>
        </div>

        {/* Search + Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
            <input
              type="text"
              placeholder="Search by product or order ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border-2 border-deep-navy rounded-lg pl-9 pr-4 py-2.5 text-sm bg-transparent text-on-surface placeholder:text-on-surface-variant"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <SlidersHorizontal className="w-4 h-4 text-on-surface-variant shrink-0" />
            {FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 ${
                  filter === s
                    ? "bg-deep-navy text-primary-container border-deep-navy"
                    : "border-outline-variant text-on-surface-variant hover:border-deep-navy hover:text-on-surface"
                }`}
              >
                {s === "All" ? "All" : FULFILLMENT_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-on-surface-variant">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-16 border-2 border-error/30 bg-error/5 rounded-xl">
            <p className="font-semibold text-error">{error}</p>
          </div>
        ) : (
          <motion.div layout className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filtered.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-16 border-2 border-dashed border-outline-variant rounded-xl"
                >
                  <Package className="w-10 h-10 text-outline mx-auto mb-3" />
                  <p className="font-semibold text-on-surface">
                    No orders found
                  </p>
                  <p className="text-sm text-on-surface-variant mt-1">
                    {orders.length === 0
                      ? "You haven't placed any orders yet."
                      : "Try adjusting your search or filter."}
                  </p>
                  {orders.length === 0 && (
                    <Link
                      href="/search"
                      className="inline-flex items-center gap-2 mt-6 bg-primary-container text-deep-navy text-label-caps font-bold px-6 py-3 rounded-xl border-2 border-transparent hover:border-deep-navy transition-colors"
                    >
                      Start Shopping
                    </Link>
                  )}
                </motion.div>
              ) : (
                filtered.map((order, i) => {
                  const img = order.items?.[0]?.image || PLACEHOLDER_IMG;
                  const status = order.fulfillmentStatus;
                  return (
                    <motion.div
                      key={order.orderId}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        transition: {
                          duration: 0.35,
                          ease: EASE,
                          delay: i * 0.05,
                        },
                      }}
                      exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
                    >
                      <Link
                        href={`/orders/${order.orderId}`}
                        className="flex items-center gap-4 border-2 border-deep-navy rounded-xl p-4 bg-surface-container-lowest card-hover"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img}
                          alt={orderTitle(order)}
                          className="w-16 h-16 rounded-lg object-cover border border-outline-variant shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = PLACEHOLDER_IMG;
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-on-surface truncate">
                              {orderTitle(order)}
                            </p>
                            <span
                              className={`shrink-0 text-label-caps border px-2 py-0.5 rounded-full ${STATUS_CHIP[status]}`}
                            >
                              {FULFILLMENT_LABEL[status]}
                            </span>
                          </div>
                          <p className="text-xs text-on-surface-variant mt-1">
                            Order #{order.orderId.slice(0, 8)} ·{" "}
                            {formatDate(order.createdAt)} · Qty: {orderQty(order)}
                          </p>
                        </div>
                        <div className="text-right shrink-0 flex items-center gap-3">
                          <p className="font-bold text-on-surface">
                            {formatVND(order.amount)}
                          </p>
                          <ChevronRight className="w-4 h-4 text-on-surface-variant" />
                        </div>
                      </Link>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
