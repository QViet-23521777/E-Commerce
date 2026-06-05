"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  CreditCard,
  Plus,
  X,
  Check,
  Building2,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { fetchSellerOrders, type Order } from "@/lib/orders";
import { fetchWallet, withdrawWallet, type Wallet as WalletT } from "@/lib/wallet";
import { fetchSellerBank, saveSellerBank, type SellerBank } from "@/lib/support";
import {
  monthlyRevenue,
  revenueSummary,
  ordersToTransactions,
  shortDate,
} from "@/lib/analytics";
import { formatVND } from "@/lib/products";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

const TYPE_META: Record<string, { color: string; label: string }> = {
  payout: { color: "text-green-600", label: "Payout" },
  refund: { color: "text-red-600", label: "Refund" },
};

export default function FinancePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [wallet, setWallet] = useState<WalletT | null>(null);
  const [bank, setBank] = useState<SellerBank | null>(null);
  const [loading, setLoading] = useState(true);

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawDone, setWithdrawDone] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [bankName, setBankName] = useState("");
  const [accountNo, setAccountNo] = useState("");
  const [bankSaved, setBankSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [o, w, b] = await Promise.all([
          fetchSellerOrders(),
          fetchWallet().catch(() => null),
          fetchSellerBank().catch(() => null),
        ]);
        setOrders(o);
        setWallet(w);
        setBank(b);
        setBankName(b?.bankName ?? "");
        setAccountNo(b?.accountNo ?? "");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const revenue = useMemo(() => monthlyRevenue(orders), [orders]);
  const summary = useMemo(() => revenueSummary(orders), [orders]);
  const transactions = useMemo(() => ordersToTransactions(orders), [orders]);
  const maxRev = Math.max(1, ...revenue.map((r) => r.value));
  const balance = wallet?.balance ?? 0;

  async function handleWithdraw() {
    const amount = Math.floor(Number(withdrawAmount));
    if (!amount || amount <= 0) return;
    setBusy(true);
    setWithdrawError(null);
    try {
      const w = await withdrawWallet(amount);
      setWallet(w);
      setWithdrawDone(true);
      setTimeout(() => {
        setShowWithdrawModal(false);
        setWithdrawDone(false);
        setWithdrawAmount("");
      }, 1200);
    } catch (e) {
      const status = (e as { status?: number })?.status;
      setWithdrawError(status === 402 ? "Insufficient balance." : "Withdrawal failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveBank() {
    setBusy(true);
    try {
      const b = await saveSellerBank({ bankName, accountNo });
      setBank(b);
      setBankSaved(true);
      setTimeout(() => {
        setShowBankModal(false);
        setBankSaved(false);
      }, 900);
    } finally {
      setBusy(false);
    }
  }

  const cards = [
    { label: "Total Revenue", value: formatVND(summary.totalRevenue), sub: "All paid orders", icon: TrendingUp, accent: "bg-primary/10 text-primary" },
    {
      label: "This Month",
      value: formatVND(summary.thisMonth),
      sub: summary.momChangePct === null ? "—" : `${summary.momChangePct >= 0 ? "+" : ""}${summary.momChangePct}% vs last mo`,
      icon: ArrowUpRight,
      accent: "bg-green-50 text-green-700",
    },
    { label: "Pending Clearance", value: formatVND(summary.pendingClearance), sub: "Not yet delivered", icon: Clock, accent: "bg-amber-50 text-amber-700" },
    { label: "Wallet Balance", value: formatVND(balance), sub: "Available to withdraw", icon: Wallet, accent: "bg-surface-container text-on-surface-variant" },
  ];

  return (
    <>
      <div className="p-6 lg:p-8 max-w-[1100px] mx-auto w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-px w-5 bg-primary-container" />
            <p className="text-label-caps text-primary">Analytics</p>
          </div>
          <h1 className="text-2xl font-bold text-deep-navy tracking-tight">
            Finance & Analytics
          </h1>
        </div>

        {/* Revenue summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: EASE, delay: i * 0.06 }}
                className="bg-white border-2 border-deep-navy rounded-xl p-5"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${card.accent}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-xl font-bold text-deep-navy tracking-tight mb-0.5">
                  {loading ? "…" : card.value}
                </p>
                <p className="text-xs font-semibold text-on-surface-variant">{card.label}</p>
                <p className="text-[10px] text-outline mt-0.5">{card.sub}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-5 mb-5">
          {/* Revenue chart */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE, delay: 0.2 }}
            className="lg:col-span-2 bg-white border-2 border-deep-navy rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-label-caps text-primary mb-0.5">Revenue Trend</p>
                <h2 className="font-bold text-deep-navy">6-Month Overview</h2>
              </div>
            </div>

            <div className="flex items-end gap-3 mb-3" style={{ height: 140 }}>
              {revenue.map((bar, i) => {
                const isLatest = i === revenue.length - 1;
                const barH = Math.max(4, Math.round((bar.value / maxRev) * 116));
                return (
                  <div key={`${bar.month}-${i}`} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className="w-full flex flex-col justify-end" style={{ height: 116 }}>
                      <div className="relative group">
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {formatVND(bar.value)}
                        </div>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: barH }}
                          transition={{ duration: 0.65, ease: EASE, delay: 0.25 + i * 0.07 }}
                          className={`w-full rounded-t-lg ${
                            isLatest
                              ? "bg-primary-container border-2 border-deep-navy"
                              : "bg-surface-container-high hover:bg-surface-container-highest"
                          } transition-colors cursor-default`}
                        />
                      </div>
                    </div>
                    <span className={`text-[10px] font-medium ${isLatest ? "text-deep-navy font-bold" : "text-on-surface-variant"}`}>
                      {bar.month}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-outline-variant grid grid-cols-3 gap-4 text-center">
              {[
                { label: "Paid orders", value: String(summary.orderCount) },
                { label: "This month", value: formatVND(summary.thisMonth) },
                { label: "Last month", value: formatVND(summary.lastMonth) },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-sm font-bold text-deep-navy">{s.value}</p>
                  <p className="text-[10px] text-on-surface-variant">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Wallet */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE, delay: 0.25 }}
            className="bg-white border-2 border-deep-navy rounded-xl p-6 flex flex-col"
          >
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 bg-primary-container/20 border border-primary-container/40 rounded-lg flex items-center justify-center">
                <Wallet className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-deep-navy text-sm">Seller Wallet</h2>
                <p className="text-[10px] text-on-surface-variant">ShopIn balance</p>
              </div>
            </div>

            <div className="bg-deep-navy rounded-xl p-4 mb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">
                Available Balance
              </p>
              <p className="text-2xl font-bold text-white tracking-tight">{formatVND(balance)}</p>
              <p className="text-xs text-primary-container mt-1">Ready to withdraw</p>
            </div>

            <div className="space-y-2.5 mb-5">
              <div className="flex justify-between text-xs">
                <span className="text-on-surface-variant">Pending clearance</span>
                <span className="font-bold text-amber-600">{formatVND(summary.pendingClearance)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-on-surface-variant">Total revenue</span>
                <span className="font-bold text-deep-navy">{formatVND(summary.totalRevenue)}</span>
              </div>
            </div>

            <button
              onClick={() => { setWithdrawError(null); setShowWithdrawModal(true); }}
              disabled={balance <= 0}
              className="mt-auto w-full h-11 bg-primary-container text-deep-navy text-sm font-bold rounded-xl border-2 border-transparent hover:border-deep-navy active:scale-[0.97] transition-all disabled:opacity-50"
            >
              Withdraw Funds
            </button>
          </motion.div>
        </div>

        {/* Bank account */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE, delay: 0.3 }}
          className="bg-white border-2 border-deep-navy rounded-xl p-6 mb-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-surface-container border border-outline-variant rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 text-deep-navy" />
              </div>
              <div>
                <h2 className="font-bold text-deep-navy text-sm">Bank Account</h2>
                <p className="text-[10px] text-on-surface-variant">Payout destination</p>
              </div>
            </div>
            <button
              onClick={() => setShowBankModal(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-deep-navy border border-outline-variant hover:border-deep-navy px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus className="w-3 h-3" />
              Edit
            </button>
          </div>

          {bankName || accountNo ? (
            <div className="flex items-center gap-4 p-4 bg-surface-container-low border border-outline-variant rounded-xl">
              <div className="w-10 h-10 bg-deep-navy rounded-xl flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5 text-primary-container" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-deep-navy text-sm">{bankName || "—"}</p>
                <p className="text-xs text-on-surface-variant font-mono">
                  ···· ···· {accountNo.slice(-4)}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                <ShieldCheck className="w-3.5 h-3.5" />
                Saved
              </div>
            </div>
          ) : (
            <div className="p-4 bg-surface-container-low border border-dashed border-outline-variant rounded-xl text-sm text-on-surface-variant text-center">
              No bank account on file — click Edit to add one.
            </div>
          )}
        </motion.div>

        {/* Transaction history */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE, delay: 0.35 }}
          className="bg-white border-2 border-deep-navy rounded-xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b-2 border-deep-navy">
            <h2 className="font-bold text-deep-navy">Transaction History</h2>
          </div>

          <div className="divide-y divide-outline-variant">
            {loading ? (
              <div className="px-6 py-10 text-center text-sm text-on-surface-variant">Loading…</div>
            ) : transactions.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-on-surface-variant">No transactions yet.</div>
            ) : (
              transactions.map((tx) => {
                const positive = tx.amount > 0;
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between px-6 py-3.5 hover:bg-surface-container-low transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          tx.type === "payout"
                            ? "bg-green-50 border border-green-200"
                            : "bg-red-50 border border-red-200"
                        }`}
                      >
                        {positive ? (
                          <ArrowUpRight className="w-3.5 h-3.5 text-green-600" />
                        ) : (
                          <ArrowDownLeft className="w-3.5 h-3.5 text-red-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-on-surface">{tx.label}</p>
                        <p className="text-[10px] text-on-surface-variant">{shortDate(tx.date)}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold ${positive ? "text-green-600" : "text-red-600"}`}>
                        {positive ? "+" : "−"}{formatVND(Math.abs(tx.amount))}
                      </p>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider ${
                          tx.status === "completed" ? "text-primary" : "text-amber-600"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>

      {/* Withdraw modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setShowWithdrawModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-deep-navy rounded-2xl w-[360px] overflow-hidden"
            >
              <div className="h-1 bg-primary-container" />
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-label-caps text-primary mb-0.5">Wallet</p>
                    <h3 className="font-bold text-deep-navy">Withdraw Funds</h3>
                  </div>
                  <button
                    onClick={() => setShowWithdrawModal(false)}
                    className="p-1.5 rounded-lg text-on-surface-variant hover:text-deep-navy hover:bg-surface-container transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 bg-surface-container-low border border-outline-variant rounded-xl mb-4 text-xs text-on-surface-variant">
                  Available: <span className="font-bold text-deep-navy">{formatVND(balance)}</span>
                </div>

                <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant mb-2">
                  Amount (VND)
                </label>
                <input
                  type="number"
                  min={1}
                  max={balance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0"
                  className="block w-full h-12 px-4 border-2 border-deep-navy/20 rounded-xl bg-white text-sm text-on-surface focus:border-primary-container outline-none transition-colors mb-2"
                />
                {withdrawError ? (
                  <p className="text-[11px] text-red-600 font-semibold mb-5">{withdrawError}</p>
                ) : (
                  <p className="text-[10px] text-on-surface-variant mb-5">
                    Debited from your wallet immediately{bankName ? ` · payout to ${bankName} ···· ${accountNo.slice(-4)}` : ""}.
                  </p>
                )}

                <motion.button
                  onClick={handleWithdraw}
                  disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0 || busy}
                  animate={
                    withdrawDone
                      ? { backgroundColor: "#001a41" }
                      : { backgroundColor: "#00f3ff" }
                  }
                  transition={{ duration: 0.25 }}
                  className="w-full h-11 text-deep-navy text-sm font-bold rounded-xl border-2 border-transparent hover:border-deep-navy active:scale-[0.97] transition-all disabled:opacity-50"
                >
                  <AnimatePresence mode="wait">
                    {withdrawDone ? (
                      <motion.span
                        key="done"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-center gap-2 text-primary-container"
                      >
                        <Check className="w-4 h-4" /> Withdrawal Complete
                      </motion.span>
                    ) : (
                      <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        {busy ? "Processing…" : "Confirm Withdrawal"}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bank account modal */}
      <AnimatePresence>
        {showBankModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setShowBankModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-deep-navy rounded-2xl w-[380px] overflow-hidden"
            >
              <div className="h-1 bg-primary-container" />
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-deep-navy">Bank Account</h3>
                  <button
                    onClick={() => setShowBankModal(false)}
                    className="p-1.5 rounded-lg text-on-surface-variant hover:text-deep-navy hover:bg-surface-container transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant mb-2">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. DNB Bank"
                      className="block w-full h-11 px-4 border-2 border-deep-navy/20 rounded-xl bg-white text-sm text-on-surface focus:border-primary-container outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant mb-2">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={accountNo}
                      onChange={(e) => setAccountNo(e.target.value)}
                      placeholder="e.g. 1234 56 78901"
                      className="block w-full h-11 px-4 border-2 border-deep-navy/20 rounded-xl bg-white text-sm text-on-surface focus:border-primary-container outline-none transition-colors font-mono"
                    />
                  </div>
                </div>

                <motion.button
                  onClick={handleSaveBank}
                  disabled={busy}
                  animate={bankSaved ? { backgroundColor: "#001a41" } : { backgroundColor: "#00f3ff" }}
                  transition={{ duration: 0.25 }}
                  className="w-full h-11 mt-5 text-deep-navy text-sm font-bold rounded-xl border-2 border-transparent hover:border-deep-navy active:scale-[0.97] transition-all disabled:opacity-50"
                >
                  <AnimatePresence mode="wait">
                    {bankSaved ? (
                      <motion.span
                        key="saved"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-center gap-2 text-primary-container"
                      >
                        <Check className="w-4 h-4" /> Saved
                      </motion.span>
                    ) : (
                      <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        Save Account
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
