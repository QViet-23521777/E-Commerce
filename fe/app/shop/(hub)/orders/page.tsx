"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  ChevronDown,
  Eye,
  X,
  Clock,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  ChevronRight,
  User,
  MapPin,
  CreditCard,
  ShoppingBag,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { formatVND } from "@/lib/products";
import {
  fetchSellerOrders,
  advanceOrderFulfillment,
  cancelOrder as cancelOrderApi,
  type Order as BackendOrder,
  type FulfillmentStatus,
} from "@/lib/orders";
import { isLoggedIn } from "@/lib/auth";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

type OrderStatus = FulfillmentStatus;

interface OrderItemVM {
  name: string;
  variant: string;
  qty: number;
  price: number;
}

interface OrderVM {
  id: string; // orderId
  customer: string;
  email: string;
  address: string;
  items: OrderItemVM[];
  total: number;
  date: string;
  status: OrderStatus;
  payment: string;
  trackingNo?: string;
}

function fmtDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function toVM(o: BackendOrder): OrderVM {
  const addr = o.shippingAddress;
  const addressLine = addr
    ? [addr.line1, addr.city, addr.zip].filter(Boolean).join(", ")
    : "";
  return {
    id: o.orderId,
    customer: addr?.fullName?.trim() || "Customer",
    email: addr?.phone || "",
    address: addressLine,
    items: (o.items ?? []).map((i) => ({
      name: i.name,
      variant: "",
      qty: i.quantity,
      price: i.totalPrice,
    })),
    // Seller view: prefer the per-seller subtotal over the whole-order amount.
    total: o.sellerSubtotal ?? o.amount,
    date: fmtDate(o.createdAt),
    status: o.fulfillmentStatus,
    payment: o.partnerCode === "WALLET" ? "Wallet" : "MoMo",
    trackingNo: o.trackingNo ?? undefined,
  };
}

type TabId = "all" | OrderStatus;
const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "all", label: "All", icon: ShoppingBag },
  { id: "to_confirm", label: "To Confirm", icon: Clock },
  { id: "processing", label: "Processing", icon: Package },
  { id: "shipped", label: "Shipped", icon: Truck },
  { id: "delivered", label: "Delivered", icon: CheckCircle2 },
  { id: "cancelled", label: "Cancelled", icon: XCircle },
];

const STATUS_META: Record<OrderStatus, { label: string; color: string }> = {
  to_confirm: { label: "To Confirm", color: "bg-amber-50 text-amber-700 border-amber-200" },
  processing: { label: "Processing", color: "bg-blue-50 text-blue-700 border-blue-200" },
  shipped: { label: "Shipped", color: "bg-tertiary/10 text-tertiary border-tertiary/30" },
  delivered: { label: "Delivered", color: "bg-primary/10 text-primary border-primary/20" },
  cancelled: { label: "Cancelled", color: "bg-red-50 text-red-700 border-red-200" },
};

const SORT_OPTIONS = ["Newest first", "Oldest first", "Total: High–Low", "Total: Low–High"];

