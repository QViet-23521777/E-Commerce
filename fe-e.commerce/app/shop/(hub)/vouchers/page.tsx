"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Ticket,
  Trash2,
  Edit2,
  X,
  Copy,
  Check,
  Calendar,
  Tag,
  ShoppingBag,
  RotateCcw,
} from "lucide-react";
import {
  fetchMyVouchers,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  type Promotion,
  type VoucherInput,
} from "@/lib/promotions";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

type VoucherType = "percent" | "fixed";
type VoucherStatus = "active" | "scheduled" | "expired";

interface Voucher {
  id: string;
  code: string;
  type: VoucherType;
  value: number;
  minOrder: number;
  appliesTo: "all" | string[];
  validFrom: string;
  validUntil: string;
  usageLimit: number | null;
  usedCount: number;
  status: VoucherStatus;
}

// A voucher with no explicit end date is stored with this far-future date
// (the promotion service requires endDate). We render it as "∞".
const OPEN_ENDED = "2099-12-31";

function computeStatus(
  active: boolean,
  validFrom: string,
  validUntil: string,
): VoucherStatus {
  const now = new Date().toISOString().slice(0, 10);
  if (!active) return "expired";
  if (validUntil && validUntil !== OPEN_ENDED && validUntil < now) return "expired";
  if (validFrom > now) return "scheduled";
  return "active";
}

// Backend promotion → the UI's Voucher shape.
function toVoucher(p: Promotion): Voucher {
  const validFrom = (p.startDate ?? "").slice(0, 10);
  const rawUntil = (p.endDate ?? "").slice(0, 10);
  const validUntil = rawUntil === OPEN_ENDED ? "" : rawUntil;
  return {
    id: p.id,
    code: p.code,
    type: p.discountType === "percentage" ? "percent" : "fixed",
    value: p.discountValue,
    minOrder: p.minOrderAmount ?? 0,
    appliesTo: p.productIds && p.productIds.length ? p.productIds : "all",
    validFrom,
    validUntil,
    usageLimit: p.usageLimit ?? null,
    usedCount: p.usedCount ?? 0,
    status: computeStatus(p.active, validFrom, rawUntil),
  };
}

// UI drawer form → the backend create/update payload.
function toVoucherInput(d: DrawerVoucher): VoucherInput {
  const code = d.code.trim().toUpperCase();
  const productIds =
    d.appliesTo.trim().toLowerCase() === "all" || d.appliesTo.trim() === ""
      ? []
      : d.appliesTo
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
  return {
    code,
    title: code, // the form has no separate title; the code doubles as it.
    discountType: d.type === "percent" ? "percentage" : "fixed",
    discountValue: parseFloat(d.value) || 0,
    minOrderAmount: parseFloat(d.minOrder) || 0,
    startDate: new Date(`${d.validFrom}T00:00:00`).toISOString(),
    endDate: new Date(
      `${d.validUntil || OPEN_ENDED}T23:59:59`,
    ).toISOString(),
    usageLimit: d.usageLimit ? parseInt(d.usageLimit) : null,
    productIds,
  };
}

type TabId = "active" | "scheduled" | "expired";
const TABS: { id: TabId; label: string }[] = [
  { id: "active", label: "Active" },
  { id: "scheduled", label: "Scheduled" },
  { id: "expired", label: "Expired" },
];

interface DrawerVoucher {
  id?: string;
  code: string;
  type: VoucherType;
  value: string;
  minOrder: string;
  appliesTo: string;
  validFrom: string;
  validUntil: string;
  usageLimit: string;
}

