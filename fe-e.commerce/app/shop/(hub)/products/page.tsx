"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { fetchCategories } from "@/lib/support";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Plus,
  Filter,
  ChevronDown,
  Edit2,
  Trash2,
  X,
  Camera,
  Check,
  Package,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { getUser } from "@/lib/auth";
import { formatVND, type BackendProduct } from "@/lib/products";
import {
  fetchSellerInventory,
  updateInventoryQuantity,
  deleteInventory,
  createListing,
  type InventoryItem,
} from "@/lib/seller";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

type ProductStatus = "active" | "out_of_stock";

interface Row {
  inventoryId: string;
  productId: string;
  name: string;
  category: string;
  price: number;
  salePrice?: number;
  stock: number;
  status: ProductStatus;
  approval: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  image: string;
  description: string;
}

const FALLBACK_IMG = "https://placehold.co/80x80/e2e2e2/6a7a7b?text=IMG";

function toRow(inv: InventoryItem): Row {
  const p = (typeof inv.productId === "object" && inv.productId
    ? inv.productId
    : null) as BackendProduct | null;
  const price = Number(p?.price ?? 0);
  const sale = Number(p?.sale ?? 0);
  const salePrice = sale > 0 ? Math.round(price * (1 - sale / 100)) : undefined;
  const approval = (p?.status as Row["approval"]) ?? "approved";
  return {
    inventoryId: inv._id,
    productId: p?._id ?? (typeof inv.productId === "string" ? inv.productId : ""),
    name: p?.name || inv.name || "Unnamed product",
    category: p?.type || "Other",
    price,
    salePrice,
    stock: inv.quantity ?? 0,
    status: (inv.quantity ?? 0) === 0 ? "out_of_stock" : "active",
    approval,
    rejectionReason: p?.rejectionReason,
    image: p?.imageUrl?.trim() ? p.imageUrl : FALLBACK_IMG,
    description: p?.description || "",
  };
}

const SORT_OPTIONS = [
  "Name A–Z",
  "Name Z–A",
  "Price: Low–High",
  "Price: High–Low",
  "Stock: Low–High",
];

type TabId = "all" | "active" | "pending" | "rejected";
const TABS: { id: TabId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "pending", label: "Pending Approval" },
  { id: "rejected", label: "Rejected" },
];

// Fallback only — used if the admin-managed category list can't be fetched.
const TYPE_OPTIONS = [
  "Drinkware",
  "Lighting",
  "Textiles",
  "Kitchenware",
  "Decor",
  "Electronics",
  "Fashion",
  "Other",
];

interface SelectOption {
  value: string;
  label: string;
}

