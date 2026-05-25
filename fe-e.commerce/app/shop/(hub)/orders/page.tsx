"use client";

import { useState } from "react";
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
} from "lucide-react";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

type OrderStatus = "to_confirm" | "processing" | "shipped" | "delivered" | "cancelled";

interface OrderItem {
  name: string;
  variant: string;
  qty: number;
  price: number;
}

interface Order {
  id: string;
  customer: string;
  email: string;
  address: string;
  items: OrderItem[];
  total: number;
  date: string;
  status: OrderStatus;
  payment: string;
  trackingNo?: string;
}

const ORDERS: Order[] = [
  {
    id: "ORD-5821",
    customer: "Emma Strand",
    email: "emma@strand.no",
    address: "3 Holmenkollen Rd, Oslo 0787, Norway",
    items: [
      { name: "V60 Ceramic Dripper", variant: "White / 02", qty: 1, price: 145 },
      { name: "Linen Pillow Cover", variant: "Natural / 50×50", qty: 1, price: 93 },
    ],
    total: 238,
    date: "Nov 13, 2024 · 10:24 AM",
    status: "to_confirm",
    payment: "Visa ···· 4242",
  },
  {
    id: "ORD-5820",
    customer: "Liam Thorsen",
    email: "liam@thorsen.no",
    address: "7 Aker Brygge, Oslo 0250, Norway",
    items: [{ name: "Task Lamp T-1", variant: "Matte Black", qty: 1, price: 145 }],
    total: 145,
    date: "Nov 13, 2024 · 8:02 AM",
    status: "to_confirm",
    payment: "Mastercard ···· 8810",
  },
  {
    id: "ORD-5819",
    customer: "Ava Peterson",
    email: "ava.p@gmail.com",
    address: "22 Frogner Pl, Oslo 0266, Norway",
    items: [
      { name: "Cylindrical Tumbler Set", variant: "Matte Black ×2", qty: 2, price: 128 },
      { name: "Copper Pour-Over Set", variant: "Copper", qty: 1, price: 180 },
      { name: "Glass Carafe 1L", variant: "Clear", qty: 1, price: 88 },
    ],
    total: 412,
    date: "Nov 12, 2024 · 3:15 PM",
    status: "processing",
    payment: "Vipps",
  },
  {
    id: "ORD-5818",
    customer: "Noah Kim",
    email: "noah.kim@outlook.com",
    address: "5 Grünerløkka St, Oslo 0550, Norway",
    items: [{ name: "Stone Coasters Set", variant: "Slate / 4-pack", qty: 1, price: 89 }],
    total: 89,
    date: "Nov 12, 2024 · 9:44 AM",
    status: "shipped",
    payment: "PayPal",
    trackingNo: "NOR-5818-AB3CF",
  },
  {
    id: "ORD-5817",
    customer: "Sophia Berg",
    email: "s.berg@icloud.com",
    address: "19 Majorstua, Oslo 0351, Norway",
    items: [
      { name: "Wool Throw Blanket", variant: "Oatmeal / 140×180", qty: 1, price: 189 },
      { name: "Linen Table Runner", variant: "Natural / 40×150", qty: 1, price: 68 },
    ],
    total: 328,
    date: "Nov 10, 2024 · 2:33 PM",
    status: "shipped",
    payment: "Visa ···· 3399",
    trackingNo: "NOR-5817-QW7XY",
  },
  {
    id: "ORD-5816",
    customer: "Oliver Dahl",
    email: "oliver@dahl.no",
    address: "8 Tjuvholmen, Oslo 0252, Norway",
    items: [{ name: "Nordic Wall Clock", variant: "White / 30cm", qty: 1, price: 175 }],
    total: 175,
    date: "Nov 8, 2024 · 11:10 AM",
    status: "delivered",
    payment: "Visa ···· 7721",
    trackingNo: "NOR-5816-MX2KT",
  },
  {
    id: "ORD-5815",
    customer: "Isabella Nor",
    email: "isabella.nor@gmail.com",
    address: "45 St. Hanshaugen, Oslo 0167, Norway",
    items: [
      { name: "Ceramic Serving Bowl", variant: "Sand / Large", qty: 2, price: 196 },
      { name: "V60 Ceramic Dripper", variant: "White / 02", qty: 1, price: 145 },
      { name: "Bamboo Cutting Board", variant: "L / Natural", qty: 1, price: 75 },
    ],
    total: 520,
    date: "Nov 6, 2024 · 4:55 PM",
    status: "delivered",
    payment: "Mastercard ···· 1105",
    trackingNo: "NOR-5815-PL9QZ",
  },
  {
    id: "ORD-5814",
    customer: "Lucas Hoff",
    email: "lucas.hoff@mail.no",
    address: "2 Bjerke, Oslo 0590, Norway",
    items: [
      { name: "Copper Pour-Over Set", variant: "Copper", qty: 1, price: 180 },
      { name: "Glass Carafe 1L", variant: "Clear", qty: 1, price: 88 },
    ],
    total: 264,
    date: "Nov 5, 2024 · 6:18 PM",
    status: "cancelled",
    payment: "Vipps",
  },
];

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

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("Newest first");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, OrderStatus>>(
    Object.fromEntries(ORDERS.map((o) => [o.id, o.status]))
  );

  function advanceStatus(id: string) {
    setStatuses((prev) => {
      const cur = prev[id];
      const next: Record<OrderStatus, OrderStatus | null> = {
        to_confirm: "processing",
        processing: "shipped",
        shipped: "delivered",
        delivered: null,
        cancelled: null,
      };
      const n = next[cur];
      if (!n) return prev;
      return { ...prev, [id]: n };
    });
  }

  function cancelOrder(id: string) {
    setStatuses((prev) => ({ ...prev, [id]: "cancelled" }));
    setCancelId(null);
    setSelectedOrder(null);
  }

  const enriched = ORDERS.map((o) => ({ ...o, status: statuses[o.id] }));

  const filtered = enriched
    .filter((o) => activeTab === "all" || o.status === activeTab)
    .filter(
      (o) =>
        search === "" ||
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.customer.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "Newest first") return b.id.localeCompare(a.id);
      if (sortBy === "Oldest first") return a.id.localeCompare(b.id);
      if (sortBy === "Total: High–Low") return b.total - a.total;
      if (sortBy === "Total: Low–High") return a.total - b.total;
      return 0;
    });

  const tabCounts = (id: TabId) =>
    id === "all"
      ? enriched.length
      : enriched.filter((o) => o.status === id).length;

  const selectedEnriched = selectedOrder
    ? enriched.find((o) => o.id === selectedOrder.id) ?? selectedOrder
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
          {filtered.length === 0 ? (
            <div className="py-16 flex flex-col items-center text-center">
              <ShoppingBag className="w-10 h-10 text-outline mb-3" />
              <p className="font-semibold text-on-surface">No orders found</p>
              <p className="text-sm text-on-surface-variant mt-1">
                Try adjusting your search or filters
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
                            #{order.id}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-sm font-semibold text-on-surface">
                            {order.customer}
                          </p>
                          <p className="text-[10px] text-on-surface-variant">
                            {order.email}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-on-surface-variant">
                          {order.items.length} item
                          {order.items.length > 1 ? "s" : ""}
                        </td>
                        <td className="px-4 py-3.5 text-sm font-bold text-deep-navy">
                          ${order.total}
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
                              onClick={() => setSelectedOrder(order)}
                              className="p-1.5 rounded-lg text-on-surface-variant hover:text-deep-navy hover:bg-surface-container transition-colors"
                              title="View details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {canAdvance && (
                              <button
                                onClick={() => advanceStatus(order.id)}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary-container text-deep-navy text-[10px] font-bold hover:border hover:border-deep-navy active:scale-[0.97] transition-all"
                              >
                                {order.status === "to_confirm"
                                  ? "Confirm"
                                  : order.status === "processing"
                                  ? "Ship"
                                  : "Deliver"}
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            )}
                            {canCancel && (
                              <button
                                onClick={() => setCancelId(order.id)}
                                className="p-1.5 rounded-lg text-on-surface-variant hover:text-red-600 hover:bg-red-50 transition-colors"
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
                Order <span className="font-mono font-bold text-deep-navy">#{cancelId}</span> will be cancelled and the customer will be notified.
              </p>
              <p className="text-xs text-on-surface-variant mb-5">
                This action cannot be undone. Any payment will be refunded automatically.
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
        {selectedEnriched && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setSelectedOrder(null)}
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
                    #{selectedEnriched.id}
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {selectedEnriched.date}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
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
                      STATUS_META[selectedEnriched.status].color
                    }`}
                  >
                    {STATUS_META[selectedEnriched.status].label}
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
                      {selectedEnriched.customer}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-outline mt-0.5 shrink-0" />
                    <span className="text-xs text-on-surface-variant">
                      {selectedEnriched.address}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5 text-outline" />
                    <span className="text-xs text-on-surface-variant">
                      {selectedEnriched.payment}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">
                    Items Ordered
                  </p>
                  <div className="border-2 border-deep-navy/10 rounded-xl overflow-hidden divide-y divide-outline-variant">
                    {selectedEnriched.items.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-deep-navy">
                            {item.name}
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            {item.variant} · Qty {item.qty}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-deep-navy">
                          ${item.price}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between px-4 py-3 bg-surface-container-low">
                      <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                        Total
                      </span>
                      <span className="font-bold text-deep-navy">
                        ${selectedEnriched.total}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tracking */}
                {selectedEnriched.trackingNo && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                      Tracking Number
                    </p>
                    <p className="text-sm font-mono text-primary bg-primary/5 border border-primary/20 px-3 py-2 rounded-lg">
                      {selectedEnriched.trackingNo}
                    </p>
                  </div>
                )}
              </div>

              {/* Panel actions */}
              <div className="border-t-2 border-deep-navy px-6 py-4 shrink-0 bg-white space-y-2.5">
                {(selectedEnriched.status === "to_confirm" ||
                  selectedEnriched.status === "processing" ||
                  selectedEnriched.status === "shipped") && (
                  <button
                    onClick={() => {
                      advanceStatus(selectedEnriched.id);
                      setSelectedOrder(null);
                    }}
                    className="w-full h-11 bg-primary-container text-deep-navy text-sm font-bold rounded-xl border-2 border-transparent hover:border-deep-navy active:scale-[0.97] transition-all"
                  >
                    {selectedEnriched.status === "to_confirm"
                      ? "Confirm Order"
                      : selectedEnriched.status === "processing"
                      ? "Mark as Shipped"
                      : "Mark as Delivered"}
                  </button>
                )}
                {CANCELLABLE.includes(selectedEnriched.status) && (
                  <button
                    onClick={() => {
                      setCancelId(selectedEnriched.id);
                      setSelectedOrder(null);
                    }}
                    className="w-full h-10 border-2 border-red-200 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-50 hover:border-red-400 active:scale-[0.97] transition-all"
                  >
                    Cancel Order
                  </button>
                )}
                {selectedEnriched.status !== "to_confirm" &&
                  selectedEnriched.status !== "processing" &&
                  selectedEnriched.status !== "shipped" && (
                    <button
                      onClick={() => setSelectedOrder(null)}
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
