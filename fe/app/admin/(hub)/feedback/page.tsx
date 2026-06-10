"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Star, CheckCircle2, MessageSquare, Send, Eye } from "lucide-react";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

type FeedbackStatus = "Open" | "Resolved";

interface FeedbackItem {
  id: string;
  author: string;
  email: string;
  subject: string;
  message: string;
  rating: number;
  status: FeedbackStatus;
  date: string;
  urgent: boolean;
}

const FEEDBACK_DATA: FeedbackItem[] = [
  { id: "FB-001", author: "Emma Strand", email: "emma.s@email.com", subject: "Checkout process is broken", message: "I've been trying to complete my order for the past hour but keep getting a payment error after entering my card details. This is very frustrating as the items were part of the flash sale.", rating: 1, status: "Open", date: "Today, 10:32 AM", urgent: true },
  { id: "FB-002", author: "Liam Thorsen", email: "l.thorsen@email.com", subject: "Great platform, minor UX issue", message: "Overall very happy with ShopIn! The product selection is excellent. One thing: the search filters on mobile are hard to close once opened. Would appreciate a fix.", rating: 4, status: "Open", date: "Today, 9:14 AM", urgent: false },
  { id: "FB-003", author: "Priya Nair", email: "priya.n@email.com", subject: "Order arrived damaged", message: "My order #ORD-5802 arrived with the packaging completely crushed. The ceramic mug set inside was broken. I need a replacement or refund urgently.", rating: 1, status: "Open", date: "Yesterday, 3:45 PM", urgent: true },
  { id: "FB-004", author: "Carlos Mendez", email: "carlos.m@email.com", subject: "Excellent seller support", message: "The seller support team helped me resolve my listing issue very quickly. Impressed by how professional and fast the response was. Keep it up!", rating: 5, status: "Resolved", date: "Yesterday, 11:20 AM", urgent: false },
  { id: "FB-005", author: "Sophie Berg", email: "s.berg@email.com", subject: "App crashes on product pages", message: "When I try to open any product detail page on my iPhone, the page goes blank and crashes. This has been happening for 2 days. Please fix ASAP.", rating: 2, status: "Open", date: "2 days ago", urgent: true },
  { id: "FB-006", author: "Noah Kim", email: "noah.k@email.com", subject: "Wrong item delivered", message: "I ordered a blue yoga mat but received a purple one. The order confirmation shows the correct item so this seems like a warehouse picking error.", rating: 2, status: "Open", date: "2 days ago", urgent: true },
  { id: "FB-007", author: "Ava Peterson", email: "ava.p@email.com", subject: "Love the new homepage design", message: "Just wanted to say the new homepage layout is so much better! Finding products by category is much easier now. The flash deals section is a nice touch too.", rating: 5, status: "Resolved", date: "3 days ago", urgent: false },
  { id: "FB-008", author: "Amara Osei", email: "amara.o@email.com", subject: "Coupon code not working", message: "I have a coupon code SAVE20 that should give 20% off but it keeps saying invalid at checkout. I received it in your newsletter email last week.", rating: 3, status: "Open", date: "3 days ago", urgent: false },
  { id: "FB-009", author: "TechVault Store", email: "techvault@seller.com", subject: "Product listings being rejected unfairly", message: "Three of my product listings were rejected without clear reason. The products comply with all platform guidelines. I need a detailed explanation.", rating: 2, status: "Open", date: "4 days ago", urgent: false },
  { id: "FB-010", author: "Hearth & Home", email: "hearth@seller.com", subject: "Payout delay", message: "My payout for November sales was supposed to arrive on the 15th but it's now the 22nd and I haven't received it. Please investigate immediately.", rating: 1, status: "Open", date: "5 days ago", urgent: true },
  { id: "FB-011", author: "ZenGear Co.", email: "zen@seller.com", subject: "Dashboard analytics working great", message: "The new seller dashboard analytics are very helpful for tracking my shop performance. Would love to see weekly breakdowns added in future.", rating: 5, status: "Resolved", date: "6 days ago", urgent: false },
  { id: "FB-012", author: "BrightMinds Shop", email: "bright@seller.com", subject: "Inventory sync issue", message: "My inventory levels aren't syncing correctly between the platform and my warehouse system. Items showing as in-stock are actually out-of-stock.", rating: 2, status: "Resolved", date: "1 week ago", urgent: false },
];

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

