"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Users,
  Package,
  Clock,
  MessageSquare,
  ArrowUpRight,
  ChevronRight,
  CheckCircle2,
  Star,
} from "lucide-react";
import Link from "next/link";
import TwoFactorToggle from "@/components/TwoFactorToggle";
import { fetchAdminUserStats, fetchProductStats } from "@/lib/admin";
import { fetchFeedback, type Feedback } from "@/lib/support";
import { fetchModerationProducts, type ModerationProduct } from "@/lib/moderation";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

const today = new Date().toLocaleDateString("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

function fmtDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function AdminDashboardPage() {
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [signups, setSignups] = useState<{ month: string; value: number }[]>([]);
  const [products, setProducts] = useState<{ total: number; pending: number } | null>(null);
  const [pendingList, setPendingList] = useState<ModerationProduct[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);

  useEffect(() => {
    (async () => {
      const [users, prod, pending, fb] = await Promise.all([
        fetchAdminUserStats().catch(() => null),
        fetchProductStats().catch(() => null),
        fetchModerationProducts("pending", 5).catch(() => []),
        fetchFeedback().catch(() => []),
      ]);
      if (users) {
        setTotalUsers(users.totalUsers);
        setSignups(users.monthlySignups);
      }
      if (prod) setProducts({ total: prod.total, pending: prod.pending });
      setPendingList(pending);
      setFeedback(fb);
    })();
  }, []);

  const openFeedback = feedback.filter((f) => f.status === "open");
  const urgentCount = openFeedback.filter((f) => f.urgent).length;
  const recentFeedback = useMemo(
    () =>
      [...feedback]
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
        )
        .slice(0, 5),
    [feedback],
  );

  const maxSignup = Math.max(1, ...signups.map((s) => s.value));
  const thisMonthSignups = signups.length ? signups[signups.length - 1].value : 0;
  const lastMonthSignups = signups.length > 1 ? signups[signups.length - 2].value : 0;
  const signupPct =
    lastMonthSignups > 0
      ? Math.round(((thisMonthSignups - lastMonthSignups) / lastMonthSignups) * 100)
      : null;

  const STATS = [
    {
      label: "Total Users",
      value: totalUsers === null ? "…" : totalUsers.toLocaleString(),
      sub: signupPct === null ? "—" : `${signupPct >= 0 ? "+" : ""}${signupPct}% this month`,
      up: (signupPct ?? 0) > 0,
      icon: Users,
      accent: "text-green-600",
    },
    {
      label: "Total Products",
      value: products === null ? "…" : products.total.toLocaleString(),
      sub: `${products?.pending ?? 0} pending review`,
      up: false,
      icon: Package,
      accent: "text-on-surface-variant",
    },
    {
      label: "Pending Approvals",
      value: products === null ? "…" : String(products.pending),
      sub: "Needs attention",
      up: false,
      icon: Clock,
      accent: "text-amber-600",
    },
    {
      label: "Open Feedback",
      value: String(openFeedback.length),
      sub: `${urgentCount} marked urgent`,
      up: false,
      icon: MessageSquare,
      accent: "text-red-500",
    },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-px w-5 bg-red-400" />
          <p className="text-label-caps text-red-500">Platform Overview</p>
        </div>
        <h1 className="text-2xl font-bold text-deep-navy tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-on-surface-variant mt-0.5">ShopIn Platform · {today}</p>
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
              <p className="text-2xl font-bold text-deep-navy mb-0.5 tracking-tight">{stat.value}</p>
              <p className="text-xs font-semibold text-on-surface-variant">{stat.label}</p>
              <p className={`text-[10px] mt-0.5 ${stat.accent}`}>{stat.sub}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        {/* New user signups chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE, delay: 0.22 }}
          className="lg:col-span-2 bg-white border-2 border-deep-navy rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-label-caps text-primary mb-0.5">Growth</p>
              <h2 className="font-bold text-deep-navy">New User Registrations</h2>
            </div>
            {signupPct !== null && (
              <span className={`text-sm font-bold flex items-center gap-1 border px-2.5 py-1 rounded-full ${
                signupPct >= 0
                  ? "text-green-600 bg-green-50 border-green-200"
                  : "text-red-600 bg-red-50 border-red-200"
              }`}>
                <ArrowUpRight className="w-3.5 h-3.5" />
                {signupPct >= 0 ? "+" : ""}{signupPct}%
              </span>
            )}
          </div>
          <div className="flex items-end gap-2 sm:gap-3" style={{ height: 120 }}>
            {signups.map((bar, i) => {
              const isLatest = i === signups.length - 1;
              const barH = Math.round((bar.value / maxSignup) * 104);
              return (
                <div key={`${bar.month}-${i}`} className="flex-1 flex flex-col items-center gap-1.5">
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
                  <span className={`text-[10px] font-medium ${isLatest ? "text-deep-navy font-bold" : "text-on-surface-variant"}`}>
                    {bar.month}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-outline-variant flex justify-between text-xs text-on-surface-variant">
            <span>Trailing 6 months</span>
            <span className="font-bold text-deep-navy">{thisMonthSignups} new users this month</span>
          </div>
        </motion.div>

        {/* Pending product approvals */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE, delay: 0.28 }}
          className="bg-white border-2 border-deep-navy rounded-xl p-6"
        >
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-center shrink-0">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div>
              <h2 className="font-bold text-deep-navy text-sm">Pending Approvals</h2>
              <p className="text-[10px] text-on-surface-variant">Products awaiting review</p>
            </div>
          </div>
          <div className="space-y-3">
            {pendingList.length === 0 ? (
              <p className="text-sm text-on-surface-variant py-4">No products awaiting review.</p>
            ) : (
              pendingList.map((p) => (
                <div key={p._id} className="py-2 border-b border-outline-variant last:border-0">
                  <p className="text-sm font-semibold text-deep-navy truncate capitalize">{p.name}</p>
                  <p className="text-[10px] text-on-surface-variant">{p.type || "—"}</p>
                </div>
              ))
            )}
          </div>
          <Link
            href="/admin/products"
            className="mt-4 flex items-center gap-1 text-xs font-bold text-primary hover:text-deep-navy transition-colors"
          >
            Review all <ChevronRight className="w-3 h-3" />
          </Link>
        </motion.div>
      </div>

      {/* Recent feedback table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE, delay: 0.34 }}
        className="bg-white border-2 border-deep-navy rounded-xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-deep-navy">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-deep-navy" />
            <h2 className="font-bold text-deep-navy">Recent Feedback</h2>
          </div>
          <Link
            href="/admin/feedback"
            className="text-xs font-bold text-primary hover:text-deep-navy transition-colors flex items-center gap-1"
          >
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                {["Author", "Subject", "Rating", "Status", "Date"].map((h) => (
                  <th key={h} className="text-left text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-5 py-3 first:pl-6">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {recentFeedback.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-on-surface-variant">No feedback yet.</td></tr>
              ) : (
                recentFeedback.map((f) => (
                  <tr key={f.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-surface-container rounded-full flex items-center justify-center text-[10px] font-bold text-deep-navy shrink-0">
                          {(f.author || "?").split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <span className="text-sm font-semibold text-deep-navy">{f.author}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-on-surface-variant max-w-[220px] truncate">{f.subject}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {f.rating}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        f.status === "resolved"
                          ? "bg-primary/10 text-primary border-primary/20"
                          : f.urgent
                          ? "bg-red-50 text-red-500 border-red-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {f.status === "resolved" && <CheckCircle2 className="w-2.5 h-2.5" />}
                        {f.status === "resolved" ? "Resolved" : f.urgent ? "Urgent" : "Open"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-on-surface-variant">{fmtDate(f.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Security — admin's own login 2FA toggle */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE, delay: 0.4 }}
        className="mt-5 max-w-xl"
      >
        <TwoFactorToggle />
      </motion.div>
    </div>
  );
}
