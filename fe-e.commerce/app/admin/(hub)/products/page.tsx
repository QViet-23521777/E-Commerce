"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle2, XCircle, Eye, Clock, Ban } from "lucide-react";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

type ModerationStatus = "Pending" | "Approved" | "Rejected";

interface Product {
  id: string;
  name: string;
  seller: string;
  category: string;
  price: string;
  submitted: string;
  image: string;
  description: string;
  status: ModerationStatus;
}

const PRODUCTS: Product[] = [
  {
    id: "PRD-8821",
    name: "Wireless Earbuds Pro Max",
    seller: "TechVault Store",
    category: "Electronics",
    price: "$49.99",
    submitted: "Today, 11:20 AM",
    image: "https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=400&q=80",
    description: "Premium wireless earbuds with active noise cancellation, 30-hour battery life, and IPX5 water resistance. Comes with 3 ear tip sizes and charging case.",
    status: "Pending",
  },
  {
    id: "PRD-8820",
    name: "Organic Face Serum 50ml",
    seller: "GlowUp Beauty",
    category: "Health & Beauty",
    price: "$34.99",
    submitted: "Today, 9:05 AM",
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80",
    description: "100% organic vitamin C serum with hyaluronic acid. Brightens skin tone and reduces fine lines. Suitable for all skin types. Dermatologically tested.",
    status: "Pending",
  },
  {
    id: "PRD-8819",
    name: "Bamboo Yoga Mat XL",
    seller: "ZenGear Co.",
    category: "Sports",
    price: "$39.99",
    submitted: "Yesterday, 4:30 PM",
    image: "https://images.unsplash.com/photo-1601925228907-5e2e654a5de5?w=400&q=80",
    description: "Extra-large 200x80cm non-slip yoga mat made from sustainable bamboo fibres. 6mm thick for joint protection. Includes carrying strap.",
    status: "Pending",
  },
  {
    id: "PRD-8818",
    name: "Cast Iron Skillet 10\"",
    seller: "Hearth & Home",
    category: "Home & Living",
    price: "$54.99",
    submitted: "Yesterday, 1:15 PM",
    image: "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=400&q=80",
    description: "Pre-seasoned cast iron skillet compatible with all cooktops including induction. Even heat distribution. Oven safe up to 500°F. Lifetime warranty.",
    status: "Approved",
  },
  {
    id: "PRD-8817",
    name: "Children's Science Kit",
    seller: "BrightMinds Shop",
    category: "Toys & Baby",
    price: "$29.99",
    submitted: "2 days ago",
    image: "https://images.unsplash.com/photo-1532094349884-543559c4f7d4?w=400&q=80",
    description: "STEM science kit for ages 6-12. Includes 20 experiments covering chemistry, biology, and physics. All materials safe and non-toxic. Comes with activity guide.",
    status: "Approved",
  },
  {
    id: "PRD-8816",
    name: "Replica Designer Handbag",
    seller: "LuxFakes Ltd.",
    category: "Fashion",
    price: "$89.99",
    submitted: "2 days ago",
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80",
    description: "High quality replica of a luxury designer handbag. Identical stitching and hardware.",
    status: "Rejected",
  },
  {
    id: "PRD-8815",
    name: "Mechanical Gaming Keyboard",
    seller: "TechVault Store",
    category: "Electronics",
    price: "$79.99",
    submitted: "3 days ago",
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&q=80",
    description: "Full-size mechanical keyboard with blue switches, per-key RGB backlighting, and anti-ghosting. Braided USB-C cable included.",
    status: "Pending",
  },
  {
    id: "PRD-8814",
    name: "Ceramic Pour-Over Set",
    seller: "Hearth & Home",
    category: "Home & Living",
    price: "$44.99",
    submitted: "3 days ago",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80",
    description: "Handcrafted ceramic pour-over coffee dripper with matching mug. Dishwasher safe glaze. Each piece is unique due to the handmade process.",
    status: "Approved",
  },
  {
    id: "PRD-8813",
    name: "Unbranded Dietary Supplements",
    seller: "QuickDrop Co.",
    category: "Health & Beauty",
    price: "$19.99",
    submitted: "4 days ago",
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80",
    description: "Weight loss pills, 60 capsules. Fast results guaranteed.",
    status: "Rejected",
  },
  {
    id: "PRD-8812",
    name: "Running Shoes Ultra Boost",
    seller: "ZenGear Co.",
    category: "Sports",
    price: "$89.99",
    submitted: "4 days ago",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
    description: "Lightweight road running shoes with responsive foam midsole and breathable mesh upper. Available in sizes 5-13. Carbon fibre plate for propulsion.",
    status: "Pending",
  },
  {
    id: "PRD-8811",
    name: "LED Strip Lights 5m",
    seller: "TechVault Store",
    category: "Electronics",
    price: "$24.99",
    submitted: "5 days ago",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
    description: "Smart RGB LED strip with app control, music sync, and 16 million colour options. Self-adhesive backing, compatible with Alexa and Google Home.",
    status: "Approved",
  },
  {
    id: "PRD-8810",
    name: "Herbal Tea Collection",
    seller: "NaturalGoods",
    category: "Food & Grocery",
    price: "$18.99",
    submitted: "5 days ago",
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80",
    description: "Selection of 12 premium herbal teas including chamomile, peppermint, ginger, and turmeric. 30 biodegradable tea bags. No artificial flavourings.",
    status: "Approved",
  },
];