const CANCELLABLE: OrderStatus[] = ["to_confirm", "processing"];
const ADVANCE_ACTION: Record<string, "confirm" | "ship" | "deliver"> = {
  to_confirm: "confirm",
  processing: "ship",
  shipped: "deliver",
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderVM[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("Newest first");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login?redirect=/shop/orders");
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchSellerOrders()
      .then((data) => {
        if (!cancelled) setOrders(data.map(toVM));
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

  async function advanceStatus(id: string) {
    const order = orders.find((o) => o.id === id);
    if (!order) return;
    const action = ADVANCE_ACTION[order.status];
    if (!action) return;
    let trackingNo: string | undefined;
    if (action === "ship") {
      trackingNo =
        typeof window !== "undefined"
          ? window.prompt("Tracking number (optional):") || undefined
          : undefined;
    }
    setBusyId(id);
    setError("");
    try {
      const updated = await advanceOrderFulfillment(id, action, trackingNo);
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? toVM(updated) : o)),
      );
    } catch (e) {
      setError(
        (e as { message?: string })?.message || "Failed to update order.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function cancelOrder(id: string) {
    setCancelId(null);
    setSelectedId(null);
    setBusyId(id);
    setError("");
    try {
      const updated = await cancelOrderApi(id);
      setOrders((prev) => prev.map((o) => (o.id === id ? toVM(updated) : o)));
    } catch (e) {
      setError(
        (e as { message?: string })?.message || "Failed to cancel order.",
      );
    } finally {
      setBusyId(null);
    }
  }

  const filtered = useMemo(
    () =>
      orders
        .filter((o) => activeTab === "all" || o.status === activeTab)
        .filter(
          (o) =>
            search === "" ||
            o.id.toLowerCase().includes(search.toLowerCase()) ||
            o.customer.toLowerCase().includes(search.toLowerCase()),
        )
        .sort((a, b) => {
          if (sortBy === "Newest first") return b.id.localeCompare(a.id);
          if (sortBy === "Oldest first") return a.id.localeCompare(b.id);
          if (sortBy === "Total: High–Low") return b.total - a.total;
          if (sortBy === "Total: Low–High") return a.total - b.total;
          return 0;
        }),
    [orders, activeTab, search, sortBy],
  );

  const tabCounts = (id: TabId) =>
    id === "all"
      ? orders.length
      : orders.filter((o) => o.status === id).length;

  const selectedOrder = selectedId
    ? orders.find((o) => o.id === selectedId) ?? null
    : null;

  return (
    <>
      <div className="p-6 lg:p-8 max-w-[1200px] mx-auto w-full">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-px w-5 bg-primary-container" />
            <p className="text-label-caps text-primary">Manage</p>
          </div>
          <h1 className="text-2xl font-bold text-deep-navy tracking-tight">
            Order Management
          </h1>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2 text-sm text-red-700 border-2 border-red-200 bg-red-50 rounded-xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex overflow-x-auto gap-0.5 bg-white border-2 border-deep-navy rounded-xl p-0.5 mb-5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const count = tabCounts(tab.id);
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-150 ${
                  active
                    ? "bg-deep-navy text-white"
                    : "text-on-surface-variant hover:text-deep-navy hover:bg-surface-container-low"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {count > 0 && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold min-w-[16px] text-center ${
                      active
                        ? "bg-white/20 text-white"
                        : tab.id === "to_confirm"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-surface-container text-on-surface-variant"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order ID or customer…"
              className="w-full h-10 pl-10 pr-4 border-2 border-deep-navy/20 rounded-xl bg-white text-sm text-on-surface placeholder:text-outline focus:border-primary-container outline-none transition-colors"
            />
          </div>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-10 px-4 pr-8 border-2 border-deep-navy/20 rounded-xl bg-white text-sm text-on-surface focus:border-primary-container outline-none appearance-none cursor-pointer"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-outline pointer-events-none" />
          </div>
        </div>

        {/* Orders table */}
        <div className="bg-white border-2 border-deep-navy rounded-xl overflow-hidden">
          {loading ? (
            <div className="py-16 flex flex-col items-center text-center">
              <Loader2 className="w-6 h-6 text-on-surface-variant animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 flex flex-col items-center text-center">
              <ShoppingBag className="w-10 h-10 text-outline mb-3" />
              <p className="font-semibold text-on-surface">No orders found</p>
              <p className="text-sm text-on-surface-variant mt-1">
                {orders.length === 0
                  ? "You have no paid orders yet."
                  : "Try adjusting your search or filters"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant">
                    {["Order", "Customer", "Items", "Total", "Date", "Status", "Action"].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-4 py-3 first:pl-6"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {filtered.map((order) => {
                    const meta = STATUS_META[order.status];
                    const canAdvance = ["to_confirm", "processing", "shipped"].includes(order.status);
                    const canCancel = CANCELLABLE.includes(order.status);
                    const busy = busyId === order.id;
                    return (
                      <motion.tr
                        key={order.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-surface-container-low transition-colors"
                      >
                        <td className="px-6 py-3.5">
                          <p className="text-sm font-bold text-deep-navy font-mono">
                            #{order.id.slice(0, 8)}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-sm font-semibold text-on-surface">
                            {order.customer}
                          </p>
                          {order.email && (
                            <p className="text-[10px] text-on-surface-variant">
                              {order.email}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-on-surface-variant">
                          {order.items.length} item
                          {order.items.length > 1 ? "s" : ""}
                        </td>
                        <td className="px-4 py-3.5 text-sm font-bold text-deep-navy">
                          {formatVND(order.total)}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-on-surface-variant">
                          {order.date.split("·")[0].trim()}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-1 rounded-full border ${meta.color}`}
                          >
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setSelectedId(order.id)}
                              className="p-1.5 rounded-lg text-on-surface-variant hover:text-deep-navy hover:bg-surface-container transition-colors"
                              title="View details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {canAdvance && (
                              <button
                                onClick={() => advanceStatus(order.id)}
                                disabled={busy}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary-container text-deep-navy text-[10px] font-bold hover:border hover:border-deep-navy active:scale-[0.97] transition-all disabled:opacity-50"
                              >
                                {busy ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <>
                                    {order.status === "to_confirm"
                                      ? "Confirm"
                                      : order.status === "processing"
                                      ? "Ship"
                                      : "Deliver"}
                                    <ChevronRight className="w-3 h-3" />
                                  </>
                                )}
                              </button>
                            )}
                            {canCancel && (
                              <button
                                onClick={() => setCancelId(order.id)}
                                disabled={busy}
                                className="p-1.5 rounded-lg text-on-surface-variant hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                                title="Cancel order"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Cancel confirm modal */}
      <AnimatePresence>
        {cancelId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setCancelId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: EASE }}
              className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-deep-navy rounded-2xl p-6 w-[360px]"
            >
              <div className="w-10 h-10 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-center mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-bold text-deep-navy mb-1">Cancel Order?</h3>
              <p className="text-sm text-on-surface-variant mb-1">
                Order{" "}
                <span className="font-mono font-bold text-deep-navy">
                  #{cancelId.slice(0, 8)}
                </span>{" "}
                will be cancelled and the customer will be notified.
              </p>
              <p className="text-xs text-on-surface-variant mb-5">
                This action cannot be undone. A wallet payment will be refunded
                automatically.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setCancelId(null)}
                  className="flex-1 h-10 border-2 border-deep-navy/20 rounded-xl text-sm font-semibold text-on-surface-variant hover:border-deep-navy transition-colors"
                >
                  Keep Order
                </button>
                <button
                  onClick={() => cancelOrder(cancelId)}
                  className="flex-1 h-10 bg-red-600 border-2 border-transparent text-white text-sm font-bold rounded-xl hover:bg-red-700 active:scale-[0.97] transition-all"
                >
                  Cancel Order
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Order detail panel */}
      <AnimatePresence>
        {selectedOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setSelectedId(null)}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.35, ease: EASE }}
              className="fixed top-0 right-0 z-50 h-full w-full sm:w-[480px] bg-white border-l-2 border-deep-navy flex flex-col"
            >
              {/* Panel header */}
              <div className="flex items-center justify-between px-6 py-5 border-b-2 border-deep-navy shrink-0">
                <div>
                  <p className="text-label-caps text-primary mb-0.5">Order Details</p>
                  <h2 className="font-bold text-deep-navy font-mono">
                    #{selectedOrder.id.slice(0, 8)}
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {selectedOrder.date}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedId(null)}
                  className="p-2 rounded-lg text-on-surface-variant hover:text-deep-navy hover:bg-surface-container transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                {/* Status */}
                <div className="flex items-center justify-between p-4 bg-surface-container-low border border-outline-variant rounded-xl">
                  <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                    Status
                  </span>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                      STATUS_META[selectedOrder.status].color
                    }`}
                  >
                    {STATUS_META[selectedOrder.status].label}
                  </span>
                </div>

                {/* Customer */}
                <div className="border-2 border-deep-navy/10 rounded-xl p-4 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">
                    Customer
                  </p>
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-outline" />
                    <span className="text-sm font-semibold text-on-surface">
                      {selectedOrder.customer}
                    </span>
                  </div>
                  {selectedOrder.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-outline mt-0.5 shrink-0" />
                      <span className="text-xs text-on-surface-variant">
                        {selectedOrder.address}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5 text-outline" />
                    <span className="text-xs text-on-surface-variant">
                      {selectedOrder.payment}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">
                    Items Ordered
                  </p>
                  <div className="border-2 border-deep-navy/10 rounded-xl overflow-hidden divide-y divide-outline-variant">
                    {selectedOrder.items.map((item, idx) => (
                      <div
                        key={`${item.name}-${idx}`}
                        className="flex items-center justify-between px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-deep-navy">
                            {item.name}
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            Qty {item.qty}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-deep-navy">
                          {formatVND(item.price)}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between px-4 py-3 bg-surface-container-low">
                      <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                        Total
                      </span>
                      <span className="font-bold text-deep-navy">
                        {formatVND(selectedOrder.total)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tracking */}
                {selectedOrder.trackingNo && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                      Tracking Number
                    </p>
                    <p className="text-sm font-mono text-primary bg-primary/5 border border-primary/20 px-3 py-2 rounded-lg">
                      {selectedOrder.trackingNo}
                    </p>
                  </div>
                )}
              </div>

              {/* Panel actions */}
              <div className="border-t-2 border-deep-navy px-6 py-4 shrink-0 bg-white space-y-2.5">
                {(selectedOrder.status === "to_confirm" ||
                  selectedOrder.status === "processing" ||
                  selectedOrder.status === "shipped") && (
                  <button
                    onClick={() => {
                      advanceStatus(selectedOrder.id);
                      setSelectedId(null);
                    }}
                    className="w-full h-11 bg-primary-container text-deep-navy text-sm font-bold rounded-xl border-2 border-transparent hover:border-deep-navy active:scale-[0.97] transition-all"
                  >
                    {selectedOrder.status === "to_confirm"
                      ? "Confirm Order"
                      : selectedOrder.status === "processing"
                      ? "Mark as Shipped"
                      : "Mark as Delivered"}
                  </button>
                )}
                {CANCELLABLE.includes(selectedOrder.status) && (
                  <button
                    onClick={() => {
                      setCancelId(selectedOrder.id);
                      setSelectedId(null);
                    }}
                    className="w-full h-10 border-2 border-red-200 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-50 hover:border-red-400 active:scale-[0.97] transition-all"
                  >
                    Cancel Order
                  </button>
                )}
                {selectedOrder.status !== "to_confirm" &&
                  selectedOrder.status !== "processing" &&
                  selectedOrder.status !== "shipped" && (
                    <button
                      onClick={() => setSelectedId(null)}
                      className="w-full h-11 border-2 border-deep-navy/20 text-on-surface-variant text-sm font-semibold rounded-xl hover:border-deep-navy transition-colors"
                    >
                      Close
                    </button>
                  )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