// Searchable, scrollable category picker. Scales to a long, admin-managed list
// without the unwieldy native <select> the seller had before.
function SearchableSelect({
  value,
  onChange,
  options,
  disabled,
  placeholder = "Select…",
}: {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = options.find((o) => o.value === value);
  const filtered = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  function close() {
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full h-11 px-4 border-2 border-deep-navy/20 rounded-xl bg-white text-sm text-on-surface focus:border-primary-container outline-none transition-colors disabled:bg-surface-container-low disabled:text-on-surface-variant disabled:cursor-not-allowed"
      >
        <span className={`truncate ${selected || value ? "text-on-surface" : "text-outline"}`}>
          {selected ? selected.label : value || placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-outline shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && !disabled && (
        <>
          {/* click-away catcher */}
          <div className="fixed inset-0 z-[60]" onClick={close} />
          <div className="absolute z-[61] mt-1.5 w-full bg-white border-2 border-deep-navy rounded-xl shadow-xl overflow-hidden">
            <div className="p-2 border-b border-outline-variant">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-outline" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search categories…"
                  className="w-full h-9 pl-8 pr-3 border-2 border-deep-navy/15 rounded-lg bg-surface-container-low text-sm outline-none focus:border-primary-container"
                />
              </div>
            </div>
            <div className="max-h-52 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <p className="px-4 py-3 text-xs text-on-surface-variant text-center">
                  No matching category.
                </p>
              ) : (
                filtered.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => {
                      onChange(o.value);
                      close();
                    }}
                    className={`flex items-center justify-between w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-surface-container-low ${
                      o.value === value
                        ? "text-deep-navy font-semibold bg-primary-container/15"
                        : "text-on-surface"
                    }`}
                  >
                    <span className="truncate">{o.label}</span>
                    {o.value === value && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Drawer for create (full product) / edit (stock only — no backend product-edit).
interface DrawerState {
  mode: "create" | "edit";
  inventoryId?: string;
  name: string;
  category: string;
  description: string;
  price: string;
  stock: string;
  imageMode: "upload" | "url";
  imageFile: File | null;
  imageUrl: string;
  imagePreview: string;
}

const EMPTY_DRAWER: DrawerState = {
  mode: "create",
  name: "",
  category: "Drinkware",
  description: "",
  price: "",
  stock: "",
  imageMode: "upload",
  imageFile: null,
  imageUrl: "",
  imagePreview: "",
};

export default function ProductsPage() {
  const [sellerId, setSellerId] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [sortBy, setSortBy] = useState("Name A–Z");

  // Admin-managed categories drive the create form. `value` is the catalog
  // `type` string (productType) stored on the product; `label` is shown to the
  // seller. Falls back to the static list if the support service is unreachable.
  const [categoryOptions, setCategoryOptions] = useState<SelectOption[]>(
    TYPE_OPTIONS.map((t) => ({ value: t, label: t })),
  );

  const [showDrawer, setShowDrawer] = useState(false);
  const [drawer, setDrawer] = useState<DrawerState>(EMPTY_DRAWER);
  const [drawerError, setDrawerError] = useState("");
  const [drawerSaving, setDrawerSaving] = useState(false);
  const [drawerSaved, setDrawerSaved] = useState(false);

  const [deleteRow, setDeleteRow] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async (sid: string) => {
    setLoading(true);
    setLoadError("");
    try {
      const inv = await fetchSellerInventory(sid);
      setRows(inv.map(toRow));
    } catch (err: unknown) {
      setLoadError((err as { message?: string })?.message ?? "Couldn't load your products.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const u = getUser();
    if (!u?.userId) { setLoading(false); setLoadError("Not signed in."); return; }
    setSellerId(u.userId);
    load(u.userId);
  }, [load]);

  // Pull the live, admin-managed category list once on mount.
  useEffect(() => {
    (async () => {
      try {
        const cats = await fetchCategories();
        if (cats.length) {
          setCategoryOptions(
            cats.map((c) => ({ value: c.productType || c.label, label: c.label })),
          );
        }
      } catch {
        /* keep the TYPE_OPTIONS fallback */
      }
    })();
  }, []);

  function openCreate() {
    setDrawer({
      ...EMPTY_DRAWER,
      mode: "create",
      category: categoryOptions[0]?.value ?? "",
    });
    setDrawerError("");
    setDrawerSaved(false);
    setShowDrawer(true);
  }

  function openEdit(r: Row) {
    setDrawer({
      mode: "edit",
      inventoryId: r.inventoryId,
      name: r.name,
      category: r.category,
      description: r.description,
      price: String(r.price),
      stock: String(r.stock),
      imageMode: "upload",
      imageFile: null,
      imageUrl: "",
      imagePreview: r.image,
    });
    setDrawerError("");
    setDrawerSaved(false);
    setShowDrawer(true);
  }

  function onPickImage(file: File | null) {
    if (!file) {
      setDrawer((d) => ({ ...d, imageFile: null, imagePreview: "" }));
      return;
    }
    const preview = URL.createObjectURL(file);
    setDrawer((d) => ({ ...d, imageFile: file, imagePreview: preview }));
  }

  function onPickImageUrl(url: string) {
    // Live-preview the pasted URL; the <img> onError handles bad links.
    setDrawer((d) => ({ ...d, imageUrl: url, imagePreview: url.trim() }));
  }

  function setImageMode(mode: "upload" | "url") {
    // Switching source clears the other source's preview to avoid confusion.
    setDrawer((d) => ({
      ...d,
      imageMode: mode,
      imageFile: null,
      imageUrl: "",
      imagePreview: mode === "url" ? "" : "",
    }));
  }

  async function handleSaveDrawer() {
    setDrawerError("");
    if (drawer.mode === "edit") {
      // Backend only supports updating the stock quantity for an existing listing.
      const qty = parseInt(drawer.stock, 10);
      if (isNaN(qty) || qty < 0) { setDrawerError("Enter a valid stock quantity."); return; }
      setDrawerSaving(true);
      try {
        await updateInventoryQuantity(drawer.inventoryId!, qty);
        setRows((prev) =>
          prev.map((r) =>
            r.inventoryId === drawer.inventoryId
              ? { ...r, stock: qty, status: qty === 0 ? "out_of_stock" : "active" }
              : r,
          ),
        );
        setDrawerSaved(true);
        setTimeout(() => setShowDrawer(false), 700);
      } catch (err: unknown) {
        setDrawerError((err as { message?: string })?.message ?? "Couldn't update stock.");
      } finally {
        setDrawerSaving(false);
      }
      return;
    }

    // Create flow
    const price = parseFloat(drawer.price);
    const stock = parseInt(drawer.stock, 10);
    if (!drawer.name.trim()) { setDrawerError("Product name is required."); return; }
    if (!drawer.description.trim()) { setDrawerError("Description is required."); return; }
    if (isNaN(price) || price <= 0) { setDrawerError("Enter a valid price."); return; }
    if (isNaN(stock) || stock < 1) { setDrawerError("Initial stock must be at least 1."); return; }
    // Image is optional. If the URL mode is used with a non-empty value, sanity-check it.
    const trimmedUrl = drawer.imageUrl.trim();
    if (drawer.imageMode === "url" && trimmedUrl && !/^https?:\/\//i.test(trimmedUrl)) {
      setDrawerError("Image URL must start with http:// or https://.");
      return;
    }

    setDrawerSaving(true);
    try {
      await createListing(sellerId, {
        name: drawer.name.trim(),
        description: drawer.description.trim(),
        price,
        type: drawer.category,
        quantity: stock,
        image: drawer.imageMode === "upload" ? drawer.imageFile ?? undefined : undefined,
        imageUrl: drawer.imageMode === "url" ? trimmedUrl || undefined : undefined,
      });
      setDrawerSaved(true);
      await load(sellerId);
      setTimeout(() => setShowDrawer(false), 700);
    } catch (err: unknown) {
      setDrawerError((err as { message?: string })?.message ?? "Couldn't create product.");
    } finally {
      setDrawerSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteRow) return;
    setDeleting(true);
    try {
      await deleteInventory(deleteRow.inventoryId);
      setRows((prev) => prev.filter((r) => r.inventoryId !== deleteRow.inventoryId));
      setDeleteRow(null);
    } catch {
      // keep modal open on failure
    } finally {
      setDeleting(false);
    }
  }

  const categories = useMemo(() => {
    const set = new Set(rows.map((r) => r.category).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [rows]);

  const filtered = useMemo(() => {
    return rows
      .filter((r) => (activeTab === "all" ? true : r.approval === activeTab))
      .filter((r) => filterCategory === "All" || r.category === filterCategory)
      .filter(
        (r) =>
          search === "" ||
          r.name.toLowerCase().includes(search.toLowerCase()),
      )
      .sort((a, b) => {
        if (sortBy === "Name A–Z") return a.name.localeCompare(b.name);
        if (sortBy === "Name Z–A") return b.name.localeCompare(a.name);
        if (sortBy === "Price: Low–High") return a.price - b.price;
        if (sortBy === "Price: High–Low") return b.price - a.price;
        if (sortBy === "Stock: Low–High") return a.stock - b.stock;
        return 0;
      });
  }, [rows, activeTab, filterCategory, search, sortBy]);

  const tabCounts: Record<TabId, number> = {
    all: rows.length,
    active: rows.filter((r) => r.approval === "approved").length,
    pending: rows.filter((r) => r.approval === "pending").length,
    rejected: rows.filter((r) => r.approval === "rejected").length,
  };

  return (
    <>
      <div className="p-6 lg:p-8 max-w-[1200px] mx-auto w-full">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-px w-5 bg-primary-container" />
              <p className="text-label-caps text-primary">Inventory</p>
            </div>
            <h1 className="text-2xl font-bold text-deep-navy tracking-tight">
              Product Management
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => sellerId && load(sellerId)}
              className="flex items-center gap-2 h-10 px-4 border-2 border-deep-navy/20 text-deep-navy text-sm font-bold rounded-xl hover:border-deep-navy active:scale-[0.97] transition-all duration-150"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 h-10 px-5 bg-primary-container text-deep-navy text-sm font-bold rounded-xl border-2 border-transparent hover:border-deep-navy active:scale-[0.97] transition-all duration-150"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-0.5 bg-white border-2 border-deep-navy rounded-xl overflow-hidden mb-5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition-all duration-150 ${
                activeTab === tab.id
                  ? "bg-deep-navy text-white"
                  : "text-on-surface-variant hover:text-deep-navy hover:bg-surface-container-low"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-surface-container text-on-surface-variant"
                }`}
              >
                {tabCounts[tab.id]}
              </span>
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name…"
              className="w-full h-10 pl-10 pr-4 border-2 border-deep-navy/20 rounded-xl bg-white text-sm text-on-surface placeholder:text-outline focus:border-primary-container outline-none transition-colors"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-outline" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="h-10 pl-8 pr-8 border-2 border-deep-navy/20 rounded-xl bg-white text-sm text-on-surface focus:border-primary-container outline-none appearance-none cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-outline pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-10 px-4 pr-8 border-2 border-deep-navy/20 rounded-xl bg-white text-sm text-on-surface focus:border-primary-container outline-none appearance-none cursor-pointer"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-outline pointer-events-none" />
          </div>
        </div>

        {/* Products table */}
        <motion.div layout className="bg-white border-2 border-deep-navy rounded-xl overflow-hidden">
          {loading ? (
            <div className="py-16 flex flex-col items-center text-center text-on-surface-variant">
              <Loader2 className="w-7 h-7 animate-spin mb-3" />
              <p className="text-sm">Loading your products…</p>
            </div>
          ) : loadError ? (
            <div className="py-16 flex flex-col items-center text-center">
              <AlertTriangle className="w-9 h-9 text-amber-500 mb-3" />
              <p className="font-semibold text-on-surface">{loadError}</p>
              <button
                onClick={() => sellerId && load(sellerId)}
                className="mt-3 text-sm font-bold text-primary hover:underline"
              >
                Try again
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 flex flex-col items-center text-center">
              <Package className="w-10 h-10 text-outline mb-3" />
              <p className="font-semibold text-on-surface">No products found</p>
              <p className="text-sm text-on-surface-variant mt-1">
                {rows.length === 0
                  ? "Add your first product to start selling."
                  : "Try adjusting your filters."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant">
                    {["Product", "Category", "Price", "Stock", "Approval", "Actions"].map((h) => (
                      <th
                        key={h}
                        className="text-left text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-4 py-3 first:pl-5"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <AnimatePresence initial={false}>
                  <tbody className="divide-y divide-outline-variant">
                    {filtered.map((r) => (
                      <motion.tr
                        key={r.inventoryId}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, ease: EASE }}
                        className="hover:bg-surface-container-low transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={r.image}
                              alt={r.name}
                              className="w-10 h-10 rounded-lg object-cover border border-outline-variant shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = FALLBACK_IMG;
                              }}
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-deep-navy truncate max-w-[180px] capitalize">
                                {r.name}
                              </p>
                              <p className="text-[10px] text-on-surface-variant font-mono truncate max-w-[180px]">
                                {r.productId.slice(-8)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-on-surface-variant capitalize">
                          {r.category}
                        </td>
                        <td className="px-4 py-3.5">
                          <div>
                            <span className="text-sm font-bold text-deep-navy">
                              {formatVND(r.salePrice ?? r.price)}
                            </span>
                            {r.salePrice !== undefined && (
                              <span className="ml-1.5 text-xs text-outline line-through">
                                {formatVND(r.price)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`text-sm font-semibold ${
                              r.stock === 0
                                ? "text-red-600"
                                : r.stock <= 5
                                ? "text-amber-600"
                                : "text-on-surface"
                            }`}
                          >
                            {r.stock === 0 ? "—" : r.stock}
                          </span>
                          {r.stock > 0 && r.stock <= 5 && (
                            <AlertTriangle className="inline w-3 h-3 text-amber-500 ml-1" />
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          {r.approval === "approved" ? (
                            <span className="text-[10px] font-bold px-2 py-1 rounded-full border bg-primary/10 text-primary border-primary/20">
                              {r.status === "out_of_stock" ? "Out of Stock" : "Active"}
                            </span>
                          ) : r.approval === "pending" ? (
                            <span className="text-[10px] font-bold px-2 py-1 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                              Waiting Approval
                            </span>
                          ) : (
                            <span
                              title={r.rejectionReason || "Rejected"}
                              className="text-[10px] font-bold px-2 py-1 rounded-full border bg-red-50 text-red-700 border-red-200 cursor-help"
                            >
                              Rejected
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEdit(r)}
                              className="p-1.5 rounded-lg text-on-surface-variant hover:text-deep-navy hover:bg-surface-container transition-colors"
                              title="Update stock"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteRow(r)}
                              className="p-1.5 rounded-lg text-on-surface-variant hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </AnimatePresence>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteRow && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => !deleting && setDeleteRow(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: EASE }}
              className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-deep-navy rounded-2xl p-6 w-[340px] shadow-2xl"
            >
              <div className="w-10 h-10 bg-red-50 border border-red-200 rounded-xl flex items-center justify-center mb-4">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="font-bold text-deep-navy mb-1">Delete Listing?</h3>
              <p className="text-sm text-on-surface-variant mb-5">
                This removes <span className="font-semibold capitalize">{deleteRow.name}</span> from your store. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteRow(null)}
                  disabled={deleting}
                  className="flex-1 h-10 border-2 border-deep-navy/20 rounded-xl text-sm font-semibold text-on-surface-variant hover:border-deep-navy transition-colors disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-1 h-10 bg-red-600 border-2 border-transparent text-white text-sm font-bold rounded-xl hover:bg-red-700 active:scale-[0.97] transition-all disabled:opacity-60"
                >
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Product drawer */}
      <AnimatePresence>
        {showDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => !drawerSaving && setShowDrawer(false)}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.35, ease: EASE }}
              className="fixed top-0 right-0 z-50 h-full w-full sm:w-[480px] bg-white border-l-2 border-deep-navy flex flex-col"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-6 py-5 border-b-2 border-deep-navy shrink-0">
                <div>
                  <p className="text-label-caps text-primary mb-0.5">
                    {drawer.mode === "edit" ? "Update Stock" : "Create"}
                  </p>
                  <h2 className="font-bold text-deep-navy">
                    {drawer.mode === "edit" ? "Update Stock" : "New Product"}
                  </h2>
                </div>
                <button
                  onClick={() => setShowDrawer(false)}
                  className="p-2 rounded-lg text-on-surface-variant hover:text-deep-navy hover:bg-surface-container transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                {drawer.mode === "edit" && (
                  <div className="p-3 bg-surface-container-low border border-outline-variant rounded-xl text-xs text-on-surface-variant leading-relaxed">
                    Only stock quantity can be changed for an existing listing.
                    To change product details, delete and re-create the listing.
                  </div>
                )}

                {/* Image */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant mb-2.5">
                    Product Image
                  </label>
                  <div className="flex gap-3 items-start">
                    <div className="w-20 h-20 rounded-xl border-2 border-deep-navy/20 overflow-hidden shrink-0 bg-surface-container-low flex items-center justify-center">
                      {drawer.imagePreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={drawer.imagePreview}
                          alt="preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = FALLBACK_IMG;
                          }}
                        />
                      ) : (
                        <Camera className="w-5 h-5 text-outline" />
                      )}
                    </div>
                    {drawer.mode === "create" ? (
                      <div className="flex-1 space-y-2.5">
                        {/* Source toggle */}
                        <div className="flex gap-0.5 bg-surface-container-low border-2 border-deep-navy/20 rounded-lg p-0.5">
                          {(["upload", "url"] as const).map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setImageMode(m)}
                              className={`flex-1 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md transition-colors ${
                                drawer.imageMode === m
                                  ? "bg-primary-container text-deep-navy"
                                  : "text-on-surface-variant hover:text-deep-navy"
                              }`}
                            >
                              {m === "upload" ? "Upload" : "Image URL"}
                            </button>
                          ))}
                        </div>

                        {drawer.imageMode === "upload" ? (
                          <input
                            key="image-upload"
                            type="file"
                            accept="image/*"
                            onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
                            className="block w-full text-xs text-on-surface file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-2 file:border-deep-navy file:bg-white file:text-xs file:font-bold file:text-deep-navy hover:file:bg-surface-container cursor-pointer"
                          />
                        ) : (
                          <input
                            key="image-url"
                            type="url"
                            value={drawer.imageUrl}
                            onChange={(e) => onPickImageUrl(e.target.value)}
                            placeholder="https://example.com/photo.jpg"
                            className="block w-full h-10 px-3 border-2 border-deep-navy/20 rounded-lg bg-white text-xs text-on-surface placeholder:text-outline focus:border-primary-container outline-none transition-colors"
                          />
                        )}
                        <p className="text-[11px] text-on-surface-variant leading-snug">
                          Optional — a placeholder is used if left empty.
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant mb-2">
                    Product Name {drawer.mode === "create" && "*"}
                  </label>
                  <input
                    type="text"
                    value={drawer.name}
                    disabled={drawer.mode === "edit"}
                    onChange={(e) => setDrawer((d) => ({ ...d, name: e.target.value }))}
                    placeholder="e.g. V60 Ceramic Dripper"
                    className="block w-full h-11 px-4 border-2 border-deep-navy/20 rounded-xl bg-white text-sm text-on-surface placeholder:text-outline focus:border-primary-container outline-none transition-colors disabled:bg-surface-container-low disabled:text-on-surface-variant disabled:cursor-not-allowed"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant mb-2">
                    Category
                  </label>
                  <SearchableSelect
                    value={drawer.category}
                    disabled={drawer.mode === "edit"}
                    options={categoryOptions}
                    onChange={(v) => setDrawer((d) => ({ ...d, category: v }))}
                    placeholder="Select a category…"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant mb-2">
                    Description {drawer.mode === "create" && "*"}
                  </label>
                  <textarea
                    value={drawer.description}
                    disabled={drawer.mode === "edit"}
                    onChange={(e) => setDrawer((d) => ({ ...d, description: e.target.value }))}
                    rows={3}
                    placeholder="Describe your product…"
                    className="block w-full px-4 py-3 border-2 border-deep-navy/20 rounded-xl bg-white text-sm text-on-surface placeholder:text-outline focus:border-primary-container outline-none transition-colors resize-none leading-relaxed disabled:bg-surface-container-low disabled:text-on-surface-variant disabled:cursor-not-allowed"
                  />
                </div>

                {/* Price + Stock */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant mb-2">
                      Price (₫) {drawer.mode === "create" && "*"}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={drawer.price}
                      disabled={drawer.mode === "edit"}
                      onChange={(e) => setDrawer((d) => ({ ...d, price: e.target.value }))}
                      placeholder="0"
                      className="block w-full h-11 px-4 border-2 border-deep-navy/20 rounded-xl bg-white text-sm text-on-surface focus:border-primary-container outline-none transition-colors disabled:bg-surface-container-low disabled:text-on-surface-variant disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant mb-2">
                      Stock Qty {drawer.mode === "create" ? "*" : ""}
                    </label>
                    <input
                      type="number"
                      min={drawer.mode === "create" ? 1 : 0}
                      value={drawer.stock}
                      onChange={(e) => setDrawer((d) => ({ ...d, stock: e.target.value }))}
                      placeholder={drawer.mode === "create" ? "1" : "0"}
                      className="block w-full h-11 px-4 border-2 border-deep-navy/20 rounded-xl bg-white text-sm text-on-surface focus:border-primary-container outline-none transition-colors"
                    />
                  </div>
                </div>

                {drawerError && (
                  <p className="text-xs font-medium text-error">{drawerError}</p>
                )}
              </div>

              {/* Drawer footer */}
              <div className="border-t-2 border-deep-navy px-6 py-4 flex gap-3 shrink-0 bg-white">
                <button
                  onClick={() => setShowDrawer(false)}
                  disabled={drawerSaving}
                  className="flex-1 h-11 border-2 border-deep-navy/20 rounded-xl text-sm font-semibold text-on-surface-variant hover:border-deep-navy transition-colors disabled:opacity-60"
                >
                  Cancel
                </button>
                <motion.button
                  onClick={handleSaveDrawer}
                  disabled={drawerSaving}
                  animate={drawerSaved ? { backgroundColor: "#001a41" } : { backgroundColor: "#00f3ff" }}
                  transition={{ duration: 0.25, ease: EASE }}
                  className="flex-1 h-11 rounded-xl text-sm font-bold border-2 border-transparent hover:border-deep-navy active:scale-[0.97] transition-all duration-150 disabled:opacity-70"
                >
                  <AnimatePresence mode="wait">
                    {drawerSaved ? (
                      <motion.span
                        key="saved"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="flex items-center justify-center gap-2 text-primary-container"
                      >
                        <Check className="w-4 h-4" />
                        Saved!
                      </motion.span>
                    ) : (
                      <motion.span
                        key="save"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="flex items-center justify-center gap-2 text-deep-navy"
                      >
                        {drawerSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                        {drawer.mode === "edit"
                          ? drawerSaving ? "Saving…" : "Update Stock"
                          : drawerSaving ? "Creating…" : "Create Product"}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