const STATUS_META: Record<ModerationStatus, { color: string; Icon: React.ElementType }> = {
  Pending: { color: "bg-amber-50 text-amber-700 border-amber-200", Icon: Clock },
  Approved: { color: "bg-primary/10 text-primary border-primary/20", Icon: CheckCircle2 },
  Rejected: { color: "bg-red-50 text-red-500 border-red-200", Icon: Ban },
};

type FilterTab = "All" | "Pending" | "Approved" | "Rejected";
const TABS: FilterTab[] = ["All", "Pending", "Approved", "Rejected"];

export default function ProductModerationPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("Pending");
  const [selected, setSelected] = useState<Product | null>(null);
  const [statuses, setStatuses] = useState<Record<string, ModerationStatus>>(
    Object.fromEntries(PRODUCTS.map((p) => [p.id, p.status]))
  );
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const filtered = PRODUCTS.filter((p) => {
    const s = statuses[p.id];
    if (activeTab === "All") return true;
    return s === activeTab;
  });

  function approve(id: string) {
    setStatuses((prev) => ({ ...prev, [id]: "Approved" }));
    setRejecting(false);
  }

  function reject(id: string) {
    setStatuses((prev) => ({ ...prev, [id]: "Rejected" }));
    setRejecting(false);
    setRejectReason("");
  }

  const tabCount = (tab: FilterTab) =>
    tab === "All" ? PRODUCTS.length : PRODUCTS.filter((p) => statuses[p.id] === tab).length;

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-px w-5 bg-red-400" />
          <p className="text-label-caps text-red-500">Moderation</p>
        </div>
        <h1 className="text-2xl font-bold text-deep-navy tracking-tight">Product Moderation</h1>
        <p className="text-sm text-on-surface-variant mt-0.5">Review and approve or reject new product submissions.</p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-5">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border-2 transition-all duration-150 ${
              activeTab === tab
                ? "bg-deep-navy text-white border-deep-navy"
                : "bg-white text-on-surface-variant border-outline-variant hover:border-deep-navy"
            }`}
          >
            {tab}
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
              activeTab === tab ? "bg-white/20 text-white" : "bg-surface-container text-on-surface-variant"
            }`}>{tabCount(tab)}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border-2 border-deep-navy rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-container-low border-b-2 border-deep-navy">
                {["Product", "Seller", "Category", "Price", "Submitted", "Status", ""].map((h) => (
                  <th key={h} className="text-left text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-5 py-3 first:pl-6">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filtered.map((product) => {
                const status = statuses[product.id];
                const meta = STATUS_META[status];
                const StatusIcon = meta.Icon;
                return (
                  <tr key={product.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={product.image}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover border border-outline-variant shrink-0"
                        />
                        <div>
                          <p className="text-sm font-semibold text-deep-navy max-w-[160px] truncate">{product.name}</p>
                          <p className="text-[10px] text-on-surface-variant font-mono">{product.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-on-surface-variant">{product.seller}</td>
                    <td className="px-5 py-3 text-sm text-on-surface-variant">{product.category}</td>
                    <td className="px-5 py-3 text-sm font-bold text-deep-navy">{product.price}</td>
                    <td className="px-5 py-3 text-sm text-on-surface-variant whitespace-nowrap">{product.submitted}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.color}`}>
                        <StatusIcon className="w-2.5 h-2.5" />
                        {status}
                      </span>
                    </td>
                    <td className="pr-5 py-3">
                      <button
                        onClick={() => { setSelected(product); setRejecting(false); setRejectReason(""); }}
                        className="flex items-center gap-1 text-xs font-bold text-primary hover:text-deep-navy transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Review
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/30"
              onClick={() => setSelected(null)}
            />
            <motion.div
              initial={{ x: 440 }}
              animate={{ x: 0 }}
              exit={{ x: 440 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="fixed right-0 top-0 h-full w-[440px] bg-white border-l-2 border-deep-navy z-50 flex flex-col overflow-y-auto"
            >
              {/* Panel header */}
              <div className="flex items-center justify-between px-6 py-4 border-b-2 border-deep-navy shrink-0">
                <h2 className="font-bold text-deep-navy">Product Review</h2>
                <button
                  onClick={() => setSelected(null)}
                  className="p-1.5 hover:bg-surface-container rounded-lg text-on-surface-variant hover:text-deep-navy transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {/* Product image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selected.image}
                  alt={selected.name}
                  className="w-full h-48 object-cover border-b-2 border-deep-navy"
                />

                <div className="p-6 space-y-5">
                  {/* Info */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-lg font-bold text-deep-navy">{selected.name}</h3>
                      <span className="text-xl font-bold text-deep-navy shrink-0">{selected.price}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                        {selected.category}
                      </span>
                      <span className="text-[10px] text-on-surface-variant">by {selected.seller}</span>
                      <span className="text-[10px] text-outline font-mono">{selected.id}</span>
                    </div>
                  </div>

                  {/* Current status */}
                  <div className="flex items-center gap-2">
                    {(() => {
                      const status = statuses[selected.id];
                      const meta = STATUS_META[status];
                      const Icon = meta.Icon;
                      return (
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${meta.color}`}>
                          <Icon className="w-3 h-3" /> {status}
                        </span>
                      );
                    })()}
                    <span className="text-xs text-on-surface-variant">Submitted {selected.submitted}</span>
                  </div>

                  {/* Description */}
                  <div className="bg-surface-container-low rounded-xl p-4">
                    <p className="text-label-caps text-on-surface-variant mb-2">Product Description</p>
                    <p className="text-sm text-on-surface leading-relaxed">{selected.description}</p>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <p className="text-label-caps text-on-surface-variant">Moderation Actions</p>

                    <AnimatePresence mode="wait">
                      {rejecting ? (
                        <motion.div
                          key="reject-form"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-3"
                        >
                          <div>
                            <label className="block text-xs font-bold text-deep-navy mb-1.5">Rejection Reason</label>
                            <textarea
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              placeholder="Explain why this product is being rejected…"
                              rows={3}
                              className="block w-full px-4 py-3 border-2 border-red-200 rounded-xl bg-white text-sm focus:border-red-400 outline-none transition-colors resize-none"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => reject(selected.id)}
                              disabled={!rejectReason.trim()}
                              className="flex-1 flex items-center justify-center gap-2 h-10 bg-red-500 text-white text-sm font-bold rounded-xl border-2 border-transparent hover:border-red-700 disabled:opacity-40 transition-all"
                            >
                              <XCircle className="w-4 h-4" /> Confirm Rejection
                            </button>
                            <button
                              onClick={() => setRejecting(false)}
                              className="px-4 h-10 bg-white text-on-surface-variant text-sm font-bold rounded-xl border-2 border-outline-variant hover:border-deep-navy transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="action-buttons"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2 }}
                          className="flex gap-2"
                        >
                          <button
                            onClick={() => approve(selected.id)}
                            disabled={statuses[selected.id] === "Approved"}
                            className="flex-1 flex items-center justify-center gap-2 h-10 bg-primary-container text-deep-navy text-sm font-bold rounded-xl border-2 border-transparent hover:border-deep-navy disabled:opacity-40 transition-all"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Approve
                          </button>
                          <button
                            onClick={() => setRejecting(true)}
                            disabled={statuses[selected.id] === "Rejected"}
                            className="flex-1 flex items-center justify-center gap-2 h-10 bg-white text-red-500 text-sm font-bold rounded-xl border-2 border-red-200 hover:bg-red-50 hover:border-red-400 disabled:opacity-40 transition-all"
                          >
                            <XCircle className="w-4 h-4" /> Reject
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
