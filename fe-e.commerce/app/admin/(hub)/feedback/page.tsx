"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Star, CheckCircle2, MessageSquare, Send } from "lucide-react";
import { fetchFeedback, updateFeedback, type Feedback } from "@/lib/support";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${i <= rating ? "fill-amber-400 text-amber-400" : "text-outline-variant"}`}
        />
      ))}
    </div>
  );
}

function fmtDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

type FilterTab = "All" | "Open" | "Resolved";
const TABS: FilterTab[] = ["All", "Open", "Resolved"];

export default function FeedbackPage() {
  const [items, setItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("All");
  const [selected, setSelected] = useState<Feedback | null>(null);
  const [replyText, setReplyText] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setItems(await fetchFeedback());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = items.filter((f) => {
    if (activeTab === "Open") return f.status === "open";
    if (activeTab === "Resolved") return f.status === "resolved";
    return true;
  });

  const counts = {
    All: items.length,
    Open: items.filter((f) => f.status === "open").length,
    Resolved: items.filter((f) => f.status === "resolved").length,
  };

  function applyUpdate(updated: Feedback) {
    setItems((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    setSelected((prev) => (prev && prev.id === updated.id ? updated : prev));
  }

  async function toggleResolve(item: Feedback) {
    setBusy(true);
    try {
      const next = item.status === "resolved" ? "open" : "resolved";
      applyUpdate(await updateFeedback(item.id, { status: next }));
    } finally {
      setBusy(false);
    }
  }

  async function sendReply(item: Feedback) {
    if (!replyText.trim()) return;
    setBusy(true);
    try {
      applyUpdate(await updateFeedback(item.id, { reply: replyText.trim() }));
      setReplyText("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-px w-5 bg-red-400" />
          <p className="text-label-caps text-red-500">Support</p>
        </div>
        <h1 className="text-2xl font-bold text-deep-navy tracking-tight">Feedback Management</h1>
        <p className="text-sm text-on-surface-variant mt-0.5">Review and respond to user feedback and support requests.</p>
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
            }`}>{counts[tab]}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border-2 border-deep-navy rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-container-low border-b-2 border-deep-navy">
                {["Author", "Subject", "Rating", "Status", "Date", ""].map((h) => (
                  <th key={h} className="text-left text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-5 py-3 first:pl-6">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-sm text-on-surface-variant">Loading feedback…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-sm text-on-surface-variant">No feedback in this view.</td></tr>
              ) : (
                filtered.map((item) => {
                  const isResolved = item.status === "resolved";
                  return (
                    <tr key={item.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          {item.urgent && !isResolved && (
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                          )}
                          <div>
                            <p className="text-sm font-semibold text-deep-navy">{item.author}</p>
                            <p className="text-[10px] text-on-surface-variant">{item.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-on-surface max-w-[200px] truncate">{item.subject}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <StarRating rating={item.rating} />
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isResolved
                            ? "bg-primary/10 text-primary border-primary/20"
                            : item.urgent
                            ? "bg-red-50 text-red-500 border-red-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                          {isResolved ? <CheckCircle2 className="w-2.5 h-2.5" /> : <MessageSquare className="w-2.5 h-2.5" />}
                          {isResolved ? "Resolved" : item.urgent ? "Urgent" : "Open"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-on-surface-variant whitespace-nowrap">{fmtDate(item.createdAt)}</td>
                      <td className="pr-5 py-3.5">
                        <button
                          onClick={() => { setSelected(item); setReplyText(""); }}
                          className="flex items-center gap-1 text-xs font-bold text-primary hover:text-deep-navy transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
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
              initial={{ x: 420 }}
              animate={{ x: 0 }}
              exit={{ x: 420 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="fixed right-0 top-0 h-full w-[420px] bg-white border-l-2 border-deep-navy z-50 flex flex-col overflow-y-auto"
            >
              {/* Panel header */}
              <div className="flex items-center justify-between px-6 py-4 border-b-2 border-deep-navy shrink-0">
                <h2 className="font-bold text-deep-navy">Feedback Detail</h2>
                <button
                  onClick={() => setSelected(null)}
                  className="p-1.5 hover:bg-surface-container rounded-lg text-on-surface-variant hover:text-deep-navy transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 flex-1 space-y-5">
                {/* Meta */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-deep-navy">{selected.subject}</h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">{selected.author} · {selected.email}</p>
                    <p className="text-[10px] text-outline mt-0.5">{fmtDate(selected.createdAt)}</p>
                  </div>
                  <StarRating rating={selected.rating} />
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${
                    selected.status === "resolved"
                      ? "bg-primary/10 text-primary border-primary/20"
                      : selected.urgent
                      ? "bg-red-50 text-red-500 border-red-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    {selected.status === "resolved" ? <CheckCircle2 className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                    {selected.status === "resolved" ? "Resolved" : selected.urgent ? "Urgent" : "Open"}
                  </span>
                </div>

                {/* Message */}
                <div className="bg-surface-container-low rounded-xl p-4">
                  <p className="text-label-caps text-on-surface-variant mb-2">Message</p>
                  <p className="text-sm text-on-surface leading-relaxed">{selected.message}</p>
                </div>

                {/* Reply */}
                <div>
                  <p className="text-label-caps text-on-surface-variant mb-2">Reply</p>
                  {selected.reply ? (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-on-surface bg-primary/5 border border-primary/20 rounded-xl px-4 py-3"
                    >
                      {selected.reply}
                    </motion.div>
                  ) : (
                    <>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a reply to this feedback…"
                        rows={4}
                        className="block w-full px-4 py-3 border-2 border-deep-navy/30 rounded-xl bg-white text-sm focus:border-primary-container outline-none transition-colors resize-none"
                      />
                      <button
                        onClick={() => sendReply(selected)}
                        disabled={!replyText.trim() || busy}
                        className="mt-2 flex items-center gap-2 px-4 h-9 bg-primary-container text-deep-navy text-xs font-bold rounded-xl border-2 border-transparent hover:border-deep-navy disabled:opacity-40 transition-all"
                      >
                        <Send className="w-3.5 h-3.5" /> Send Reply
                      </button>
                    </>
                  )}
                </div>

                {/* Resolve action */}
                <button
                  onClick={() => toggleResolve(selected)}
                  disabled={busy}
                  className={`w-full flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-bold border-2 transition-all duration-150 disabled:opacity-50 ${
                    selected.status === "resolved"
                      ? "bg-white text-amber-700 border-amber-200 hover:bg-amber-50 hover:border-amber-400"
                      : "bg-primary-container text-deep-navy border-primary-container hover:border-deep-navy"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {selected.status === "resolved" ? "Reopen Feedback" : "Mark as Resolved"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
