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

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

const STATS = [
  {
    label: "Revenue This Month",
    value: "$12,480",
    sub: "+18.2% vs last month",
    up: true,
    icon: TrendingUp,
    accent: "text-green-600",
  },
  {
    label: "Pending Orders",
    value: "8",
    sub: "2 require confirmation",
    up: false,
    icon: ShoppingBag,
    accent: "text-amber-600",
  },
  {
    label: "Products Listed",
    value: "47",
    sub: "3 pending approval",
    up: false,
    icon: Package,
    accent: "text-on-surface-variant",
  },
  {
    label: "Average Rating",
    value: "4.9",
    sub: "128 reviews total",
    up: true,
    icon: Star,
    accent: "text-primary",
  },
];

const MONTHLY_REVENUE = [
  { month: "Jun", value: 6800 },
  { month: "Jul", value: 8200 },
  { month: "Aug", value: 7400 },
  { month: "Sep", value: 9100 },
  { month: "Oct", value: 11200 },
  { month: "Nov", value: 12480 },
];
const MAX_REV = Math.max(...MONTHLY_REVENUE.map((r) => r.value));

const RECENT_ORDERS = [
  {
    id: "#ORD-5821",
    customer: "Emma Strand",
    items: 2,
    total: "$238",
    date: "2h ago",
    status: "To Confirm",
  },
  {
    id: "#ORD-5820",
    customer: "Liam Thorsen",
    items: 1,
    total: "$145",
    date: "4h ago",
    status: "To Confirm",
  },
  {
    id: "#ORD-5819",
    customer: "Ava Peterson",
    items: 3,
    total: "$412",
    date: "Yesterday",
    status: "Processing",
  },
  {
    id: "#ORD-5818",
    customer: "Noah Kim",
    items: 1,
    total: "$89",
    date: "Yesterday",
    status: "Shipped",
  },
  {
    id: "#ORD-5817",
    customer: "Sophia Berg",
    items: 2,
    total: "$328",
    date: "3 days ago",
    status: "Delivered",
  },
];

const LOW_STOCK = [
  { name: "V60 Ceramic Dripper", sku: "SKU-001", stock: 2 },
  { name: "Task Lamp T-1", sku: "SKU-019", stock: 4 },
  { name: "Copper Pour-Over Set", sku: "SKU-008", stock: 1 },
];

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
};

const today = new Date().toLocaleDateString("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

export default function DashboardPage() {
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
            <span className="text-sm font-bold text-green-600 flex items-center gap-1 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +18.2%
            </span>
          </div>

          <div className="flex items-end gap-2 sm:gap-3" style={{ height: 120 }}>
            {MONTHLY_REVENUE.map((bar, i) => {
              const isLatest = i === MONTHLY_REVENUE.length - 1;
              const barH = Math.round((bar.value / MAX_REV) * 104);
              return (
                <div
                  key={bar.month}
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
            <span>Jun – Nov 2024</span>
            <span className="font-bold text-deep-navy">$12,480 this month</span>
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
            {LOW_STOCK.map((item) => (
              <div
                key={item.sku}
                className="flex items-center justify-between gap-3 py-2 border-b border-outline-variant last:border-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-deep-navy truncate">
                    {item.name}
                  </p>
                  <p className="text-[10px] text-on-surface-variant font-mono">
                    {item.sku}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full border ${
                    item.stock <= 2
                      ? "bg-red-50 text-red-700 border-red-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {item.stock} left
                </span>
              </div>
            ))}
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
              {RECENT_ORDERS.map((order) => {
                const meta = STATUS_META[order.status];
                const StatusIcon = meta.icon;
                return (
                  <tr
                    key={order.id}
                    className="hover:bg-surface-container-low transition-colors"
                  >
                    <td className="px-6 py-3.5">
                      <p className="text-sm font-bold text-deep-navy font-mono">
                        {order.id}
                      </p>
                      <p className="text-[10px] text-on-surface-variant">
                        {order.date}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium text-on-surface">
                      {order.customer}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-on-surface-variant">
                      {order.items} item{order.items > 1 ? "s" : ""}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-bold text-deep-navy">
                      {order.total}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border ${meta.color}`}
                      >
                        <StatusIcon className="w-2.5 h-2.5" />
                        {order.status}
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
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
