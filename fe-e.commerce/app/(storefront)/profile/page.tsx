"use client";

import {
  Wallet,
  Package,
  Star,
  ChevronRight,
  X,
  Settings,
  Heart,
  LayoutDashboard,
  Ticket,
  User,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Check,
  Copy,
  LogOut,
  History,
  Search as SearchIcon,
  Eye,
  EyeOff,
  ShieldCheck,
  ShoppingBag,
  Loader2,
  Gift,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { apiRequest } from "@/lib/api";
import { clearTokens, getAccessToken, getUser } from "@/lib/auth";
import { clearLocalCart } from "@/lib/cart";
import { fetchMyProfile, updateMyProfile, type UserProfileData } from "@/lib/user";
import {
  fetchWallet,
  fetchPoints,
  redeemPoints,
  type Wallet as WalletData,
  type PointsSummary,
} from "@/lib/wallet";
import { fetchActivityHistory, type ActivityRecord } from "@/lib/activity";
import { formatVND, fetchProductById, type UIProduct } from "@/lib/products";
import {
  fetchMyOrders,
  FULFILLMENT_LABEL,
  type Order,
  type FulfillmentStatus,
} from "@/lib/orders";
import { fetchWishlist, removeFromWishlist } from "@/lib/wishlist";
import { fetchAddresses, saveAddresses, type Address } from "@/lib/address";
import { fetchActivePromotions, type Promotion } from "@/lib/promotions";
import TwoFactorToggle from "@/components/TwoFactorToggle";

type TabId =
  | "overview"
  | "activity"
  | "wishlist"
  | "rewards"
  | "vouchers"
  | "settings"
  | "change-password";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: "activity", label: "Activity", icon: <History className="w-4 h-4" /> },
  { id: "wishlist", label: "Wishlist", icon: <Heart className="w-4 h-4" /> },
  { id: "rewards", label: "Rewards", icon: <Gift className="w-4 h-4" /> },
  { id: "vouchers", label: "Vouchers", icon: <Ticket className="w-4 h-4" /> },
  { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
  { id: "change-password", label: "Security", icon: <Settings className="w-4 h-4" /> },
];

