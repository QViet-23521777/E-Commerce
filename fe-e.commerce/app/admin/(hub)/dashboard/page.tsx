"use client";

import { motion } from "motion/react";
import {
  Users,
  Package,
  Clock,
  MessageSquare,
  ArrowUpRight,
  ChevronRight,
  CheckCircle2,
  UserPlus,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

const STATS = [
  {
    label: "Total Users",
    value: "3,842",
    sub: "+124 this week",
    up: true,
    icon: Users,
    accent: "text-green-600",
  },
  {
    label: "Total Products",
    value: "12,480",
    sub: "247 pending review",
    up: false,
    icon: Package,
    accent: "text-on-surface-variant",
  },
  {
    label: "Pending Approvals",
    value: "12",
    sub: "Needs attention",
    up: false,
    icon: Clock,
    accent: "text-amber-600",
  },
  {
    label: "Open Feedback",
    value: "34",
    sub: "8 marked urgent",
    up: false,
    icon: MessageSquare,
    accent: "text-red-500",
  },
];

const MONTHLY_SIGNUPS = [
  { month: "Jun", value: 310 },
  { month: "Jul", value: 420 },
  { month: "Aug", value: 390 },
  { month: "Sep", value: 510 },
  { month: "Oct", value: 680 },
  { month: "Nov", value: 824 },
];
const MAX_SIGNUP = Math.max(...MONTHLY_SIGNUPS.map((r) => r.value));

const PENDING_PRODUCTS = [
  { id: "PRD-8821", name: "Wireless Earbuds Pro Max", seller: "TechVault Store", category: "Electronics" },
  { id: "PRD-8820", name: "Organic Face Serum 50ml", seller: "GlowUp Beauty", category: "Health & Beauty" },
  { id: "PRD-8819", name: "Bamboo Yoga Mat XL", seller: "ZenGear Co.", category: "Sports" },
  { id: "PRD-8818", name: "Cast Iron Skillet 10\"", seller: "Hearth & Home", category: "Home & Living" },
  { id: "PRD-8817", name: "Children's Science Kit", seller: "BrightMinds Shop", category: "Toys & Baby" },
];

const RECENT_SIGNUPS = [
  { name: "Amara Osei", email: "amara.o@email.com", role: "buyer", joined: "2h ago", status: "Active" },
  { name: "Liam Thorsen", email: "l.thorsen@email.com", role: "seller", joined: "5h ago", status: "Active" },
  { name: "Priya Nair", email: "priya.n@email.com", role: "buyer", joined: "Yesterday", status: "Active" },
  { name: "Carlos Mendez", email: "carlos.m@email.com", role: "seller", joined: "Yesterday", status: "Pending" },
  { name: "Sophie Berg", email: "s.berg@email.com", role: "buyer", joined: "2 days ago", status: "Active" },
];

const ROLE_META: Record<string, string> = {
  buyer: "bg-secondary/10 text-secondary border-secondary/30",
  seller: "bg-primary/10 text-primary border-primary/20",
  admin: "bg-red-50 text-red-500 border-red-200",
};

const today = new Date().toLocaleDateString("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

export default function AdminDashboardPage() {
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
            <span className="text-sm font-bold text-green-600 flex items-center gap-1 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +21.2%
            </span>
          </div>
          <div className="flex items-end gap-2 sm:gap-3" style={{ height: 120 }}>
            {MONTHLY_SIGNUPS.map((bar, i) => {
              const isLatest = i === MONTHLY_SIGNUPS.length - 1;
              const barH = Math.round((bar.value / MAX_SIGNUP) * 104);
              return (
                <div key={bar.month} className="flex-1 flex flex-col items-center gap-1.5">
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
            <span>Jun – Nov 2024</span>
            <span className="font-bold text-deep-navy">824 new users this month</span>
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
            {PENDING_PRODUCTS.map((p) => (
              <div key={p.id} className="py-2 border-b border-outline-variant last:border-0">
                <p className="text-sm font-semibold text-deep-navy truncate">{p.name}</p>
                <p className="text-[10px] text-on-surface-variant">{p.seller} · {p.category}</p>
              </div>
            ))}
          </div>
          <Link
            href="/admin/products"
            className="mt-4 flex items-center gap-1 text-xs font-bold text-primary hover:text-deep-navy transition-colors"
          >
            Review all <ChevronRight className="w-3 h-3" />
          </Link>
        </motion.div>
      </div>

      {/* Recent signups table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE, delay: 0.34 }}
        className="bg-white border-2 border-deep-navy rounded-xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-deep-navy">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-deep-navy" />
            <h2 className="font-bold text-deep-navy">Recent Signups</h2>
          </div>
          <Link
            href="/admin/accounts"
            className="text-xs font-bold text-primary hover:text-deep-navy transition-colors flex items-center gap-1"
          >
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                {["Name", "Email", "Role", "Status", "Joined"].map((h) => (
                  <th key={h} className="text-left text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-5 py-3 first:pl-6">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {RECENT_SIGNUPS.map((user) => (
                <tr key={user.email} className="hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-surface-container rounded-full flex items-center justify-center text-[10px] font-bold text-deep-navy shrink-0">
                        {user.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <span className="text-sm font-semibold text-deep-navy">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-on-surface-variant">{user.email}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${ROLE_META[user.role]}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      user.status === "Active"
                        ? "bg-primary/10 text-primary border-primary/20"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                      {user.status === "Active" && <CheckCircle2 className="w-2.5 h-2.5" />}
                      {user.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-on-surface-variant">{user.joined}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
