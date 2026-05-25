"use client";

import { useState } from "react";
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
  Download,
  Building2,
  Clock,
  ShieldCheck,
} from "lucide-react";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

const MONTHLY_REVENUE = [
  { month: "Jun", value: 6800 },
  { month: "Jul", value: 8200 },
  { month: "Aug", value: 7400 },
  { month: "Sep", value: 9100 },
  { month: "Oct", value: 11200 },
  { month: "Nov", value: 12480 },
];
const MAX_REV = Math.max(...MONTHLY_REVENUE.map((r) => r.value));

interface Transaction {
  id: string;
  type: "payout" | "withdrawal" | "fee" | "refund";
  label: string;
  amount: number;
  date: string;
  status: "completed" | "pending" | "failed";
}

const TRANSACTIONS: Transaction[] = [
  { id: "t1", type: "payout", label: "Order payout · #ORD-5816", amount: 157.5, date: "Nov 12, 2024", status: "completed" },
  { id: "t2", type: "payout", label: "Order payout · #ORD-5815", amount: 468, date: "Nov 11, 2024", status: "completed" },
  { id: "t3", type: "withdrawal", label: "Withdrawal to bank ···· 4291", amount: -500, date: "Nov 10, 2024", status: "completed" },
  { id: "t4", type: "refund", label: "Refund issued · #ORD-5814", amount: -264, date: "Nov 10, 2024", status: "completed" },
  { id: "t5", type: "fee", label: "Platform fee · Nov 2024", amount: -29, date: "Nov 1, 2024", status: "completed" },
  { id: "t6", type: "payout", label: "Order payout · #ORD-5813", amount: 212, date: "Oct 30, 2024", status: "completed" },
  { id: "t7", type: "payout", label: "Order payout · #ORD-5812", amount: 392, date: "Oct 28, 2024", status: "pending" },
  { id: "t8", type: "withdrawal", label: "Withdrawal to bank ···· 4291", amount: -400, date: "Oct 20, 2024", status: "completed" },
];

const TYPE_META: Record<Transaction["type"], { color: string; label: string }> = {
  payout: { color: "text-green-600", label: "Payout" },
  withdrawal: { color: "text-deep-navy", label: "Withdrawal" },
  fee: { color: "text-on-surface-variant", label: "Fee" },
  refund: { color: "text-red-600", label: "Refund" },
};

