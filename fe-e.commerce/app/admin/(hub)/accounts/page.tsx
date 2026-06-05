"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  X,
  ShieldCheck,
  CheckCircle2,
  Ban,
  Eye,
  Mail,
  Calendar,
  BadgeCheck,
  KeyRound,
  UserCog,
  Loader2,
  Wallet,
  Plus,
} from "lucide-react";
import {
  fetchAccounts,
  setAccountActive,
  type Account,
  type AccountRole,
} from "@/lib/accounts";
import { adminCreditWallet } from "@/lib/wallet";
import { formatVND } from "@/lib/products";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

const ROLE_META: Record<AccountRole, string> = {
  user: "bg-secondary/10 text-secondary border-secondary/30",
  seller: "bg-primary/10 text-primary border-primary/20",
  admin: "bg-red-50 text-red-500 border-red-200",
  superadmin: "bg-red-50 text-red-500 border-red-200",
};

const ROLE_LABEL: Record<AccountRole, string> = {
  user: "buyer",
  seller: "seller",
  admin: "admin",
  superadmin: "superadmin",
};

type FilterTab = "All" | "Buyers" | "Sellers" | "Admins";
const TABS: FilterTab[] = ["All", "Buyers", "Sellers", "Admins"];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatJoined(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const isAdminRole = (r: AccountRole) => r === "admin" || r === "superadmin";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Account | null>(null);
  const [acting, setActing] = useState(false);

  // ── Wallet top-up (for the selected account) ──
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [topUpError, setTopUpError] = useState("");
  const [topUpSuccess, setTopUpSuccess] = useState("");

  // Reset the top-up form whenever a different account is opened.
  useEffect(() => {
    setTopUpAmount("");
    setTopUpError("");
    setTopUpSuccess("");
  }, [selected?.id]);

  async function handleTopUp() {
    if (!selected) return;
    setTopUpError("");
    setTopUpSuccess("");
    const amount = Math.floor(Number(topUpAmount));
    if (!Number.isFinite(amount) || amount <= 0) {
      setTopUpError("Enter a positive amount.");
      return;
    }
    setTopUpLoading(true);
    try {
      const updated = await adminCreditWallet(selected.id, amount);
      setTopUpSuccess(`Added ${formatVND(amount)}. New balance: ${formatVND(updated.balance)}.`);
      setTopUpAmount("");
    } catch (err: unknown) {
      setTopUpError((err as { message?: string })?.message ?? "Top-up failed.");
    } finally {
      setTopUpLoading(false);
    }
  }

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      setAccounts(await fetchAccounts());
    } catch (err: unknown) {
      setLoadError(
        (err as { message?: string })?.message ?? "Couldn't load accounts.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = accounts.filter((a) => {
    if (activeTab === "Buyers" && a.role !== "user") return false;
    if (activeTab === "Sellers" && a.role !== "seller") return false;
    if (activeTab === "Admins" && !isAdminRole(a.role)) return false;
    const q = query.trim().toLowerCase();
    if (q && !a.name.toLowerCase().includes(q) && !a.email.toLowerCase().includes(q))
      return false;
    return true;
  });

  async function toggleSuspend(account: Account) {
    setActing(true);
    try {
      const nextActive = !account.isActive;
      await setAccountActive(account.id, nextActive);
      setAccounts((prev) =>
        prev.map((a) => (a.id === account.id ? { ...a, isActive: nextActive } : a)),
      );
      setSelected((prev) =>
        prev && prev.id === account.id ? { ...prev, isActive: nextActive } : prev,
      );
    } catch (err: unknown) {
      setLoadError(
        (err as { message?: string })?.message ?? "Couldn't update the account.",
      );
    } finally {
      setActing(false);
    }
  }

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
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search accounts…"
            className="h-9 pl-9 pr-4 border-2 border-outline-variant rounded-xl text-sm bg-white focus:border-primary-container outline-none transition-colors w-56"
          />
        </div>
      </div>

      {loadError && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border-2 border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
          <span>{loadError}</span>
          <button onClick={load} className="font-bold underline hover:no-underline">Retry</button>
        </div>
      )}

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
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-on-surface-variant">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Loading accounts…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-sm text-on-surface-variant">
                    No accounts match this view.
                  </td>
                </tr>
              ) : (
                filtered.map((account) => {
                  const isSuspended = !account.isActive;
                  return (
                    <tr key={account.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-surface-container rounded-full flex items-center justify-center text-[10px] font-bold text-deep-navy shrink-0">
                            {initials(account.name)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-deep-navy capitalize">{account.name}</p>
                            <p className="text-[10px] text-on-surface-variant font-mono">{account.id.slice(-8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-on-surface-variant">{account.email}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${ROLE_META[account.role]}`}>
                          {ROLE_LABEL[account.role]}
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
                      <td className="px-5 py-3.5 text-sm text-on-surface-variant">{formatJoined(account.createdAt)}</td>
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
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && (
        <p className="mt-3 text-xs text-on-surface-variant">
          Showing {filtered.length} of {accounts.length} account{accounts.length === 1 ? "" : "s"}.
        </p>
      )}

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
                    {initials(selected.name)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-deep-navy capitalize">{selected.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${ROLE_META[selected.role]}`}>
                        {ROLE_LABEL[selected.role]}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        !selected.isActive
                          ? "bg-red-50 text-red-500 border-red-200"
                          : "bg-primary/10 text-primary border-primary/20"
                      }`}>
                        {selected.isActive ? "Active" : "Suspended"}
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
                    Joined {formatJoined(selected.createdAt)}
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-on-surface font-mono text-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-outline shrink-0" />
                    {selected.id}
                  </div>
                </div>

                {/* Account flags (real data) */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white border-2 border-deep-navy rounded-xl p-3 text-center">
                    <BadgeCheck className="w-4 h-4 text-deep-navy mx-auto mb-1.5" />
                    <p className="text-sm font-bold text-deep-navy">{selected.isVerified ? "Yes" : "No"}</p>
                    <p className="text-[10px] text-on-surface-variant">Verified</p>
                  </div>
                  <div className="bg-white border-2 border-deep-navy rounded-xl p-3 text-center">
                    <KeyRound className="w-4 h-4 text-deep-navy mx-auto mb-1.5" />
                    <p className="text-sm font-bold text-deep-navy">{selected.twoFactorEnabled ? "On" : "Off"}</p>
                    <p className="text-[10px] text-on-surface-variant">2FA</p>
                  </div>
                  <div className="bg-white border-2 border-deep-navy rounded-xl p-3 text-center">
                    <UserCog className="w-4 h-4 text-deep-navy mx-auto mb-1.5" />
                    <p className="text-sm font-bold text-deep-navy capitalize">{ROLE_LABEL[selected.role]}</p>
                    <p className="text-[10px] text-on-surface-variant">Role</p>
                  </div>
                </div>

                {/* Actions */}
                {!isAdminRole(selected.role) && (
                  <div className="pt-2 space-y-2">
                    <p className="text-label-caps text-on-surface-variant mb-3">Actions</p>
                    <button
                      onClick={() => toggleSuspend(selected)}
                      disabled={acting}
                      className={`w-full flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-bold border-2 transition-all duration-150 disabled:opacity-60 ${
                        !selected.isActive
                          ? "bg-primary-container text-deep-navy border-primary-container hover:border-deep-navy"
                          : "bg-white text-red-500 border-red-200 hover:bg-red-50 hover:border-red-400"
                      }`}
                    >
                      {acting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : !selected.isActive ? (
                        <><CheckCircle2 className="w-4 h-4" /> Activate Account</>
                      ) : (
                        <><Ban className="w-4 h-4" /> Suspend Account</>
                      )}
                    </button>
                  </div>
                )}

                {/* Wallet top-up — admins credit a user's wallet (buyers can no
                    longer self top-up). Available for non-admin accounts. */}
                {!isAdminRole(selected.role) && (
                  <div className="pt-4 border-t-2 border-surface-container space-y-3">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-3.5 h-3.5 text-deep-navy" />
                      <p className="text-label-caps text-on-surface-variant">Wallet Top-Up</p>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={1}
                        value={topUpAmount}
                        onChange={(e) => { setTopUpAmount(e.target.value); setTopUpError(""); setTopUpSuccess(""); }}
                        placeholder="Amount (₫)"
                        className="flex-1 h-10 px-3 border-2 border-outline-variant rounded-xl text-sm bg-white focus:border-primary-container outline-none transition-colors"
                      />
                      <button
                        onClick={handleTopUp}
                        disabled={topUpLoading}
                        className="flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl text-sm font-bold border-2 border-deep-navy bg-deep-navy text-white hover:bg-deep-navy/90 transition-all duration-150 disabled:opacity-60 shrink-0"
                      >
                        {topUpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Add</>}
                      </button>
                    </div>
                    {topUpError && <p className="text-xs font-medium text-red-500">{topUpError}</p>}
                    {topUpSuccess && <p className="text-xs font-medium text-primary">{topUpSuccess}</p>}
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
