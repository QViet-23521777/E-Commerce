"use client";

import { motion } from "motion/react";
import {
  TrendingUp,
  ShoppingBag,
  Package,
  Star,
  AlertTriangle,
  ArrowUpRight,
  Eye,
  ChevronRight,
  Clock,
  CheckCircle2,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { getUser } from "@/lib/auth";
import { fetchSellerInventory, type InventoryItem } from "@/lib/seller";
import { formatVND, type BackendProduct } from "@/lib/products";
import { fetchSellerOrders, FULFILLMENT_LABEL, type Order } from "@/lib/orders";
import { monthlyRevenue, revenueSummary } from "@/lib/analytics";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

const LOW_STOCK_THRESHOLD = 5;

interface LowStockEntry {
  id: string;
  name: string;
  stock: number;
}

const STATUS_META: Record<
  string,
  { color: string; icon: React.ElementType }
> = {
  "To Confirm": {
    color: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock,
  },
  Processing: {
    color: "bg-blue-50 text-blue-700 border-blue-200",
    icon: Package,
  },
  Shipped: {
    color: "bg-tertiary/10 text-tertiary border-tertiary/30",
    icon: Truck,
  },
  Delivered: {
    color: "bg-primary/10 text-primary border-primary/20",
    icon: CheckCircle2,
  },
  Cancelled: {
    color: "bg-red-50 text-red-700 border-red-200",
    icon: AlertTriangle,
  },
};

function relativeDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const hrs = Math.floor(diff / 3_600_000);
  if (hrs < 1) return "Just now";
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const today = new Date().toLocaleDateString("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

export default function DashboardPage() {
  const [productCount, setProductCount] = useState<number | null>(null);
  const [lowStock, setLowStock] = useState<LowStockEntry[]>([]);
  const [invLoading, setInvLoading] = useState(true);
  const [rating, setRating] = useState<{ avg: number; reviews: number }>({ avg: 0, reviews: 0 });
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    const u = getUser();
    if (!u?.userId) { setInvLoading(false); setOrdersLoading(false); return; }
    let alive = true;
    (async () => {
      try {
        const inv = await fetchSellerInventory(u.userId);
        if (!alive) return;
        setProductCount(inv.length);
        const low = inv
          .filter((i: InventoryItem) => (i.quantity ?? 0) <= LOW_STOCK_THRESHOLD)
          .sort((a, b) => (a.quantity ?? 0) - (b.quantity ?? 0))
          .slice(0, 6)
          .map((i: InventoryItem) => {
            const p =
              typeof i.productId === "object" && i.productId
                ? (i.productId as BackendProduct)
                : null;
            return {
              id: i._id,
              name: p?.name || i.name || "Product",
              stock: i.quantity ?? 0,
            };
          });
        setLowStock(low);

        // Aggregate rating across the seller's rated products.
        let reviews = 0;
        let weighted = 0;
        for (const i of inv) {
          const p =
            typeof i.productId === "object" && i.productId
              ? (i.productId as BackendProduct)
              : null;
          if (p && (p.numReviews ?? 0) > 0) {
            reviews += p.numReviews ?? 0;
            weighted += (p.rating ?? 0) * (p.numReviews ?? 0);
          }
        }
        setRating({ avg: reviews > 0 ? weighted / reviews : 0, reviews });
      } finally {
        if (alive) setInvLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const o = await fetchSellerOrders();
        if (alive) setOrders(o);
      } finally {
        if (alive) setOrdersLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const revenue = useMemo(() => monthlyRevenue(orders), [orders]);
  const summary = useMemo(() => revenueSummary(orders), [orders]);
  const MAX_REV = Math.max(1, ...revenue.map((r) => r.value));
  const pendingOrders = orders.filter(
    (o) => o.fulfillmentStatus === "to_confirm" || o.fulfillmentStatus === "processing",
  );
  const toConfirmCount = orders.filter((o) => o.fulfillmentStatus === "to_confirm").length;
  const recentOrders = orders.slice(0, 5);

  const STATS = [
    {
      label: "Revenue This Month",
      value: ordersLoading ? "…" : formatVND(summary.thisMonth),
      sub: summary.momChangePct === null ? "no prior month" : `${summary.momChangePct >= 0 ? "+" : ""}${summary.momChangePct}% vs last month`,
      up: (summary.momChangePct ?? 0) >= 0 && summary.thisMonth > 0,
      icon: TrendingUp,
      accent: "text-green-600",
    },
    {
      label: "Pending Orders",
      value: ordersLoading ? "…" : String(pendingOrders.length),
      sub: `${toConfirmCount} require confirmation`,
      up: false,
      icon: ShoppingBag,
      accent: "text-amber-600",
    },
    {
      label: "Products Listed",
      value: productCount === null ? "…" : String(productCount),
      sub: `${lowStock.length} low on stock`,
      up: false,
      icon: Package,
      accent: "text-on-surface-variant",
    },
    {
      label: "Average Rating",
      value: rating.reviews === 0 ? "—" : rating.avg.toFixed(1),
      sub: `${rating.reviews} reviews total`,
      up: false,
      icon: Star,
      accent: "text-primary",
    },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-px w-5 bg-primary-container" />
          <p className="text-label-caps text-primary">Overview</p>
        </div>
        <h1 className="text-2xl font-bold text-deep-navy tracking-tight">
          Seller Dashboard
        </h1>
        <p className="text-sm text-on-surface-variant mt-0.5">
          Nordic Living Co. · {today}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {STATS.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: EASE, delay: i * 0.06 }}
              className="bg-white border-2 border-deep-navy rounded-xl p-5"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-9 h-9 bg-surface-container-low border border-outline-variant rounded-lg flex items-center justify-center">
                  <Icon className="w-4 h-4 text-deep-navy" />
                </div>
                {stat.up && (
                  <span className="text-[11px] font-bold text-green-600 flex items-center gap-0.5">
                    <ArrowUpRight className="w-3 h-3" />
                    {stat.sub.split(" ")[0]}
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-deep-navy mb-0.5 tracking-tight">
                {stat.value}
              </p>
              <p className="text-xs font-semibold text-on-surface-variant">
                {stat.label}
              </p>
              <p className={`text-[10px] mt-0.5 ${stat.accent}`}>{stat.sub}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        {/* Revenue chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE, delay: 0.22 }}
          className="lg:col-span-2 bg-white border-2 border-deep-navy rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-label-caps text-primary mb-0.5">Trend</p>
              <h2 className="font-bold text-deep-navy">Monthly Revenue</h2>
            </div>
            {summary.momChangePct !== null && (
              <span className={`text-sm font-bold flex items-center gap-1 border px-2.5 py-1 rounded-full ${
                summary.momChangePct >= 0
                  ? "text-green-600 bg-green-50 border-green-200"
                  : "text-red-600 bg-red-50 border-red-200"
              }`}>
                <ArrowUpRight className="w-3.5 h-3.5" />
                {summary.momChangePct >= 0 ? "+" : ""}{summary.momChangePct}%
              </span>
            )}
          </div>

          <div className="flex items-end gap-2 sm:gap-3" style={{ height: 120 }}>
            {revenue.map((bar, i) => {
              const isLatest = i === revenue.length - 1;
              const barH = Math.round((bar.value / MAX_REV) * 104);
              return (
                <div
                  key={`${bar.month}-${i}`}
                  className="flex-1 flex flex-col items-center gap-1.5"
                >
                  <div className="w-full flex flex-col justify-end" style={{ height: 104 }}>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: barH }}
                      transition={{ duration: 0.65, ease: EASE, delay: 0.3 + i * 0.07 }}
                      className={`w-full rounded-t-lg ${
                        isLatest
                          ? "bg-primary-container border-2 border-deep-navy"
                          : "bg-surface-container-high"
                      }`}
                    />
                  </div>
                  <span
                    className={`text-[10px] font-medium ${
                      isLatest ? "text-deep-navy font-bold" : "text-on-surface-variant"
                    }`}
                  >
                    {bar.month}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-outline-variant flex justify-between text-xs text-on-surface-variant">
            <span>Trailing 6 months</span>
            <span className="font-bold text-deep-navy">{formatVND(summary.thisMonth)} this month</span>
          </div>
        </motion.div>

        {/* Low stock alerts */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE, delay: 0.28 }}
          className="bg-white border-2 border-deep-navy rounded-xl p-6"
        >
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-center shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div>
              <h2 className="font-bold text-deep-navy text-sm">Low Stock</h2>
              <p className="text-[10px] text-on-surface-variant">Restock soon</p>
            </div>
          </div>

          <div className="space-y-3.5">
            {invLoading ? (
              <p className="text-sm text-on-surface-variant py-4">Loading…</p>
            ) : lowStock.length === 0 ? (
              <p className="text-sm text-on-surface-variant py-4">
                All products are well stocked.
              </p>
            ) : (
              lowStock.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 py-2 border-b border-outline-variant last:border-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-deep-navy truncate capitalize">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-on-surface-variant font-mono">
                      {item.id.slice(-8)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full border ${
                      item.stock <= 2
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {item.stock === 0 ? "Out" : `${item.stock} left`}
                  </span>
                </div>
              ))
            )}
          </div>

          <Link
            href="/shop/products"
            className="mt-4 flex items-center gap-1 text-xs font-bold text-primary hover:text-deep-navy transition-colors"
          >
            Manage inventory
            <ChevronRight className="w-3 h-3" />
          </Link>
        </motion.div>
      </div>

      {/* Recent orders */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE, delay: 0.34 }}
        className="bg-white border-2 border-deep-navy rounded-xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-deep-navy">
          <h2 className="font-bold text-deep-navy">Recent Orders</h2>
          <Link
            href="/shop/orders"
            className="text-xs font-bold text-primary hover:text-deep-navy transition-colors flex items-center gap-1"
          >
            View all
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                {["Order", "Customer", "Items", "Total", "Status", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-5 py-3 first:pl-6"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {ordersLoading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-on-surface-variant">Loading orders…</td></tr>
              ) : recentOrders.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-on-surface-variant">No orders yet.</td></tr>
              ) : (
                recentOrders.map((order) => {
                  const label = FULFILLMENT_LABEL[order.fulfillmentStatus ?? "to_confirm"];
                  const meta = STATUS_META[label] ?? STATUS_META["To Confirm"];
                  const StatusIcon = meta.icon;
                  const itemCount = (order.items ?? []).reduce((s, it) => s + (it.quantity ?? 0), 0);
                  const customer =
                    order.shippingAddress?.fullName || `Customer ${String(order.userId).slice(-4)}`;
                  const total = order.sellerSubtotal ?? order.amount ?? 0;
                  return (
                    <tr
                      key={order.orderId}
                      className="hover:bg-surface-container-low transition-colors"
                    >
                      <td className="px-6 py-3.5">
                        <p className="text-sm font-bold text-deep-navy font-mono">
                          #{String(order.orderId).slice(0, 8)}
                        </p>
                        <p className="text-[10px] text-on-surface-variant">
                          {relativeDate(order.paidAt || order.createdAt)}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-sm font-medium text-on-surface">
                        {customer}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-on-surface-variant">
                        {itemCount} item{itemCount > 1 ? "s" : ""}
                      </td>
                      <td className="px-5 py-3.5 text-sm font-bold text-deep-navy">
                        {formatVND(total)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border ${meta.color}`}
                        >
                          <StatusIcon className="w-2.5 h-2.5" />
                          {label}
                        </span>
                      </td>
                      <td className="pr-5 py-3.5">
                        <Link
                          href="/shop/orders"
                          className="p-1.5 hover:bg-surface-container rounded-lg text-on-surface-variant hover:text-deep-navy transition-colors inline-flex"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