export default function FinancePage() {
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawDone, setWithdrawDone] = useState(false);
  const [bankName, setBankName] = useState("DNB Bank");
  const [accountNo, setAccountNo] = useState("1234 56 78901");
  const [bankSaved, setBankSaved] = useState(false);

  function handleWithdraw() {
    setWithdrawDone(true);
    setTimeout(() => {
      setShowWithdrawModal(false);
      setWithdrawDone(false);
      setWithdrawAmount("");
    }, 1200);
  }

  function handleSaveBank() {
    setBankSaved(true);
    setTimeout(() => {
      setShowBankModal(false);
      setBankSaved(false);
    }, 900);
  }

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
          {[
            { label: "Total Revenue", value: "$55,840", sub: "All time", icon: TrendingUp, accent: "bg-primary/10 text-primary" },
            { label: "This Month", value: "$12,480", sub: "+18.2% vs Oct", icon: ArrowUpRight, accent: "bg-green-50 text-green-700" },
            { label: "Pending Clearance", value: "$892", sub: "Est. 3–5 days", icon: Clock, accent: "bg-amber-50 text-amber-700" },
            { label: "Total Withdrawn", value: "$8,350", sub: "To bank account", icon: ArrowDownLeft, accent: "bg-surface-container text-on-surface-variant" },
          ].map((card, i) => {
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
                <p className="text-2xl font-bold text-deep-navy tracking-tight mb-0.5">
                  {card.value}
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
              <button className="flex items-center gap-1.5 text-xs font-bold text-on-surface-variant border border-outline-variant hover:border-deep-navy px-3 py-1.5 rounded-lg transition-colors">
                <Download className="w-3 h-3" />
                Export
              </button>
            </div>

            <div className="flex items-end gap-3 mb-3" style={{ height: 140 }}>
              {MONTHLY_REVENUE.map((bar, i) => {
                const isLatest = i === MONTHLY_REVENUE.length - 1;
                const barH = Math.max(4, Math.round((bar.value / MAX_REV) * 116));
                return (
                  <div key={bar.month} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className="w-full flex flex-col justify-end" style={{ height: 116 }}>
                      <div className="relative group">
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          ${(bar.value / 1000).toFixed(1)}k
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
                { label: "Avg / month", value: "$9,297" },
                { label: "Best month", value: "Nov · $12,480" },
                { label: "YoY growth", value: "+24%" },
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
              <p className="text-3xl font-bold text-white tracking-tight">$3,240</p>
              <p className="text-xs text-primary-container mt-1">Ready to withdraw</p>
            </div>

            <div className="space-y-2.5 mb-5">
              <div className="flex justify-between text-xs">
                <span className="text-on-surface-variant">Pending clearance</span>
                <span className="font-bold text-amber-600">$892</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-on-surface-variant">Total withdrawn</span>
                <span className="font-bold text-deep-navy">$8,350</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-on-surface-variant">Platform fees (Nov)</span>
                <span className="font-bold text-on-surface">$29</span>
              </div>
            </div>

            <button
              onClick={() => setShowWithdrawModal(true)}
              className="mt-auto w-full h-11 bg-primary-container text-deep-navy text-sm font-bold rounded-xl border-2 border-transparent hover:border-deep-navy active:scale-[0.97] transition-all"
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

          <div className="flex items-center gap-4 p-4 bg-surface-container-low border border-outline-variant rounded-xl">
            <div className="w-10 h-10 bg-deep-navy rounded-xl flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5 text-primary-container" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-deep-navy text-sm">{bankName}</p>
              <p className="text-xs text-on-surface-variant font-mono">
                ···· ···· {accountNo.slice(-4)}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified
            </div>
          </div>
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
            <button className="flex items-center gap-1.5 text-xs font-bold text-on-surface-variant border border-outline-variant hover:border-deep-navy px-3 py-1.5 rounded-lg transition-colors">
              <Download className="w-3 h-3" />
              Download CSV
            </button>
          </div>

          <div className="divide-y divide-outline-variant">
            {TRANSACTIONS.map((tx) => {
              const meta = TYPE_META[tx.type];
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
                          : tx.type === "refund"
                          ? "bg-red-50 border border-red-200"
                          : tx.type === "fee"
                          ? "bg-surface-container border border-outline-variant"
                          : "bg-surface-container-high border border-outline-variant"
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
                      <p className="text-[10px] text-on-surface-variant">{tx.date}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`text-sm font-bold ${
                        positive ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {positive ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}
                    </p>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider ${
                        tx.status === "completed"
                          ? "text-primary"
                          : tx.status === "pending"
                          ? "text-amber-600"
                          : "text-red-600"
                      }`}
                    >
                      {tx.status}
                    </span>
                  </div>
                </div>
              );
            })}
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
                  Available: <span className="font-bold text-deep-navy">$3,240.00</span>
                </div>

                <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant mb-2">
                  Amount ($)
                </label>
                <input
                  type="number"
                  min={1}
                  max={3240}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  className="block w-full h-12 px-4 border-2 border-deep-navy/20 rounded-xl bg-white text-sm text-on-surface focus:border-primary-container outline-none transition-colors mb-2"
                />
                <p className="text-[10px] text-on-surface-variant mb-5">
                  Funds transferred to {bankName} ···· {accountNo.slice(-4)} within 1–3 business days.
                </p>

                <motion.button
                  onClick={handleWithdraw}
                  disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0}
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
                        <Check className="w-4 h-4" /> Withdrawal Initiated
                      </motion.span>
                    ) : (
                      <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        Confirm Withdrawal
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
                      className="block w-full h-11 px-4 border-2 border-deep-navy/20 rounded-xl bg-white text-sm text-on-surface focus:border-primary-container outline-none transition-colors font-mono"
                    />
                  </div>
                </div>

                <motion.button
                  onClick={handleSaveBank}
                  animate={bankSaved ? { backgroundColor: "#001a41" } : { backgroundColor: "#00f3ff" }}
                  transition={{ duration: 0.25 }}
                  className="w-full h-11 mt-5 text-deep-navy text-sm font-bold rounded-xl border-2 border-transparent hover:border-deep-navy active:scale-[0.97] transition-all"
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