type FilterTab = "All" | "Open" | "Resolved";
const TABS: FilterTab[] = ["All", "Open", "Resolved"];

export default function FeedbackPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("All");
  const [selected, setSelected] = useState<FeedbackItem | null>(null);
  const [resolved, setResolved] = useState<Set<string>>(
    new Set(FEEDBACK_DATA.filter((f) => f.status === "Resolved").map((f) => f.id))
  );
  const [replyText, setReplyText] = useState("");
  const [replySent, setReplySent] = useState<Set<string>>(new Set());

  const filtered = FEEDBACK_DATA.filter((f) => {
    if (activeTab === "Open") return !resolved.has(f.id);
    if (activeTab === "Resolved") return resolved.has(f.id);
    return true;
  });

  function toggleResolve(id: string) {
    setResolved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function sendReply(id: string) {
    setReplySent((prev) => new Set(prev).add(id));
    setReplyText("");
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
        {TABS.map((tab) => {
          const count = tab === "All"
            ? FEEDBACK_DATA.length
            : tab === "Open"
            ? FEEDBACK_DATA.filter((f) => !resolved.has(f.id)).length
            : FEEDBACK_DATA.filter((f) => resolved.has(f.id)).length;
          return (
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
              }`}>{count}</span>
            </button>
          );
        })}
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
              {filtered.map((item) => {
                const isResolved = resolved.has(item.id);
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
                    <td className="px-5 py-3.5 text-sm text-on-surface-variant whitespace-nowrap">{item.date}</td>
                    <td className="pr-5 py-3.5">
                      <button
                        onClick={() => { setSelected(item); setReplyText(""); }}
                        className="flex items-center gap-1 text-xs font-bold text-primary hover:text-deep-navy transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
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
                    <p className="text-[10px] text-outline mt-0.5">{selected.date}</p>
                  </div>
                  <StarRating rating={selected.rating} />
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${
                    resolved.has(selected.id)
                      ? "bg-primary/10 text-primary border-primary/20"
                      : selected.urgent
                      ? "bg-red-50 text-red-500 border-red-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    {resolved.has(selected.id) ? <CheckCircle2 className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                    {resolved.has(selected.id) ? "Resolved" : selected.urgent ? "Urgent" : "Open"}
                  </span>
                  <span className="text-[10px] text-outline font-mono">{selected.id}</span>
                </div>

                {/* Message */}
                <div className="bg-surface-container-low rounded-xl p-4">
                  <p className="text-label-caps text-on-surface-variant mb-2">Message</p>
                  <p className="text-sm text-on-surface leading-relaxed">{selected.message}</p>
                </div>

                {/* Reply */}
                <div>
                  <p className="text-label-caps text-on-surface-variant mb-2">Reply</p>
                  {replySent.has(selected.id) ? (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-sm text-primary bg-primary/10 border border-primary/20 rounded-xl px-4 py-3"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Reply sent successfully
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
                        onClick={() => sendReply(selected.id)}
                        disabled={!replyText.trim()}
                        className="mt-2 flex items-center gap-2 px-4 h-9 bg-primary-container text-deep-navy text-xs font-bold rounded-xl border-2 border-transparent hover:border-deep-navy disabled:opacity-40 transition-all"
                      >
                        <Send className="w-3.5 h-3.5" /> Send Reply
                      </button>
                    </>
                  )}
                </div>

                {/* Resolve action */}
                <button
                  onClick={() => toggleResolve(selected.id)}
                  className={`w-full flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-bold border-2 transition-all duration-150 ${
                    resolved.has(selected.id)
                      ? "bg-white text-amber-700 border-amber-200 hover:bg-amber-50 hover:border-amber-400"
                      : "bg-primary-container text-deep-navy border-primary-container hover:border-deep-navy"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {resolved.has(selected.id) ? "Reopen Feedback" : "Mark as Resolved"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
