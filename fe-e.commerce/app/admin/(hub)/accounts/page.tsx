"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  X,
  ShieldCheck,
  CheckCircle2,
  Ban,
  Eye,
  ChevronRight,
  Mail,
  Calendar,
  ShoppingBag,
  Package,
  Star,
} from "lucide-react";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

type Role = "buyer" | "seller" | "admin";
type Status = "Active" | "Suspended";

interface Account {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: Status;
  joined: string;
  orders: number;
  rating: number;
  totalSpent: string;
  avatar: string;
}

const ACCOUNTS: Account[] = [
  { id: "USR-001", name: "Emma Strand", email: "emma.s@email.com", role: "buyer", status: "Active", joined: "Mar 12, 2024", orders: 24, rating: 0, totalSpent: "$1,240", avatar: "ES" },
  { id: "USR-002", name: "Nordic Living Co.", email: "nordic@seller.com", role: "seller", status: "Active", joined: "Jan 5, 2024", orders: 0, rating: 4.9, totalSpent: "$0", avatar: "NL" },
  { id: "USR-003", name: "Liam Thorsen", email: "l.thorsen@email.com", role: "buyer", status: "Active", joined: "Apr 22, 2024", orders: 8, rating: 0, totalSpent: "$389", avatar: "LT" },
  { id: "USR-004", name: "GlowUp Beauty", email: "glowup@seller.com", role: "seller", status: "Active", joined: "Feb 14, 2024", orders: 0, rating: 4.7, totalSpent: "$0", avatar: "GB" },
  { id: "USR-005", name: "Priya Nair", email: "priya.n@email.com", role: "buyer", status: "Active", joined: "May 3, 2024", orders: 3, rating: 0, totalSpent: "$156", avatar: "PN" },
  { id: "USR-006", name: "TechVault Store", email: "techvault@seller.com", role: "seller", status: "Suspended", joined: "Nov 28, 2023", orders: 0, rating: 3.2, totalSpent: "$0", avatar: "TV" },
  { id: "USR-007", name: "Carlos Mendez", email: "carlos.m@email.com", role: "buyer", status: "Active", joined: "Jun 17, 2024", orders: 12, rating: 0, totalSpent: "$720", avatar: "CM" },
  { id: "USR-008", name: "Sophie Berg", email: "s.berg@email.com", role: "buyer", status: "Active", joined: "Jul 9, 2024", orders: 5, rating: 0, totalSpent: "$294", avatar: "SB" },
  { id: "USR-009", name: "ZenGear Co.", email: "zen@seller.com", role: "seller", status: "Active", joined: "Mar 1, 2024", orders: 0, rating: 4.8, totalSpent: "$0", avatar: "ZG" },
  { id: "USR-010", name: "Admin User", email: "admin@shopin.com", role: "admin", status: "Active", joined: "Jan 1, 2024", orders: 0, rating: 0, totalSpent: "$0", avatar: "AU" },
  { id: "USR-011", name: "Ava Peterson", email: "ava.p@email.com", role: "buyer", status: "Active", joined: "Aug 14, 2024", orders: 7, rating: 0, totalSpent: "$512", avatar: "AP" },
  { id: "USR-012", name: "Hearth & Home", email: "hearth@seller.com", role: "seller", status: "Active", joined: "Dec 10, 2023", orders: 0, rating: 4.6, totalSpent: "$0", avatar: "HH" },
  { id: "USR-013", name: "Noah Kim", email: "noah.k@email.com", role: "buyer", status: "Suspended", joined: "Feb 20, 2024", orders: 2, rating: 0, totalSpent: "$89", avatar: "NK" },
  { id: "USR-014", name: "BrightMinds Shop", email: "bright@seller.com", role: "seller", status: "Active", joined: "Sep 5, 2024", orders: 0, rating: 4.5, totalSpent: "$0", avatar: "BM" },
  { id: "USR-015", name: "Amara Osei", email: "amara.o@email.com", role: "buyer", status: "Active", joined: "Oct 1, 2024", orders: 1, rating: 0, totalSpent: "$45", avatar: "AO" },
];

const ROLE_META: Record<Role, string> = {
  buyer: "bg-secondary/10 text-secondary border-secondary/30",
  seller: "bg-primary/10 text-primary border-primary/20",
  admin: "bg-red-50 text-red-500 border-red-200",
};

type FilterTab = "All" | "Buyers" | "Sellers" | "Admins";
const TABS: FilterTab[] = ["All", "Buyers", "Sellers", "Admins"];