const EMPTY_DRAWER: DrawerVoucher = {
  code: "",
  type: "percent",
  value: "",
  minOrder: "0",
  appliesTo: "all",
  validFrom: new Date().toISOString().slice(0, 10),
  validUntil: "",
  usageLimit: "",
};

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("active");
  const [showDrawer, setShowDrawer] = useState(false);
  const [drawerVoucher, setDrawerVoucher] = useState<DrawerVoucher>(EMPTY_DRAWER);
  const [drawerSaved, setDrawerSaved] = useState(false);
  const [drawerError, setDrawerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function loadVouchers() {
    setLoadError(null);
    try {
      const promos = await fetchMyVouchers();
      setVouchers(promos.map(toVoucher));
    } catch (err) {
      const e = err as { message?: string };
      setLoadError(e?.message ?? "Couldn't load vouchers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVouchers();
  }, []);

  function copyCode(id: string, code: string) {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  }

  function openCreate() {
    setDrawerVoucher(EMPTY_DRAWER);
    setDrawerSaved(false);
    setDrawerError(null);
    setShowDrawer(true);
  }

  function openEdit(v: Voucher) {
    setDrawerVoucher({
      id: v.id,
      code: v.code,
      type: v.type,
      value: String(v.value),
      minOrder: String(v.minOrder),
      appliesTo: v.appliesTo === "all" ? "all" : (v.appliesTo as string[]).join(", "),
      validFrom: v.validFrom,
      validUntil: v.validUntil,
      usageLimit: v.usageLimit ? String(v.usageLimit) : "",
    });
    setDrawerSaved(false);
    setDrawerError(null);
    setShowDrawer(true);
  }

  async function handleSave() {
    if (!drawerVoucher.code || !drawerVoucher.value) {
      setDrawerError("Code and value are required.");
      return;
    }
    if (!drawerVoucher.validFrom) {
      setDrawerError("A start date is required.");
      return;
    }
    setDrawerError(null);
    setSaving(true);
    try {
      const payload = toVoucherInput(drawerVoucher);
      if (drawerVoucher.id) {
        await updateVoucher(drawerVoucher.id, payload);
      } else {
        await createVoucher(payload);
      }
      await loadVouchers();
      setDrawerSaved(true);
      setTimeout(() => setShowDrawer(false), 700);
    } catch (err) {
      const e = err as { status?: number; message?: string; errors?: string[] };
      setDrawerError(
        e?.status === 409
          ? "That code is already in use."
          : e?.errors?.[0] ?? e?.message ?? "Couldn't save the voucher.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteVoucher(deleteId);
      setVouchers((prev) => prev.filter((v) => v.id !== deleteId));
      setDeleteId(null);
    } catch {
      /* keep the dialog open on failure */
    } finally {
      setDeleting(false);
    }
  }

  const filtered = vouchers.filter((v) => v.status === activeTab);

  const tabCounts = (id: TabId) => vouchers.filter((v) => v.status === id).length;

  return (
    <>
      <div className="p-6 lg:p-8 max-w-[900px] mx-auto w-full">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-px w-5 bg-primary-container" />
              <p className="text-label-caps text-primary">Promotions</p>
            </div>
            <h1 className="text-2xl font-bold text-deep-navy tracking-tight">
              Voucher Management
            </h1>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 h-10 px-5 bg-primary-container text-deep-navy text-sm font-bold rounded-xl border-2 border-transparent hover:border-deep-navy active:scale-[0.97] transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Voucher
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex bg-white border-2 border-deep-navy rounded-xl overflow-hidden mb-5">
          {TABS.map((tab) => {
            const count = tabCounts(tab.id);
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold transition-all duration-150 ${
                  active
                    ? "bg-deep-navy text-white"
                    : "text-on-surface-variant hover:text-deep-navy hover:bg-surface-container-low"
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                      active ? "bg-white/20 text-white" : "bg-surface-container text-on-surface-variant"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Voucher list */}
        {loading ? (
          <div className="bg-white border-2 border-deep-navy rounded-xl py-16 flex flex-col items-center text-center">
            <Ticket className="w-10 h-10 text-outline mb-3 animate-pulse" />
            <p className="text-sm text-on-surface-variant">Loading vouchers…</p>
          </div>
        ) : loadError ? (
          <div className="bg-white border-2 border-error/40 rounded-xl py-16 flex flex-col items-center text-center">
            <Ticket className="w-10 h-10 text-error/60 mb-3" />
            <p className="font-semibold text-error">{loadError}</p>
            <button
              onClick={() => { setLoading(true); loadVouchers(); }}
              className="mt-3 text-sm font-semibold text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border-2 border-deep-navy rounded-xl py-16 flex flex-col items-center text-center">
            <Ticket className="w-10 h-10 text-outline mb-3" />
            <p className="font-semibold text-on-surface">No {activeTab} vouchers</p>
            <p className="text-sm text-on-surface-variant mt-1">
              {activeTab === "active"
                ? "Create a voucher to start running promotions"
                : activeTab === "scheduled"
                ? "Schedule a voucher to run a future promotion"
                : "Expired vouchers will appear here"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {filtered.map((voucher) => {
                const copied = copiedId === voucher.id;
                const usagePct =
                  voucher.usageLimit
                    ? Math.round((voucher.usedCount / voucher.usageLimit) * 100)
                    : null;

                return (
                  <motion.div
                    key={voucher.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.25, ease: EASE }}
                    className={`bg-white border-2 border-deep-navy rounded-xl overflow-hidden ${
                      voucher.status === "expired" ? "opacity-60" : ""
                    }`}
                  >
                    {/* Top accent */}
                    <div
                      className={`h-1 ${
                        voucher.status === "active"
                          ? "bg-primary-container"
                          : voucher.status === "scheduled"
                          ? "bg-amber-400"
                          : "bg-surface-container-high"
                      }`}
                    />

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        {/* Left: code + discount */}
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="bg-deep-navy text-primary-container px-4 py-2 rounded-lg font-mono text-lg font-bold tracking-widest">
                              {voucher.code}
                            </div>
                          </div>
                          <div>
                            <p className="text-xl font-bold text-deep-navy tracking-tight">
                              {voucher.type === "percent"
                                ? `${voucher.value}% OFF`
                                : `$${voucher.value} OFF`}
                            </p>
                            <p className="text-xs text-on-surface-variant">
                              {voucher.minOrder > 0
                                ? `Min. order $${voucher.minOrder}`
                                : "No minimum"}
                            </p>
                          </div>
                        </div>

                        {/* Right: actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => copyCode(voucher.id, voucher.code)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant text-xs font-semibold text-on-surface-variant hover:border-deep-navy hover:text-deep-navy transition-colors"
                          >
                            <AnimatePresence mode="wait">
                              {copied ? (
                                <motion.span
                                  key="check"
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="flex items-center gap-1 text-primary"
                                >
                                  <Check className="w-3 h-3" /> Copied
                                </motion.span>
                              ) : (
                                <motion.span
                                  key="copy"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="flex items-center gap-1"
                                >
                                  <Copy className="w-3 h-3" /> Copy
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </button>

                          {voucher.status !== "expired" && (
                            <button
                              onClick={() => openEdit(voucher)}
                              className="p-1.5 rounded-lg text-on-surface-variant hover:text-deep-navy hover:bg-surface-container transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteId(voucher.id)}
                            className="p-1.5 rounded-lg text-on-surface-variant hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Perforated divider */}
                      <div className="my-4 border-t-2 border-dashed border-outline-variant" />

                      {/* Meta row */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-on-surface-variant">
                        <span className="flex items-center gap-1.5">
                          <ShoppingBag className="w-3.5 h-3.5 text-outline" />
                          {voucher.appliesTo === "all"
                            ? "All products"
                            : Array.isArray(voucher.appliesTo)
                            ? (voucher.appliesTo as string[]).join(", ")
                            : voucher.appliesTo}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-outline" />
                          {voucher.validFrom} – {voucher.validUntil || "∞"}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-outline" />
                          {voucher.usedCount} used
                          {voucher.usageLimit ? ` / ${voucher.usageLimit}` : " (unlimited)"}
                        </span>
                      </div>

                      {/* Usage bar */}
                      {usagePct !== null && (
                        <div className="mt-3">
                          <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${usagePct}%` }}
                              transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
                              className={`h-full rounded-full ${
                                usagePct >= 90
                                  ? "bg-red-500"
                                  : usagePct >= 60
                                  ? "bg-amber-400"
                                  : "bg-primary-container"
                              }`}
                            />
                          </div>
                          <p className="text-[10px] text-on-surface-variant mt-1">
                            {usagePct}% of usage limit reached
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setDeleteId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: EASE }}
              className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-deep-navy rounded-2xl p-6 w-[340px]"
            >
              <div className="w-10 h-10 bg-red-50 border border-red-200 rounded-xl flex items-center justify-center mb-4">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="font-bold text-deep-navy mb-1">Delete Voucher?</h3>
              <p className="text-sm text-on-surface-variant mb-5">
                This voucher will no longer be redeemable. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 h-10 border-2 border-deep-navy/20 rounded-xl text-sm font-semibold text-on-surface-variant hover:border-deep-navy transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 h-10 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 active:scale-[0.97] transition-all disabled:opacity-60"
                >
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Create / Edit drawer */}
      <AnimatePresence>
        {showDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setShowDrawer(false)}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.35, ease: EASE }}
              className="fixed top-0 right-0 z-50 h-full w-full sm:w-[460px] bg-white border-l-2 border-deep-navy flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b-2 border-deep-navy shrink-0">
                <div>
                  <p className="text-label-caps text-primary mb-0.5">
                    {drawerVoucher.id ? "Edit" : "Create"}
                  </p>
                  <h2 className="font-bold text-deep-navy">
                    {drawerVoucher.id ? "Edit Voucher" : "New Voucher"}
                  </h2>
                </div>
                <button
                  onClick={() => setShowDrawer(false)}
                  className="p-2 rounded-lg text-on-surface-variant hover:text-deep-navy hover:bg-surface-container transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                {/* Code */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant mb-2">
                    Voucher Code *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={drawerVoucher.code}
                      onChange={(e) =>
                        setDrawerVoucher((p) => ({
                          ...p,
                          code: e.target.value.toUpperCase(),
                        }))
                      }
                      placeholder="e.g. SAVE20"
                      maxLength={20}
                      className="flex-1 h-11 px-4 border-2 border-deep-navy/20 rounded-xl bg-white text-sm text-on-surface font-mono placeholder:text-outline focus:border-primary-container outline-none transition-colors uppercase"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setDrawerVoucher((p) => ({ ...p, code: generateCode() }))
                      }
                      className="shrink-0 flex items-center gap-1.5 px-3 h-11 border-2 border-deep-navy/20 rounded-xl text-xs font-semibold text-on-surface-variant hover:border-deep-navy transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Auto
                    </button>
                  </div>
                </div>

                {/* Discount type + value */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant mb-2">
                      Discount Type
                    </label>
                    <select
                      value={drawerVoucher.type}
                      onChange={(e) =>
                        setDrawerVoucher((p) => ({
                          ...p,
                          type: e.target.value as VoucherType,
                        }))
                      }
                      className="block w-full h-11 px-4 border-2 border-deep-navy/20 rounded-xl bg-white text-sm text-on-surface focus:border-primary-container outline-none appearance-none"
                    >
                      <option value="percent">Percentage (%)</option>
                      <option value="fixed">Fixed Amount ($)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant mb-2">
                      Value *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-sm font-bold">
                        {drawerVoucher.type === "percent" ? "%" : "$"}
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={drawerVoucher.type === "percent" ? 100 : undefined}
                        value={drawerVoucher.value}
                        onChange={(e) =>
                          setDrawerVoucher((p) => ({ ...p, value: e.target.value }))
                        }
                        placeholder="0"
                        className="block w-full h-11 pl-8 pr-4 border-2 border-deep-navy/20 rounded-xl bg-white text-sm text-on-surface focus:border-primary-container outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Min order */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant mb-2">
                    Minimum Order Amount ($)
                    <span className="ml-2 font-normal text-outline normal-case tracking-normal">
                      0 = no minimum
                    </span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={drawerVoucher.minOrder}
                    onChange={(e) =>
                      setDrawerVoucher((p) => ({ ...p, minOrder: e.target.value }))
                    }
                    className="block w-full h-11 px-4 border-2 border-deep-navy/20 rounded-xl bg-white text-sm text-on-surface focus:border-primary-container outline-none transition-colors"
                  />
                </div>

                {/* Applies to */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant mb-2">
                    Applies To
                  </label>
                  <input
                    type="text"
                    value={drawerVoucher.appliesTo}
                    onChange={(e) =>
                      setDrawerVoucher((p) => ({ ...p, appliesTo: e.target.value }))
                    }
                    placeholder="all · or product names separated by commas"
                    className="block w-full h-11 px-4 border-2 border-deep-navy/20 rounded-xl bg-white text-sm text-on-surface placeholder:text-outline focus:border-primary-container outline-none transition-colors"
                  />
                  <p className="text-[10px] text-on-surface-variant mt-1.5">
                    Type "all" for all products, or list product names separated by commas.
                  </p>
                </div>

                {/* Date range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant mb-2">
                      Valid From
                    </label>
                    <input
                      type="date"
                      value={drawerVoucher.validFrom}
                      onChange={(e) =>
                        setDrawerVoucher((p) => ({ ...p, validFrom: e.target.value }))
                      }
                      className="block w-full h-11 px-4 border-2 border-deep-navy/20 rounded-xl bg-white text-sm text-on-surface focus:border-primary-container outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant mb-2">
                      Valid Until
                      <span className="ml-2 font-normal text-outline normal-case tracking-normal">
                        optional
                      </span>
                    </label>
                    <input
                      type="date"
                      value={drawerVoucher.validUntil}
                      onChange={(e) =>
                        setDrawerVoucher((p) => ({ ...p, validUntil: e.target.value }))
                      }
                      className="block w-full h-11 px-4 border-2 border-deep-navy/20 rounded-xl bg-white text-sm text-on-surface focus:border-primary-container outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Usage limit */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant mb-2">
                    Usage Limit
                    <span className="ml-2 font-normal text-outline normal-case tracking-normal">
                      leave blank for unlimited
                    </span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={drawerVoucher.usageLimit}
                    onChange={(e) =>
                      setDrawerVoucher((p) => ({ ...p, usageLimit: e.target.value }))
                    }
                    placeholder="∞ Unlimited"
                    className="block w-full h-11 px-4 border-2 border-deep-navy/20 rounded-xl bg-white text-sm text-on-surface placeholder:text-outline focus:border-primary-container outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="border-t-2 border-deep-navy px-6 py-4 shrink-0 bg-white">
                {drawerError && (
                  <p className="text-xs font-medium text-error mb-3">{drawerError}</p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDrawer(false)}
                    className="flex-1 h-11 border-2 border-deep-navy/20 rounded-xl text-sm font-semibold text-on-surface-variant hover:border-deep-navy transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    onClick={handleSave}
                    disabled={saving}
                    animate={
                      drawerSaved
                        ? { backgroundColor: "#001a41" }
                        : { backgroundColor: "#00f3ff" }
                    }
                    transition={{ duration: 0.25, ease: EASE }}
                    className="flex-1 h-11 rounded-xl text-sm font-bold border-2 border-transparent hover:border-deep-navy active:scale-[0.97] transition-all disabled:opacity-70"
                  >
                    <AnimatePresence mode="wait">
                      {drawerSaved ? (
                        <motion.span
                          key="saved"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center justify-center gap-2 text-primary-container"
                        >
                          <Check className="w-4 h-4" />
                          {drawerVoucher.id ? "Saved!" : "Created!"}
                        </motion.span>
                      ) : (
                        <motion.span
                          key="save"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="text-deep-navy"
                        >
                          {saving
                            ? "Saving…"
                            : drawerVoucher.id
                            ? "Save Changes"
                            : "Create Voucher"}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
