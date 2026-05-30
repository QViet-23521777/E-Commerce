"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle2, XCircle, Eye, Clock, Ban, Loader2 } from "lucide-react";
import {
  fetchModerationProducts,
  setProductModeration,
  type ModerationProduct,
  type ModerationStatus,
} from "@/lib/moderation";
import { formatVND } from "@/lib/products";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];
const FALLBACK_IMG = "https://placehold.co/400x400/e2e2e2/6a7a7b?text=IMG";

const STATUS_META: Record<ModerationStatus, { color: string; Icon: React.ElementType }> = {
  pending: { color: "bg-amber-50 text-amber-700 border-amber-200", Icon: Clock },
  approved: { color: "bg-primary/10 text-primary border-primary/20", Icon: CheckCircle2 },
  rejected: { color: "bg-red-50 text-red-500 border-red-200", Icon: Ban },
};

const TABS: ModerationStatus[] = ["pending", "approved", "rejected"];
const TAB_LABEL: Record<ModerationStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export default function ProductModerationPage() {
  const [activeTab, setActiveTab] = useState<ModerationStatus>("pending");
  const [items, setItems] = useState<ModerationProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selected, setSelected] = useState<ModerationProduct | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [acting, setActing] = useState(false);

  const load = useCallback(async (status: ModerationStatus) => {
    setLoading(true);
    setLoadError("");
    try {
      setItems(await fetchModerationProducts(status));
    } catch (err: unknown) {
      setLoadError((err as { message?: string })?.message ?? "Couldn't load products.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(activeTab);
  }, [activeTab, load]);

  async function act(id: string, status: "approved" | "rejected", reason?: string) {
    setActing(true);
    try {
      await setProductModeration(id, status, reason);
      setItems((prev) => prev.filter((p) => p._id !== id));
      setSelected(null);
      setRejecting(false);
      setRejectReason("");
    } catch {
      // keep panel open on failure
    } finally {
      setActing(false);
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto w-full">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-px w-5 bg-red-400" />
          <p className="text-label-caps text-red-500">Moderation</p>
        </div>
        <h1 className="text-2xl font-bold text-deep-navy tracking-tight">Product Moderation</h1>
        <p className="text-sm text-on-surface-variant mt-0.5">Review and approve or reject product submissions.</p>
      </div>

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
            {TAB_LABEL[tab]}
          </button>
        ))}
      </div>

      <div className="bg-white border-2 border-deep-navy rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center text-on-surface-variant">
            <Loader2 className="w-7 h-7 animate-spin mb-3" />
            <p className="text-sm">Loading…</p>
          </div>
        ) : loadError ? (
          <div className="py-16 flex flex-col items-center text-center">
            <p className="font-semibold text-on-surface">{loadError}</p>
            <button onClick={() => load(activeTab)} className="mt-3 text-sm font-bold text-primary hover:underline">Try again</button>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-sm text-on-surface-variant">No {TAB_LABEL[activeTab].toLowerCase()} products.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-low border-b-2 border-deep-navy">
                  {["Product", "Category", "Price", "Status", ""].map((h) => (
                    <th key={h} className="text-left text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-5 py-3 first:pl-6">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {items.map((product) => {
                  const status = (product.status ?? "pending") as ModerationStatus;
                  const meta = STATUS_META[status];
                  const StatusIcon = meta.Icon;
                  return (
                    <tr key={product._id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={product.imageUrl?.trim() ? product.imageUrl : FALLBACK_IMG}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover border border-outline-variant shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                          />
                          <div>
                            <p className="text-sm font-semibold text-deep-navy max-w-[200px] truncate capitalize">{product.name}</p>
                            <p className="text-[10px] text-on-surface-variant font-mono">{product._id.slice(-8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-on-surface-variant capitalize">{product.type ?? "—"}</td>
                      <td className="px-5 py-3 text-sm font-bold text-deep-navy">{formatVND(Number(product.price ?? 0))}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.color}`}>
                          <StatusIcon className="w-2.5 h-2.5" />
                          {TAB_LABEL[status]}
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
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/30"
              onClick={() => !acting && setSelected(null)}
            />
            <motion.div
              initial={{ x: 440 }} animate={{ x: 0 }} exit={{ x: 440 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="fixed right-0 top-0 h-full w-[440px] bg-white border-l-2 border-deep-navy z-50 flex flex-col overflow-y-auto"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b-2 border-deep-navy shrink-0">
                <h2 className="font-bold text-deep-navy">Product Review</h2>
                <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-surface-container rounded-lg text-on-surface-variant hover:text-deep-navy transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selected.imageUrl?.trim() ? selected.imageUrl : FALLBACK_IMG}
                  alt={selected.name}
                  className="w-full h-48 object-cover border-b-2 border-deep-navy"
                  onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                />
                <div className="p-6 space-y-5">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-lg font-bold text-deep-navy capitalize">{selected.name}</h3>
                      <span className="text-xl font-bold text-deep-navy shrink-0">{formatVND(Number(selected.price ?? 0))}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full capitalize">{selected.type ?? "—"}</span>
                      {selected.sellerId && <span className="text-[10px] text-on-surface-variant">seller {selected.sellerId.slice(-8)}</span>}
                      <span className="text-[10px] text-outline font-mono">{selected._id.slice(-8)}</span>
                    </div>
                  </div>

                  <div className="bg-surface-container-low rounded-xl p-4">
                    <p className="text-label-caps text-on-surface-variant mb-2">Product Description</p>
                    <p className="text-sm text-on-surface leading-relaxed">{selected.description}</p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-label-caps text-on-surface-variant">Moderation Actions</p>
                    <AnimatePresence mode="wait">
                      {rejecting ? (
                        <motion.div key="reject-form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-3">
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
                              onClick={() => act(selected._id, "rejected", rejectReason)}
                              disabled={!rejectReason.trim() || acting}
                              className="flex-1 flex items-center justify-center gap-2 h-10 bg-red-500 text-white text-sm font-bold rounded-xl border-2 border-transparent hover:border-red-700 disabled:opacity-40 transition-all"
                            >
                              <XCircle className="w-4 h-4" /> Confirm Rejection
                            </button>
                            <button onClick={() => setRejecting(false)} disabled={acting} className="px-4 h-10 bg-white text-on-surface-variant text-sm font-bold rounded-xl border-2 border-outline-variant hover:border-deep-navy transition-all">Cancel</button>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div key="action-buttons" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="flex gap-2">
                          <button
                            onClick={() => act(selected._id, "approved")}
                            disabled={selected.status === "approved" || acting}
                            className="flex-1 flex items-center justify-center gap-2 h-10 bg-primary-container text-deep-navy text-sm font-bold rounded-xl border-2 border-transparent hover:border-deep-navy disabled:opacity-40 transition-all"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Approve
                          </button>
                          <button
                            onClick={() => setRejecting(true)}
                            disabled={selected.status === "rejected" || acting}
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