export default function AccountsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("All");
  const [selected, setSelected] = useState<Account | null>(null);
  const [suspended, setSuspended] = useState<Set<string>>(new Set(["USR-006", "USR-013"]));

  const filtered = ACCOUNTS.filter((a) => {
    if (activeTab === "Buyers") return a.role === "buyer";
    if (activeTab === "Sellers") return a.role === "seller";
    if (activeTab === "Admins") return a.role === "admin";
    return true;
  });

  function toggleSuspend(id: string) {
    setSuspended((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const selectedStatus = selected ? (suspended.has(selected.id) ? "Suspended" : "Active") : null;

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-px w-5 bg-red-400" />
          <p className="text-label-caps text-red-500">Users</p>
        </div>
        <h1 className="text-2xl font-bold text-deep-navy tracking-tight">Account Management</h1>
        <p className="text-sm text-on-surface-variant mt-0.5">Manage platform users — buyers, sellers, and admins.</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border-2 transition-all duration-150 ${
                activeTab === tab
                  ? "bg-deep-navy text-white border-deep-navy"
                  : "bg-white text-on-surface-variant border-outline-variant hover:border-deep-navy"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-outline" />
          <input
            type="text"
            placeholder="Search accounts…"
            className="h-9 pl-9 pr-4 border-2 border-outline-variant rounded-xl text-sm bg-white focus:border-primary-container outline-none transition-colors w-56"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border-2 border-deep-navy rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-container-low border-b-2 border-deep-navy">
                {["Account", "Email", "Role", "Status", "Joined", ""].map((h) => (
                  <th key={h} className="text-left text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-5 py-3 first:pl-6">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filtered.map((account) => {
                const isSuspended = suspended.has(account.id);
                return (
                  <tr key={account.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-surface-container rounded-full flex items-center justify-center text-[10px] font-bold text-deep-navy shrink-0">
                          {account.avatar}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-deep-navy">{account.name}</p>
                          <p className="text-[10px] text-on-surface-variant font-mono">{account.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-on-surface-variant">{account.email}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${ROLE_META[account.role]}`}>
                        {account.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isSuspended
                          ? "bg-red-50 text-red-500 border-red-200"
                          : "bg-primary/10 text-primary border-primary/20"
                      }`}>
                        {isSuspended ? <Ban className="w-2.5 h-2.5" /> : <CheckCircle2 className="w-2.5 h-2.5" />}
                        {isSuspended ? "Suspended" : "Active"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-on-surface-variant">{account.joined}</td>
                    <td className="pr-5 py-3.5">
                      <button
                        onClick={() => setSelected(account)}
                        className="flex items-center gap-1 text-xs font-bold text-primary hover:text-deep-navy transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
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
              className="fixed right-0 top-0 h-full w-[400px] bg-white border-l-2 border-deep-navy z-50 flex flex-col overflow-y-auto"
            >
              {/* Panel header */}
              <div className="flex items-center justify-between px-6 py-4 border-b-2 border-deep-navy shrink-0">
                <h2 className="font-bold text-deep-navy">Account Details</h2>
                <button
                  onClick={() => setSelected(null)}
                  className="p-1.5 hover:bg-surface-container rounded-lg text-on-surface-variant hover:text-deep-navy transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 flex-1 space-y-6">
                {/* Identity */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-surface-container rounded-2xl flex items-center justify-center text-lg font-bold text-deep-navy">
                    {selected.avatar}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-deep-navy">{selected.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${ROLE_META[selected.role]}`}>
                        {selected.role}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        selectedStatus === "Suspended"
                          ? "bg-red-50 text-red-500 border-red-200"
                          : "bg-primary/10 text-primary border-primary/20"
                      }`}>
                        {selectedStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div className="bg-surface-container-low rounded-xl p-4 space-y-2.5">
                  <p className="text-label-caps text-on-surface-variant mb-3">Contact Info</p>
                  <div className="flex items-center gap-2.5 text-sm text-on-surface">
                    <Mail className="w-3.5 h-3.5 text-outline shrink-0" />
                    {selected.email}
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-on-surface">
                    <Calendar className="w-3.5 h-3.5 text-outline shrink-0" />
                    Joined {selected.joined}
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-on-surface font-mono text-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-outline shrink-0" />
                    {selected.id}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white border-2 border-deep-navy rounded-xl p-3 text-center">
                    <ShoppingBag className="w-4 h-4 text-deep-navy mx-auto mb-1.5" />
                    <p className="text-lg font-bold text-deep-navy">{selected.orders}</p>
                    <p className="text-[10px] text-on-surface-variant">Orders</p>
                  </div>
                  <div className="bg-white border-2 border-deep-navy rounded-xl p-3 text-center">
                    <Package className="w-4 h-4 text-deep-navy mx-auto mb-1.5" />
                    <p className="text-lg font-bold text-deep-navy">{selected.totalSpent}</p>
                    <p className="text-[10px] text-on-surface-variant">Spent</p>
                  </div>
                  <div className="bg-white border-2 border-deep-navy rounded-xl p-3 text-center">
                    <Star className="w-4 h-4 text-deep-navy mx-auto mb-1.5" />
                    <p className="text-lg font-bold text-deep-navy">{selected.rating || "—"}</p>
                    <p className="text-[10px] text-on-surface-variant">Rating</p>
                  </div>
                </div>

                {/* Actions */}
                {selected.role !== "admin" && (
                  <div className="pt-2 space-y-2">
                    <p className="text-label-caps text-on-surface-variant mb-3">Actions</p>
                    <button
                      onClick={() => toggleSuspend(selected.id)}
                      className={`w-full flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-bold border-2 transition-all duration-150 ${
                        suspended.has(selected.id)
                          ? "bg-primary-container text-deep-navy border-primary-container hover:border-deep-navy"
                          : "bg-white text-red-500 border-red-200 hover:bg-red-50 hover:border-red-400"
                      }`}
                    >
                      {suspended.has(selected.id) ? (
                        <><CheckCircle2 className="w-4 h-4" /> Activate Account</>
                      ) : (
                        <><Ban className="w-4 h-4" /> Suspend Account</>
                      )}
                    </button>
                    <Link href="/admin/accounts">
                      <button className="w-full flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-bold bg-white text-deep-navy border-2 border-deep-navy hover:bg-surface-container-low transition-colors">
                        View Full Profile <ChevronRight className="w-4 h-4" />
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