function initialsFromName(name?: string): string {
  if (!name) return "··";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "··";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatMemberSince(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

// ── Order display helpers ─────────────────────────────────────────────────────

// Map a fulfilment status to the accent colour used in the orders list.
const FULFILLMENT_COLOR: Record<FulfillmentStatus, string> = {
  to_confirm: "text-secondary",
  processing: "text-secondary",
  shipped: "text-primary",
  delivered: "text-primary",
  cancelled: "text-error",
};

// An order is "active" while it's still in flight (not delivered or cancelled).
function isActiveOrder(o: Order): boolean {
  const s = o.fulfillmentStatus;
  return s === "to_confirm" || s === "processing" || s === "shipped";
}

function formatOrderDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ── Address Book ──────────────────────────────────────────────────────────────

const EMPTY_ADDR = {
  label: "",
  name: "",
  line1: "",
  line2: "",
  city: "",
  zip: "",
  country: "Norway",
  phone: "",
};

const ADDR_FIELDS = [
  { key: "label" as const, label: "Label (e.g. Home)", span: 1 },
  { key: "name" as const, label: "Full Name", span: 1 },
  { key: "line1" as const, label: "Street Address", span: 2 },
  { key: "line2" as const, label: "Apt / Suite (optional)", span: 2 },
  { key: "city" as const, label: "City", span: 1 },
  { key: "zip" as const, label: "ZIP / Postal Code", span: 1 },
  { key: "country" as const, label: "Country", span: 1 },
  { key: "phone" as const, label: "Phone Number", span: 1 },
] as const;

// ─────────────────────────────────────────────────────────────────────────────

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

function PersonalInfoSection({
  profile,
  onSaved,
}: {
  profile: UserProfileData | null;
  onSaved: (p: UserProfileData) => void;
}) {
  const [name, setName] = useState(profile?.name ?? "");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setName(profile?.name ?? "");
  }, [profile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Name can't be empty.");
      return;
    }
    setSaving(true);
    try {
      const updated = await updateMyProfile({ name: name.trim() });
      onSaved(updated);
      setSaved(true);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => setSaved(false), 2500);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? "Couldn't save changes.");
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setName(profile?.name ?? "");
    setError("");
    setSaved(false);
  }

  const dirty = name.trim() !== (profile?.name ?? "").trim();

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* Section header */}
      <div className="pb-5 border-b-2 border-deep-navy">
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="w-5 h-px bg-primary-container flex-shrink-0" />
          <p className="text-label-caps text-primary">Account</p>
        </div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-headline-md text-deep-navy leading-tight">Personal Information</h2>
            <p className="text-sm text-on-surface-variant mt-1">Update the name shown across your account.</p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-outline shrink-0 pb-0.5">
            Member since {formatMemberSince(profile?.createdAt)}
          </span>
        </div>
      </div>

      {/* Avatar strip */}
      <div className="flex items-center gap-5 p-5 bg-white border-2 border-deep-navy/10 hover:border-deep-navy/30 rounded-2xl transition-colors duration-200">
        <div className="w-[60px] h-[60px] rounded-full bg-primary-container border-2 border-deep-navy flex items-center justify-center shrink-0">
          <span className="text-lg font-bold text-deep-navy tracking-tight select-none">
            {initialsFromName(profile?.name)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-deep-navy truncate">{profile?.name || "—"}</p>
          <p className="text-xs text-on-surface-variant mt-0.5 truncate">{profile?.email || "—"}</p>
        </div>
      </div>

      {/* Form grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-7">
        <div className="sm:col-span-2">
          <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant mb-2.5">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
            className="w-full h-11 px-0 bg-transparent border-b-2 border-deep-navy/20 text-sm font-medium text-deep-navy placeholder:text-outline focus:border-primary-container outline-none transition-colors duration-200 rounded-none"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant mb-2.5">
            Email Address
            <span className="ml-2 font-normal text-outline normal-case tracking-normal">read-only</span>
          </label>
          <input
            type="email"
            value={profile?.email ?? ""}
            disabled
            className="w-full h-11 px-0 bg-transparent border-b-2 border-deep-navy/10 text-sm font-medium text-on-surface-variant outline-none rounded-none cursor-not-allowed"
          />
        </div>
      </div>

      {error && <p className="text-xs font-medium text-error">{error}</p>}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2 border-t border-deep-navy/10">
        <motion.button
          type="submit"
          disabled={saving || (!dirty && !saved)}
          animate={saved ? { backgroundColor: "#001a41" } : { backgroundColor: "#00f3ff" }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          className="h-11 px-8 text-deep-navy text-label-caps font-bold rounded-xl border-2 border-transparent hover:border-deep-navy transition-colors duration-150 active:scale-[0.97] relative overflow-hidden disabled:opacity-60"
        >
          <AnimatePresence mode="wait">
            {saved ? (
              <motion.span
                key="saved"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                className="flex items-center gap-1.5 text-white"
              >
                <Check className="w-3.5 h-3.5" /> Saved
              </motion.span>
            ) : (
              <motion.span
                key="save"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              >
                {saving ? "Saving…" : "Save Changes"}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
        <button
          type="button"
          onClick={handleReset}
          className="h-11 px-8 border-2 border-deep-navy/30 text-deep-navy text-label-caps font-bold rounded-xl hover:border-deep-navy hover:bg-surface-container transition-colors duration-150 active:scale-[0.97]"
        >
          Reset
        </button>
      </div>
    </form>
  );
}

// ── Activity history ─────────────────────────────────────────────────────────

const ACTIVITY_META: Record<
  ActivityRecord["activity"],
  { label: string; icon: React.ReactNode; color: string }
> = {
  view: { label: "Viewed a product", icon: <Eye className="w-4 h-4" />, color: "text-secondary" },
  search: { label: "Searched", icon: <SearchIcon className="w-4 h-4" />, color: "text-primary" },
  click: { label: "Clicked a product", icon: <ChevronRight className="w-4 h-4" />, color: "text-tertiary" },
  buy: { label: "Purchased", icon: <ShoppingBag className="w-4 h-4" />, color: "text-primary" },
};

function relativeTime(iso?: string): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (isNaN(then)) return "";
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ActivityTab({ records, loading }: { records: ActivityRecord[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-on-surface-variant">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }
  if (records.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed border-outline-variant rounded-2xl">
        <History className="w-10 h-10 text-outline mx-auto mb-3" />
        <p className="text-sm font-bold text-on-surface">No activity yet</p>
        <p className="text-xs text-on-surface-variant mt-1">
          Browse and search products — your recent activity will show up here.
        </p>
      </div>
    );
  }
  return (
    <div className="bg-white border-2 border-deep-navy rounded-2xl overflow-hidden">
      <ul className="divide-y divide-outline-variant">
        {records.map((r, i) => {
          const meta = ACTIVITY_META[r.activity] ?? ACTIVITY_META.view;
          return (
            <li key={r._id ?? i} className="flex items-center gap-4 px-5 py-4">
              <div className={`w-9 h-9 rounded-xl border border-outline-variant bg-surface-container-low flex items-center justify-center shrink-0 ${meta.color}`}>
                {meta.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-deep-navy">{meta.label}</p>
                <p className="text-xs text-on-surface-variant truncate">
                  {r.activity === "search"
                    ? `“${r.keyword ?? ""}”`
                    : r.productId
                    ? `Product ${r.productId}`
                    : "—"}
                </p>
              </div>
              <span className="text-[11px] text-on-surface-variant shrink-0">{relativeTime(r.createdAt)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── Vouchers ──────────────────────────────────────────────────────────────────

// Headline label for a promotion, e.g. "25% OFF" or "₫50,000 OFF".
function promoDiscountLabel(p: Promotion): string {
  return p.discountType === "percentage"
    ? `${p.discountValue}% OFF`
    : `${formatVND(p.discountValue)} OFF`;
}

function promoConditionLabel(p: Promotion): string {
  return p.minOrderAmount > 0
    ? `Min. order ${formatVND(p.minOrderAmount)}`
    : "All items";
}

function RewardsTab({
  summary,
  loading,
  onRedeem,
}: {
  summary: PointsSummary | null;
  loading: boolean;
  onRedeem: (points: number) => Promise<void>;
}) {
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-on-surface-variant">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  const balance = summary?.points ?? 0;
  const lifetime = summary?.lifetimePoints ?? 0;
  const tier = summary?.tier ?? "Member";
  const rate = summary?.pointValueVnd ?? 10;
  const minRedeem = summary?.minRedeem ?? 100;
  const step = summary?.redeemStep ?? 100;
  const history = summary?.history ?? [];

  const parsed = Number(amount);
  const valid =
    Number.isInteger(parsed) &&
    parsed >= minRedeem &&
    parsed % step === 0 &&
    parsed <= balance;
  const previewVnd = Number.isFinite(parsed) && parsed > 0 ? parsed * rate : 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!valid) {
      setError(
        parsed > balance
          ? "You don't have that many points."
          : `Redeem at least ${minRedeem} points, in multiples of ${step}.`,
      );
      return;
    }
    setBusy(true);
    try {
      await onRedeem(parsed);
      setSuccess(`Redeemed ${parsed.toLocaleString()} points for ${formatVND(parsed * rate)} wallet credit.`);
      setAmount("");
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      setError(
        status === 402
          ? "You don't have enough points."
          : (err as { message?: string })?.message ?? "Couldn't redeem points.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-10">
      {/* Balance + tier */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-deep-navy text-white rounded-2xl p-6">
          <div className="flex items-center gap-2 text-ice-blue/60">
            <Star className="w-4 h-4" />
            <p className="text-label-caps uppercase tracking-widest text-xs">Points Balance</p>
          </div>
          <p className="text-4xl font-bold mt-2">{balance.toLocaleString()}</p>
          <p className="text-xs text-ice-blue/60 mt-1">
            Worth {formatVND(balance * rate)} in wallet credit
          </p>
        </div>
        <div className="bg-white border-2 border-deep-navy rounded-2xl p-6">
          <div className="flex items-center gap-2 text-primary">
            <Gift className="w-4 h-4" />
            <p className="text-label-caps uppercase tracking-widest text-xs">Tier</p>
          </div>
          <p className="text-2xl font-bold text-deep-navy mt-2">{tier}</p>
          <p className="text-xs text-on-surface-variant mt-1">
            {lifetime.toLocaleString()} points earned all-time
          </p>
        </div>
      </div>

      {/* Redeem */}
      <div>
        <div className="flex items-center gap-2.5 pb-4 border-b-2 border-deep-navy mb-5">
          <div className="w-5 h-px bg-primary-container flex-shrink-0" />
          <p className="text-label-caps text-primary">Redeem</p>
        </div>
        <form onSubmit={submit} className="bg-white border-2 border-deep-navy/10 rounded-2xl p-6 space-y-4">
          <p className="text-sm text-on-surface-variant">
            Convert points into wallet credit. Each point is worth {formatVND(rate)};
            redeem from {minRedeem.toLocaleString()} points in steps of {step}.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Points to redeem</label>
              <input
                type="number"
                min={minRedeem}
                step={step}
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setError(""); setSuccess(""); }}
                placeholder={String(minRedeem)}
                className="mt-1 w-full h-11 px-3 border-2 border-deep-navy/15 focus:border-deep-navy rounded-xl outline-none text-sm font-bold text-deep-navy bg-white transition-colors"
              />
            </div>
            <div className="text-sm font-bold text-deep-navy sm:pb-3 sm:w-32">
              = {formatVND(previewVnd)}
            </div>
            <button
              type="submit"
              disabled={busy || !valid}
              className="h-11 px-6 bg-deep-navy text-primary-container font-bold text-sm uppercase tracking-widest rounded-xl hover:bg-primary hover:text-deep-navy transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] shrink-0"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Redeem"}
            </button>
          </div>
          {error && <p className="text-xs font-bold text-error">{error}</p>}
          {success && (
            <p className="text-xs font-bold text-primary flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> {success}
            </p>
          )}
        </form>
      </div>

      {/* History */}
      <div>
        <div className="flex items-center gap-2.5 pb-4 border-b-2 border-deep-navy mb-5">
          <div className="w-5 h-px bg-primary-container flex-shrink-0" />
          <p className="text-label-caps text-primary">History</p>
        </div>
        {history.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-outline-variant rounded-2xl">
            <Star className="w-10 h-10 text-outline mx-auto mb-3" />
            <p className="text-sm font-bold text-on-surface">No points activity yet</p>
            <p className="text-xs text-on-surface-variant mt-1">Earn points on your next purchase.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((t) => {
              const earn = t.type === "earn";
              return (
                <div key={t.id} className="flex items-center gap-4 p-4 bg-white border border-deep-navy/15 rounded-xl">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${earn ? "bg-primary-container/20 text-primary" : "bg-secondary/10 text-secondary"}`}>
                    {earn ? <Star className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-deep-navy">{earn ? "Points earned" : "Redeemed for credit"}</p>
                    <p className="text-xs text-on-surface-variant truncate">{formatOrderDate(t.createdAt)}{!earn && t.valueVnd ? ` · ${formatVND(t.valueVnd)} credit` : ""}</p>
                  </div>
                  <span className={`text-sm font-bold shrink-0 ${earn ? "text-primary" : "text-secondary"}`}>
                    {earn ? "+" : "−"}{t.points.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function VouchersTab() {
  const [copied, setCopied] = useState<string | null>(null);
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await fetchActivePromotions();
        if (alive) setPromos(data);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  function copyCode(code: string) {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(null), 1800);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-on-surface-variant">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Active */}
      <div>
        <div className="flex items-center gap-2.5 pb-4 border-b-2 border-deep-navy mb-5">
          <div className="w-5 h-px bg-primary-container flex-shrink-0" />
          <p className="text-label-caps text-primary">Available</p>
          <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            {promos.length} voucher{promos.length !== 1 ? "s" : ""}
          </span>
        </div>

        {promos.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-outline-variant rounded-2xl">
            <Ticket className="w-10 h-10 text-outline mx-auto mb-3" />
            <p className="text-sm font-bold text-on-surface">No active vouchers</p>
            <p className="text-xs text-on-surface-variant mt-1">Check back later for new offers.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {promos.map((v) => (
              <motion.div
                key={v.id}
                variants={fadeUp}
                className="relative bg-white border-2 border-deep-navy rounded-2xl overflow-hidden group"
              >
                {/* Cyan top stripe */}
                <div className="h-1 bg-primary-container w-full" />

                {/* Perforated line */}
                <div className="absolute left-0 right-0 top-[5.5rem] flex items-center px-4 pointer-events-none">
                  <div className="flex-1 border-t-2 border-dashed border-deep-navy/15" />
                </div>

                <div className="p-5 pb-0">
                  <p className="text-2xl font-bold text-deep-navy tracking-tight">{promoDiscountLabel(v)}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5 mb-5">{v.description || v.title}</p>
                </div>

                <div className="px-5 pt-5 pb-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-xs font-bold font-mono text-primary bg-primary/5 border border-primary/20 px-2.5 py-1 rounded-lg tracking-widest">
                      {v.code}
                    </code>
                    <button
                      onClick={() => copyCode(v.code)}
                      className="flex items-center gap-1 h-7 px-2.5 border border-deep-navy/20 hover:border-deep-navy rounded-lg text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-deep-navy transition-colors active:scale-[0.93]"
                    >
                      <AnimatePresence mode="wait">
                        {copied === v.code ? (
                          <motion.span
                            key="done"
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.7 }}
                            transition={{ duration: 0.15 }}
                            className="flex items-center gap-1 text-primary"
                          >
                            <Check className="w-3 h-3" /> Copied
                          </motion.span>
                        ) : (
                          <motion.span
                            key="copy"
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.7 }}
                            transition={{ duration: 0.15 }}
                            className="flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" /> Copy
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-on-surface-variant font-semibold">
                    <span>{promoConditionLabel(v)}</span>
                    <span>Expires {formatOrderDate(v.endDate)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Change password ────────────────────────────────────────────────────────────

function PasswordField({
  label,
  value,
  onChange,
  visible,
  onToggleVisible,
  autoComplete,
  invalid,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  visible: boolean;
  onToggleVisible: () => void;
  autoComplete?: string;
  invalid?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant mb-2.5">
        {label}
      </label>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className={`w-full h-11 pl-0 pr-10 bg-transparent border-b-2 text-sm font-medium text-deep-navy placeholder:text-outline outline-none transition-colors duration-200 rounded-none ${
            invalid ? "border-error" : "border-deep-navy/20 focus:border-primary-container"
          }`}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={onToggleVisible}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-outline hover:text-deep-navy transition-colors"
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {children}
    </div>
  );
}

function ChangePasswordSection() {
  const [cpCurrent, setCpCurrent] = useState("");
  const [cpNew, setCpNew] = useState("");
  const [cpConfirm, setCpConfirm] = useState("");
  const [cpError, setCpError] = useState("");
  const [cpSuccess, setCpSuccess] = useState("");
  const [cpLoading, setCpLoading] = useState(false);
  const [show, setShow] = useState({ current: false, next: false, confirm: false });

  const longEnough = cpNew.length >= 8;
  const matches = cpConfirm.length > 0 && cpNew === cpConfirm;
  const mismatch = cpConfirm.length > 0 && !matches;
  const canSubmit = cpCurrent.length > 0 && longEnough && matches && !cpLoading;

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setCpError("");
    setCpSuccess("");
    if (cpNew !== cpConfirm) {
      setCpError("New passwords do not match");
      return;
    }
    setCpLoading(true);
    try {
      await apiRequest("/api/users/change-password", {
        method: "POST",
        body: { token: getAccessToken(), oldPassword: cpCurrent, newPassword: cpNew },
      });
      setCpSuccess("Password changed successfully.");
      setCpCurrent("");
      setCpNew("");
      setCpConfirm("");
      setShow({ current: false, next: false, confirm: false });
    } catch (err: unknown) {
      const e = err as { message?: string };
      setCpError(e?.message ?? "Failed to change password.");
    } finally {
      setCpLoading(false);
    }
  }

  return (
    <div className="max-w-xl space-y-8">
      {/* Section header */}
      <div className="pb-5 border-b-2 border-deep-navy">
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="w-5 h-px bg-primary-container flex-shrink-0" />
          <p className="text-label-caps text-primary">Security</p>
        </div>
        <h2 className="text-headline-md text-deep-navy leading-tight">Change Password</h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Choose a strong password you don&apos;t reuse on other sites.
        </p>
      </div>

      <form className="space-y-7" onSubmit={handleChangePassword}>
        <PasswordField
          label="Current Password"
          value={cpCurrent}
          onChange={(v) => { setCpCurrent(v); setCpError(""); setCpSuccess(""); }}
          visible={show.current}
          onToggleVisible={() => setShow((s) => ({ ...s, current: !s.current }))}
          autoComplete="current-password"
        />

        <PasswordField
          label="New Password"
          value={cpNew}
          onChange={(v) => { setCpNew(v); setCpError(""); setCpSuccess(""); }}
          visible={show.next}
          onToggleVisible={() => setShow((s) => ({ ...s, next: !s.next }))}
          autoComplete="new-password"
        >
          <div className="flex items-center gap-1.5 mt-2.5">
            <span
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                longEnough ? "bg-primary" : "bg-outline-variant"
              }`}
            />
            <span
              className={`text-[11px] font-medium transition-colors ${
                longEnough ? "text-primary" : "text-on-surface-variant"
              }`}
            >
              At least 8 characters
            </span>
          </div>
        </PasswordField>

        <PasswordField
          label="Confirm New Password"
          value={cpConfirm}
          onChange={(v) => { setCpConfirm(v); setCpError(""); setCpSuccess(""); }}
          visible={show.confirm}
          onToggleVisible={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
          autoComplete="new-password"
          invalid={mismatch}
        >
          {cpConfirm.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2.5">
              {matches ? (
                <>
                  <Check className="w-3 h-3 text-primary" />
                  <span className="text-[11px] font-medium text-primary">Passwords match</span>
                </>
              ) : (
                <>
                  <X className="w-3 h-3 text-error" />
                  <span className="text-[11px] font-medium text-error">Passwords don&apos;t match yet</span>
                </>
              )}
            </div>
          )}
        </PasswordField>

        {cpError && (
          <div className="flex items-start gap-2 px-3.5 py-2.5 bg-error-container/40 border border-error/30 rounded-xl">
            <X className="w-3.5 h-3.5 text-error mt-0.5 shrink-0" />
            <p className="text-xs font-medium text-on-error-container">{cpError}</p>
          </div>
        )}
        {cpSuccess && (
          <div className="flex items-start gap-2 px-3.5 py-2.5 bg-primary-container/15 border border-primary-container/50 rounded-xl">
            <ShieldCheck className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
            <p className="text-xs font-medium text-primary">{cpSuccess}</p>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2 border-t border-deep-navy/10">
          <button
            type="submit"
            disabled={!canSubmit}
            className="h-11 px-8 bg-primary-container text-deep-navy text-label-caps font-bold rounded-xl border-2 border-transparent hover:border-deep-navy transition-colors duration-150 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-transparent"
          >
            {cpLoading ? "Saving…" : "Update Password"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const staggerList = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } },
};

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // ── Wishlist (server-backed) ──
  const [wishlist, setWishlist] = useState<UIProduct[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(true);

  // ── Live account data ──
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loadingAccount, setLoadingAccount] = useState(true);

  // ── Orders (real) ──
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // ── Loyalty points (server-backed) ──
  const [points, setPoints] = useState<PointsSummary | null>(null);
  const [pointsLoading, setPointsLoading] = useState(true);

  // ── Activity history ──
  const [activity, setActivity] = useState<ActivityRecord[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityLoaded, setActivityLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [p, w] = await Promise.allSettled([fetchMyProfile(), fetchWallet()]);
        if (!alive) return;
        if (p.status === "fulfilled") setProfile(p.value);
        if (w.status === "fulfilled") setWallet(w.value);
      } finally {
        if (alive) setLoadingAccount(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Load real orders for the "Recent Orders" list and the Active-Orders stat.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await fetchMyOrders();
        if (alive) setOrders(data);
      } catch {
        if (alive) setOrders([]);
      } finally {
        if (alive) setOrdersLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Load the real loyalty-points summary (balance, tier, history).
  const reloadPoints = useCallback(async () => {
    try {
      const summary = await fetchPoints();
      setPoints(summary);
    } catch {
      setPoints(null);
    } finally {
      setPointsLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadPoints();
  }, [reloadPoints]);

  // Redeem points → wallet credit. Refreshes both the wallet balance shown in
  // the overview and the points summary (balance + history). Throws on failure
  // so the Rewards tab can surface the error.
  async function handleRedeemPoints(n: number) {
    const updated = await redeemPoints(n);
    setWallet((w) =>
      w
        ? { ...w, balance: updated.balance, points: updated.points }
        : updated,
    );
    await reloadPoints();
  }

  // Load the server-backed wishlist, then hydrate each id into a full product
  // so the cards can show name / price / image.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const ids = await fetchWishlist();
        const products = await Promise.all(ids.map((id) => fetchProductById(id)));
        if (alive) {
          setWishlist(products.filter((p): p is UIProduct => p !== null));
        }
      } catch {
        if (alive) setWishlist([]);
      } finally {
        if (alive) setWishlistLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const activeOrderCount = orders.filter(isActiveOrder).length;

  async function removeWish(id: string) {
    setWishlist((wl) => wl.filter((w) => w.id !== id));
    try {
      await removeFromWishlist(id);
    } catch {
      // Best-effort; a failed sync just leaves the item server-side until reload.
    }
  }

  const loadActivity = useCallback(async () => {
    const u = getUser();
    if (!u?.userId) return;
    setActivityLoading(true);
    try {
      const records = await fetchActivityHistory(u.userId, 30);
      setActivity(records);
    } finally {
      setActivityLoading(false);
      setActivityLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "activity" && !activityLoaded) loadActivity();
  }, [activeTab, activityLoaded, loadActivity]);

  function handleLogout() {
    clearTokens();
    clearLocalCart();
    router.push("/login");
  }

  // Address state (server-backed). Edits mutate the local list, then the whole
  // list is persisted via `persistAddresses` (whole-array PUT).
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [editingAddrId, setEditingAddrId] = useState<number | null>(null);
  const [addrForm, setAddrForm] = useState({ ...EMPTY_ADDR });
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await fetchAddresses();
        if (alive) setAddresses(data);
      } catch {
        if (alive) setAddresses([]);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Persist the next list to the server (best-effort) and update local state.
  function persistAddresses(next: Address[]) {
    setAddresses(next);
    saveAddresses(next).catch(() => {});
  }

  function openAddAddress() {
    setAddrForm({ ...EMPTY_ADDR });
    setEditingAddrId(null);
    setShowAddrForm(true);
  }

  function openEditAddress(addr: Address) {
    setAddrForm({
      label: addr.label,
      name: addr.name,
      line1: addr.line1,
      line2: addr.line2,
      city: addr.city,
      zip: addr.zip,
      country: addr.country,
      phone: addr.phone,
    });
    setEditingAddrId(addr.id);
    setShowAddrForm(true);
  }

  function saveAddress() {
    if (editingAddrId !== null) {
      persistAddresses(
        addresses.map((a) => (a.id === editingAddrId ? { ...a, ...addrForm } : a)),
      );
    } else {
      persistAddresses([
        ...addresses,
        { id: Date.now(), ...addrForm, isDefault: addresses.length === 0 },
      ]);
    }
    setShowAddrForm(false);
  }

  function setDefaultAddress(id: number) {
    persistAddresses(addresses.map((a) => ({ ...a, isDefault: a.id === id })));
  }

  function removeAddress(id: number) {
    persistAddresses(addresses.filter((a) => a.id !== id));
    setConfirmDeleteId(null);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">

      <main className="flex-1">
        {/* Profile hero */}
        <div className="bg-deep-navy border-b-2 border-deep-navy">
          <div className="max-w-[1280px] mx-auto px-10 py-10 flex items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center shrink-0 border-2 border-primary-container">
              <User className="w-8 h-8 text-deep-navy" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-label-caps text-ice-blue/60 uppercase tracking-widest">Welcome back</p>
              <h1 className="text-display-lg-mobile text-white capitalize">
                {loadingAccount ? "…" : profile?.name || "Your account"}
              </h1>
              <p className="text-sm text-ice-blue/70 mt-0.5">
                {profile?.email || "—"} · Member since {formatMemberSince(profile?.createdAt)}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 h-10 px-4 border border-white/20 hover:border-white/50 hover:bg-white/10 text-white/70 hover:text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all duration-150 active:scale-[0.97] shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="bg-white border-b-2 border-deep-navy sticky top-20 z-30">
          <div className="max-w-[1280px] mx-auto px-10 flex">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 h-14 px-6 text-sm font-bold uppercase tracking-widest border-b-2 -mb-[2px] transition-colors duration-150 ${
                  activeTab === tab.id
                    ? "border-primary-container text-deep-navy"
                    : "border-transparent text-on-surface-variant hover:text-deep-navy"
                }`}
              >
                {tab.icon}
                <span className="hidden sm:block">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-[1280px] mx-auto px-10 py-10">
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="space-y-10"
              >
                {/* Stats */}
                <motion.div
                  variants={staggerList}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 sm:grid-cols-3 gap-5"
                >
                  {/* Wallet balance — live */}
                  <motion.div
                    variants={fadeUp}
                    className="bg-deep-navy border-2 border-deep-navy rounded-2xl p-6 flex flex-col justify-between sm:col-span-1"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary-container/15 border-2 border-primary-container/40 rounded-xl flex items-center justify-center text-primary-container shrink-0">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-label-caps text-ice-blue/60 uppercase tracking-widest text-xs">Wallet Balance</p>
                        <p className="text-2xl font-bold text-white mt-0.5 truncate">
                          {loadingAccount ? "…" : formatVND(wallet?.balance ?? 0)}
                        </p>
                        <p className="text-xs text-ice-blue/50 mt-0.5">ShopIn Wallet</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-1.5 h-9 px-3 border border-ice-blue/20 rounded-xl text-[10px] font-medium text-ice-blue/60">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      Top-ups are added by an administrator.
                    </div>
                  </motion.div>

                  <motion.div
                    variants={fadeUp}
                    className="bg-white border-2 border-deep-navy rounded-2xl p-6 flex items-start gap-4"
                  >
                    <div className="w-12 h-12 bg-primary-container/20 border-2 border-primary-container/30 rounded-xl flex items-center justify-center text-primary shrink-0">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-label-caps text-on-surface-variant uppercase tracking-widest text-xs">Active Orders</p>
                      <p className="text-2xl font-bold text-deep-navy mt-0.5">{ordersLoading ? "…" : activeOrderCount}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">In progress</p>
                    </div>
                  </motion.div>

                  <motion.button
                    type="button"
                    variants={fadeUp}
                    onClick={() => setActiveTab("rewards")}
                    className="text-left bg-white border-2 border-deep-navy rounded-2xl p-6 flex items-start gap-4 hover:bg-surface-container-low transition-colors duration-150 group"
                  >
                    <div className="w-12 h-12 bg-primary-container/20 border-2 border-primary-container/30 rounded-xl flex items-center justify-center text-primary shrink-0">
                      <Star className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-label-caps text-on-surface-variant uppercase tracking-widest text-xs">Loyalty Points</p>
                      <p className="text-2xl font-bold text-deep-navy mt-0.5">{pointsLoading ? "…" : (points?.points ?? 0).toLocaleString()}</p>
                      <p className="text-xs text-primary font-bold mt-0.5 flex items-center gap-1">
                        {points?.tier ?? "Member"}
                        <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </p>
                    </div>
                  </motion.button>
                </motion.div>

                {/* Recent orders */}
                <div>
                  <div className="flex items-center justify-between mb-5 pb-4 border-b-2 border-deep-navy">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-deep-navy">Recent Orders</h2>
                    <Link href="/orders" className="text-xs font-bold text-primary hover:underline underline-offset-4">
                      View All
                    </Link>
                  </div>
                  {ordersLoading ? (
                    <div className="flex items-center justify-center py-12 text-on-surface-variant">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-outline-variant rounded-2xl">
                      <Package className="w-10 h-10 text-outline mx-auto mb-3" />
                      <p className="text-sm font-bold text-on-surface">No orders yet</p>
                      <p className="text-xs text-on-surface-variant mt-1">
                        When you place an order it will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.slice(0, 3).map((order) => {
                        const status = order.fulfillmentStatus;
                        const thumb = order.items?.[0]?.image;
                        const names = (order.items ?? []).map((i) => i.name).join(", ");
                        return (
                          <Link
                            key={order.orderId}
                            href={`/orders/${order.orderId}`}
                            className="flex items-center gap-5 p-5 bg-white border border-deep-navy/20 rounded-2xl hover:border-deep-navy transition-colors duration-150"
                          >
                            <div className="w-16 h-16 border border-deep-navy/20 rounded-xl overflow-hidden bg-surface-container-low shrink-0 flex items-center justify-center">
                              {thumb ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={thumb} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-6 h-6 text-outline" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-deep-navy">Order #{order.orderId.slice(-6)}</p>
                                  <p className="text-xs text-on-surface-variant mt-0.5 truncate">{names || "—"}</p>
                                </div>
                                <span className={`text-xs font-bold uppercase tracking-widest shrink-0 ${FULFILLMENT_COLOR[status]}`}>
                                  {FULFILLMENT_LABEL[status]}
                                </span>
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-on-surface-variant">{formatOrderDate(order.createdAt)}</span>
                                <span className="text-sm font-bold text-deep-navy">{formatVND(order.amount)}</span>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-on-surface-variant shrink-0" />
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Wishlist preview */}
                <div>
                  <div className="flex items-center justify-between mb-5 pb-4 border-b-2 border-deep-navy">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-deep-navy">Wishlist</h2>
                    <button onClick={() => setActiveTab("wishlist")} className="text-xs font-bold text-primary hover:underline underline-offset-4">
                      View All ({wishlist.length})
                    </button>
                  </div>
                  {wishlistLoading ? (
                    <div className="flex items-center justify-center py-12 text-on-surface-variant">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                  ) : wishlist.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-outline-variant rounded-2xl">
                      <Heart className="w-10 h-10 text-outline mx-auto mb-3" />
                      <p className="text-sm font-bold text-on-surface">Your wishlist is empty</p>
                      <p className="text-xs text-on-surface-variant mt-1">
                        Tap the heart on a product to save it here.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {wishlist.slice(0, 4).map((item) => (
                        <div key={item.id} className="group border border-deep-navy/20 rounded-2xl overflow-hidden bg-white hover:border-deep-navy transition-colors duration-150">
                          <Link href={`/products/${item.id}`} className="block aspect-square bg-surface-container-low p-6 relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                            <button
                              onClick={(e) => { e.preventDefault(); removeWish(item.id); }}
                              className="absolute top-3 right-3 w-7 h-7 bg-white border border-deep-navy/20 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:border-error hover:text-error"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </Link>
                          <div className="p-4">
                            <p className="text-xs font-bold text-deep-navy truncate">{item.name}</p>
                            <p className="text-xs text-on-surface-variant mt-0.5">{formatVND(item.price)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "activity" && (
              <motion.div
                key="activity"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: EASE }}
              >
                <div className="mb-8">
                  <div className="flex items-center gap-2.5 mb-1">
                    <div className="h-px w-6 bg-primary-container flex-shrink-0" />
                    <p className="text-label-caps text-primary">History</p>
                  </div>
                  <h2 className="text-headline-md text-deep-navy">Recent Activity</h2>
                  <p className="text-sm text-on-surface-variant mt-1">
                    Your latest product views, searches, and purchases on ShopIn.
                  </p>
                </div>
                <ActivityTab records={activity} loading={activityLoading} />
              </motion.div>
            )}

            {activeTab === "wishlist" && (
              <motion.div
                key="wishlist"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: EASE }}
              >
                <h2 className="text-headline-md text-deep-navy mb-6">Wishlist</h2>
                {wishlistLoading ? (
                  <div className="flex items-center justify-center py-20 text-on-surface-variant">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                ) : wishlist.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-outline-variant rounded-2xl">
                    <Heart className="w-10 h-10 text-outline mx-auto mb-3" />
                    <p className="text-sm font-bold text-on-surface">Your wishlist is empty</p>
                    <p className="text-xs text-on-surface-variant mt-1">
                      Tap the heart on a product to save it here.
                    </p>
                  </div>
                ) : (
                  <AnimatePresence>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                      {wishlist.map((item) => (
                        <motion.div
                          key={item.id}
                          layout
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.25 }}
                          className="group border border-deep-navy/20 rounded-2xl overflow-hidden bg-white hover:border-deep-navy transition-colors duration-150"
                        >
                          <Link href={`/products/${item.id}`} className="block aspect-square bg-surface-container-low p-6 relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                            <button
                              onClick={(e) => { e.preventDefault(); removeWish(item.id); }}
                              className="absolute top-3 right-3 w-7 h-7 bg-white border border-deep-navy/20 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:border-error hover:text-error"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </Link>
                          <div className="p-4 space-y-3">
                            <div>
                              <p className="text-sm font-bold text-deep-navy truncate">{item.name}</p>
                              <p className="text-xs text-on-surface-variant mt-0.5">{formatVND(item.price)}</p>
                            </div>
                            <Link
                              href={`/products/${item.id}`}
                              className="block text-center w-full py-2 border-t border-deep-navy/10 text-xs font-bold uppercase hover:bg-deep-navy hover:text-primary-container transition-all duration-200 active:scale-[0.97]"
                            >
                              View Product
                            </Link>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </AnimatePresence>
                )}
              </motion.div>
            )}

            {activeTab === "rewards" && (
              <motion.div
                key="rewards"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: EASE }}
              >
                <div className="mb-8">
                  <div className="flex items-center gap-2.5 mb-1">
                    <div className="h-px w-6 bg-primary-container flex-shrink-0" />
                    <p className="text-label-caps text-primary">Loyalty</p>
                  </div>
                  <h2 className="text-headline-md text-deep-navy">Rewards</h2>
                  <p className="text-sm text-on-surface-variant mt-1">
                    Earn points on every purchase and redeem them for wallet credit.
                  </p>
                </div>
                <RewardsTab
                  summary={points}
                  loading={pointsLoading}
                  onRedeem={handleRedeemPoints}
                />
              </motion.div>
            )}

            {activeTab === "vouchers" && (
              <motion.div
                key="vouchers"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: EASE }}
              >
                <div className="mb-8">
                  <div className="flex items-center gap-2.5 mb-1">
                    <div className="h-px w-6 bg-primary-container flex-shrink-0" />
                    <p className="text-label-caps text-primary">Savings</p>
                  </div>
                  <h2 className="text-headline-md text-deep-navy">My Vouchers</h2>
                  <p className="text-sm text-on-surface-variant mt-1">Your promotional codes and discount vouchers.</p>
                </div>
                <motion.div variants={staggerList} initial="hidden" animate="show">
                  <VouchersTab />
                </motion.div>
              </motion.div>
            )}

            {activeTab === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="space-y-12"
              >
                {/* ── Personal Information ── */}
                <PersonalInfoSection profile={profile} onSaved={setProfile} />

                {/* Divider */}
                <div className="h-px bg-deep-navy/10" />

                {/* ── Address Book ── */}
                <div className="space-y-7" id="address-book">
                  <div className="flex items-center justify-between pb-4 border-b-2 border-deep-navy">
                    <div className="flex items-center gap-3">
                      <div className="h-px w-6 bg-primary-container flex-shrink-0" />
                      <h2 className="text-xs font-bold uppercase tracking-widest text-deep-navy">Address Book</h2>
                    </div>
                    <button
                      onClick={openAddAddress}
                      className="flex items-center gap-2 h-9 px-4 bg-deep-navy text-primary-container text-label-caps rounded-lg hover:bg-deep-navy/80 transition-colors active:scale-[0.97]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Address
                    </button>
                  </div>

                  <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence mode="popLayout">
                      {addresses.map((addr) => (
                        <motion.div
                          key={addr.id}
                          layout
                          initial={{ opacity: 0, scale: 0.97 }}
                          animate={{ opacity: 1, scale: 1, transition: { duration: 0.3, ease: EASE } }}
                          exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                          className={`relative border-2 rounded-2xl p-5 bg-white transition-colors duration-150 ${
                            addr.isDefault
                              ? "border-primary-container"
                              : "border-deep-navy/20 hover:border-deep-navy"
                          }`}
                        >
                          {addr.isDefault && (
                            <div className="absolute top-4 right-4 flex items-center gap-1 bg-deep-navy text-primary-container px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                              <Check className="w-2.5 h-2.5" /> Default
                            </div>
                          )}

                          <div className="flex items-center gap-2 mb-3">
                            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-deep-navy">
                              {addr.label}
                            </span>
                          </div>

                          <div className="space-y-0.5 text-sm">
                            <p className="font-bold text-deep-navy">{addr.name}</p>
                            <p className="text-on-surface-variant">{addr.line1}</p>
                            {addr.line2 && <p className="text-on-surface-variant">{addr.line2}</p>}
                            <p className="text-on-surface-variant">
                              {addr.city}, {addr.zip}
                            </p>
                            <p className="text-on-surface-variant">{addr.country}</p>
                            <p className="text-xs text-on-surface-variant pt-1">{addr.phone}</p>
                          </div>

                          <div className="flex items-center gap-3 mt-4 pt-3 border-t border-deep-navy/10 text-[10px] font-bold uppercase tracking-widest">
                            <button
                              onClick={() => openEditAddress(addr)}
                              className="flex items-center gap-1 text-on-surface-variant hover:text-deep-navy transition-colors"
                            >
                              <Edit2 className="w-3 h-3" /> Edit
                            </button>
                            {!addr.isDefault && (
                              <>
                                <span className="text-outline-variant">·</span>
                                <button
                                  onClick={() => setDefaultAddress(addr.id)}
                                  className="text-primary hover:underline underline-offset-2"
                                >
                                  Set Default
                                </button>
                                <span className="text-outline-variant">·</span>
                                <button
                                  onClick={() => setConfirmDeleteId(addr.id)}
                                  className="flex items-center gap-1 text-error hover:underline underline-offset-2"
                                >
                                  <Trash2 className="w-3 h-3" /> Delete
                                </button>
                              </>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {/* Add new — dashed card */}
                    <button
                      onClick={openAddAddress}
                      className="border-2 border-dashed border-deep-navy/20 hover:border-deep-navy rounded-2xl p-5 flex flex-col items-center justify-center gap-3 min-h-[196px] transition-colors duration-150 group"
                    >
                      <div className="w-10 h-10 border-2 border-deep-navy/20 group-hover:border-deep-navy rounded-xl flex items-center justify-center transition-colors duration-150">
                        <Plus className="w-5 h-5 text-on-surface-variant" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                        Add Address
                      </span>
                    </button>
                  </motion.div>
                </div>
              </motion.div>
            )}
            {activeTab === "change-password" && (
              <motion.div
                key="change-password"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="space-y-8"
              >
                <TwoFactorToggle className="max-w-xl" />
                <ChangePasswordSection />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Sign Out strip (always visible at page bottom) ── */}
          <div className="mt-16 pt-8 border-t border-deep-navy/10 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-deep-navy">Sign out of your account</p>
              <p className="text-xs text-on-surface-variant mt-0.5">You will be redirected to the login page.</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 h-10 px-5 border-2 border-deep-navy/20 hover:border-deep-navy text-on-surface-variant hover:text-deep-navy text-xs font-bold uppercase tracking-widest rounded-xl transition-all duration-150 active:scale-[0.97]"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </main>

      {/* ── Delete Confirmation Modal ── */}
      <AnimatePresence>
        {confirmDeleteId !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setConfirmDeleteId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, ease: EASE } }}
              exit={{ opacity: 0, scale: 0.95, y: 8, transition: { duration: 0.18 } }}
              className="bg-white border-2 border-deep-navy rounded-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-headline-md text-deep-navy mb-2">Delete Address?</h2>
              <p className="text-sm text-on-surface-variant mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 h-11 border-2 border-deep-navy text-deep-navy text-label-caps font-bold rounded-xl hover:bg-surface-container transition-colors active:scale-[0.97]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => removeAddress(confirmDeleteId)}
                  className="flex-1 h-11 bg-error text-on-error text-label-caps font-bold rounded-xl active:scale-[0.97]"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Add / Edit Address Modal ── */}
      <AnimatePresence>
        {showAddrForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
            onClick={() => setShowAddrForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { duration: 0.35, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] },
              }}
              exit={{ opacity: 0, y: 24, transition: { duration: 0.2 } }}
              className="bg-white border-2 border-deep-navy rounded-2xl w-full max-w-lg overflow-y-auto"
              style={{ maxHeight: "90vh" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Dark header strip */}
              <div className="bg-deep-navy px-6 py-5 flex items-center justify-between">
                <div>
                  <p className="text-label-caps tracking-widest mb-0.5" style={{ color: "rgba(0,243,255,0.55)" }}>
                    Address Book
                  </p>
                  <h2 className="text-headline-md text-white leading-tight">
                    {editingAddrId ? "Edit Address" : "New Address"}
                  </h2>
                </div>
                <button
                  onClick={() => setShowAddrForm(false)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150"
                  style={{ border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.6)" }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Neon cyan accent line */}
              <div className="h-0.5 bg-primary-container" />

              {/* Form body */}
              <div className="px-6 py-7">
                <div className="grid grid-cols-2 gap-x-8 gap-y-7">
                  {ADDR_FIELDS.map(({ key, label, span }) => (
                    <div key={key} className={span === 2 ? "col-span-2" : ""}>
                      <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant mb-2.5">
                        {label}
                      </label>
                      <input
                        type="text"
                        value={addrForm[key]}
                        onChange={(e) => setAddrForm((f) => ({ ...f, [key]: e.target.value }))}
                        className="w-full h-11 bg-transparent text-sm font-medium text-deep-navy outline-none transition-colors duration-200"
                        style={{ borderBottom: "2px solid rgba(0,26,65,0.2)", borderTop: "none", borderLeft: "none", borderRight: "none", borderRadius: 0 }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer buttons */}
              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={() => setShowAddrForm(false)}
                  className="flex-1 h-11 border-2 border-deep-navy text-deep-navy text-label-caps font-bold rounded-xl hover:bg-surface-container transition-colors duration-150 active:scale-[0.97]"
                >
                  Cancel
                </button>
                <button
                  onClick={saveAddress}
                  className="flex-1 h-11 bg-primary-container text-deep-navy text-label-caps font-bold rounded-xl border-2 border-transparent hover:border-deep-navy transition-colors duration-150 active:scale-[0.97]"
                >
                  {editingAddrId ? "Save Changes" : "Add Address"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
