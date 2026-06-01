"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Package, Search, ChevronRight, SlidersHorizontal } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

type StatusFilter = "All" | "Processing" | "Shipped" | "Delivered" | "Cancelled";

const ORDERS = [
  {
    id: "4920",
    product: "Hand-Woven Bamboo Lamp",
    qty: 1,
    status: "Delivered",
    date: "Oct 12, 2024",
    total: "$320.00",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBqiE_3yYfaa9MGAf4ckjwM4q7Mqu2_Iz1nKbpM0LLiQiglJWVhM0M2cfKayFDUrfgnwhjus7cAj6Jm4tLDHon9-mSigEVHGvRoiKbCZGnDSEk6mTI3Ilu7ivPq83PedR7syPOMj7Echsltht2GcxDbvBHGrK2XDC3utMl7Hq4ZKuy1vCBtuybpYu4hfAVauclNgV2rdeiE4NS6_ImSl5Hcc74MRjZAc2-3ub60TPbLQ-qGPv4ZSop3evz7-r4Hh7LmhrVVRrYJzAyt",
  },
  {
    id: "4918",
    product: "V60 Ceramic Dripper",
    qty: 1,
    status: "Processing",
    date: "Nov 3, 2024",
    total: "$145.50",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDuYPHC5ZucXkMLQdPzRtMwA5fwVf4vodbpXzIAj1S6x4XKjM2fAlF7-u-Z-AU3MWyNLivbqT5NJVyhECEfYebs0h9qutzgtz955zo46r6UKJ_32aNcoy_7_fNGgqJzQY7CDeFPibKGTiQOwhV3lPfA9eC6I9W4_XCDYFh4FgdiwfC_x7VTV8hox8fmMw3BIDeUe8i7OCB11qcswwjZTdPA83Cj2SJY5IbVEXpLsg6dQg6vLyyj5o-lN_LUe6-ocebtxqygqhHLieN3",
  },
  {
    id: "4915",
    product: "Merino Wool Throw + Cork Mat",
    qty: 2,
    status: "Shipped",
    date: "Nov 1, 2024",
    total: "$220.00",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBQnttJbzpiC4QRt8GQvgN_K-LPivaoWxQbJdHzb6kosJGev_3CVhSB--6w9rlF8agmBGyseznO-fU5e1Y510XVbDyymty-zPapnIeQH0i2v-czpBGaZUG686ds_gVZg8Yt2DZzTsztQzLti-onPa5W4qfl6OsvhvxKFZgqmbBaWe72wtwVwwZQuR9HEBPYH3t82nWIzD50ODtN_69mApTqtSBSltL2RWLb-lr-ZAJHgfzLF2T9M8XCj94gw-qjt3zBlxgWDXT7jHus",
  },
  {
    id: "4910",
    product: "Leather Journal — Blank",
    qty: 1,
    status: "Delivered",
    date: "Sep 28, 2024",
    total: "$78.00",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBqiE_3yYfaa9MGAf4ckjwM4q7Mqu2_Iz1nKbpM0LLiQiglJWVhM0M2cfKayFDUrfgnwhjus7cAj6Jm4tLDHon9-mSigEVHGvRoiKbCZGnDSEk6mTI3Ilu7ivPq83PedR7syPOMj7Echsltht2GcxDbvBHGrK2XDC3utMl7Hq4ZKuy1vCBtuybpYu4hfAVauclNgV2rdeiE4NS6_ImSl5Hcc74MRjZAc2-3ub60TPbLQ-qGPv4ZSop3evz7-r4Hh7LmhrVVRrYJzAyt",
  },
  {
    id: "4905",
    product: "Bonsai Starter Kit",
    qty: 1,
    status: "Cancelled",
    date: "Sep 15, 2024",
    total: "$55.00",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDuYPHC5ZucXkMLQdPzRtMwA5fwVf4vodbpXzIAj1S6x4XKjM2fAlF7-u-Z-AU3MWyNLivbqT5NJVyhECEfYebs0h9qutzgtz955zo46r6UKJ_32aNcoy_7_fNGgqJzQY7CDeFPibKGTiQOwhV3lPfA9eC6I9W4_XCDYFh4FgdiwfC_x7VTV8hox8fmMw3BIDeUe8i7OCB11qcswwjZTdPA83Cj2SJY5IbVEXpLsg6dQg6vLyyj5o-lN_LUe6-ocebtxqygqhHLieN3",
  },
];

const STATUS_CHIP: Record<string, string> = {
  Delivered: "text-primary bg-primary/5 border-primary/20",
  Processing: "text-secondary bg-secondary/5 border-secondary/20",
  Shipped: "text-tertiary bg-tertiary/5 border-tertiary/20",
  Cancelled: "text-error bg-error/5 border-error/20",
};

const FILTERS: StatusFilter[] = [
  "All",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

export default function OrderHistoryPage() {
  const [filter, setFilter] = useState<StatusFilter>("All");
  const [search, setSearch] = useState("");

  const filtered = ORDERS.filter((o) => {
    const matchStatus = filter === "All" || o.status === filter;
    const matchSearch =
      o.product.toLowerCase().includes(search.toLowerCase()) ||
      o.id.includes(search);
    return matchStatus && matchSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
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
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
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
                <p className="font-semibold text-on-surface">No orders found</p>
                <p className="text-sm text-on-surface-variant mt-1">
                  Try adjusting your search or filter.
                </p>
              </motion.div>
            ) : (
              filtered.map((order, i) => (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.35, ease: EASE, delay: i * 0.05 },
                  }}
                  exit={{
                    opacity: 0,
                    y: -8,
                    transition: { duration: 0.2 },
                  }}
                >
                  <Link
                    href={`/orders/${order.id}`}
                    className="flex items-center gap-4 border-2 border-deep-navy rounded-xl p-4 bg-surface-container-lowest card-hover"
                  >
                    <img
                      src={order.image}
                      alt={order.product}
                      className="w-16 h-16 rounded-lg object-cover border border-outline-variant shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://placehold.co/64x64/e2e2e2/6a7a7b?text=IMG";
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-on-surface truncate">
                          {order.product}
                        </p>
                        <span
                          className={`shrink-0 text-label-caps border px-2 py-0.5 rounded-full ${STATUS_CHIP[order.status]}`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1">
                        Order #{order.id} · {order.date} · Qty: {order.qty}
                      </p>
                    </div>
                    <div className="text-right shrink-0 flex items-center gap-3">
                      <p className="font-bold text-on-surface">{order.total}</p>
                      <ChevronRight className="w-4 h-4 text-on-surface-variant" />
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
