"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Plus,
  Filter,
  ChevronDown,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  X,
  Camera,
  Check,
  Package,
  AlertTriangle,
} from "lucide-react";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

type ProductStatus = "active" | "out_of_stock" | "pending" | "hidden";

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  salePrice?: number;
  stock: number;
  status: ProductStatus;
  image: string;
}

const INITIAL_PRODUCTS: Product[] = [
  { id: "p1", name: "V60 Ceramic Dripper", sku: "SKU-001", category: "Drinkware", price: 145, stock: 12, status: "active", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDuYPHC5ZucXkMLQdPzRtMwA5fwVf4vodbpXzIAj1S6x4XKjM2fAlF7-u-Z-AU3MWyNLivbqT5NJVyhECEfYebs0h9qutzgtz955zo46r6UKJ_32aNcoy_7_fNGgqJzQY7CDeFPibKGTiQOwhV3lPfA9eC6I9W4_XCDYFh4FgdiwfC_x7VTV8hox8fmMw3BIDeUe8i7OCB11qcswwjZTdPA83Cj2SJY5IbVEXpLsg6dQg6vLyyj5o-lN_LUe6-ocebtxqygqhHLieN3" },
  { id: "p2", name: "Cylindrical Tumbler Set", sku: "SKU-002", category: "Drinkware", price: 64, stock: 8, status: "active", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAgZgxJBL_cQBXBw5VzGLXPpgE5RrL1cjMbWzL19VtO-XmfNNZV1pTCD8rc39nQXx99rcFwYIBT_DXnucwl9RgW8yKfo4HhdOSq_L0oCSntd6PaPXphuxOKKyW1xWwfBGwb72fuxp_0uPUaDG4DJGiKGwxMoyC3d6Miv61WWKFUAWGd3H-IlEY28QsPuHJioAksGYxaOHKRI2Qg3AG52p3ws5sxT3xorquBUeftVmdxuHfT73crxvuynz2znqMFjVdss1scuZQ8o4Nz" },
  { id: "p3", name: "Task Lamp T-1", sku: "SKU-019", category: "Lighting", price: 280, stock: 4, status: "active", image: "https://placehold.co/80x80/e2e2e2/6a7a7b?text=Lamp" },
  { id: "p4", name: "Wool Throw Blanket", sku: "SKU-031", category: "Textiles", price: 189, stock: 0, status: "out_of_stock", image: "https://placehold.co/80x80/e2e2e2/6a7a7b?text=Blanket" },
  { id: "p5", name: "Ceramic Serving Bowl", sku: "SKU-012", category: "Kitchenware", price: 98, stock: 15, status: "active", image: "https://placehold.co/80x80/e2e2e2/6a7a7b?text=Bowl" },
  { id: "p6", name: "Copper Pour-Over Set", sku: "SKU-008", category: "Drinkware", price: 220, salePrice: 180, stock: 1, status: "active", image: "https://placehold.co/80x80/e2e2e2/6a7a7b?text=Pour" },
  { id: "p7", name: "Linen Pillow Cover", sku: "SKU-044", category: "Textiles", price: 45, stock: 32, status: "active", image: "https://placehold.co/80x80/e2e2e2/6a7a7b?text=Pillow" },
  { id: "p8", name: "Bamboo Cutting Board", sku: "SKU-025", category: "Kitchenware", price: 75, stock: 0, status: "out_of_stock", image: "https://placehold.co/80x80/e2e2e2/6a7a7b?text=Board" },
  { id: "p9", name: "Stone Coasters Set", sku: "SKU-037", category: "Decor", price: 55, stock: 22, status: "hidden", image: "https://placehold.co/80x80/e2e2e2/6a7a7b?text=Coasters" },
  { id: "p10", name: "Nordic Wall Clock", sku: "SKU-052", category: "Decor", price: 175, stock: 7, status: "pending", image: "https://placehold.co/80x80/e2e2e2/6a7a7b?text=Clock" },
  { id: "p11", name: "Glass Carafe 1L", sku: "SKU-015", category: "Drinkware", price: 88, stock: 0, status: "out_of_stock", image: "https://placehold.co/80x80/e2e2e2/6a7a7b?text=Carafe" },
  { id: "p12", name: "Linen Table Runner", sku: "SKU-061", category: "Textiles", price: 68, stock: 11, status: "pending", image: "https://placehold.co/80x80/e2e2e2/6a7a7b?text=Runner" },
];

const CATEGORIES = ["All", "Drinkware", "Lighting", "Textiles", "Kitchenware", "Decor"];
const SORT_OPTIONS = ["Name A–Z", "Name Z–A", "Price: Low–High", "Price: High–Low", "Stock: Low–High"];

type TabId = "all" | "active" | "out_of_stock" | "pending" | "hidden";
const TABS: { id: TabId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "out_of_stock", label: "Out of Stock" },
  { id: "pending", label: "Pending" },
  { id: "hidden", label: "Hidden" },
];

const STATUS_BADGE: Record<ProductStatus, string> = {
  active: "bg-primary/10 text-primary border-primary/20",
  out_of_stock: "bg-red-50 text-red-700 border-red-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  hidden: "bg-surface-container text-on-surface-variant border-outline-variant",
};

const STATUS_LABEL: Record<ProductStatus, string> = {
  active: "Active",
  out_of_stock: "Out of Stock",
  pending: "Pending",
  hidden: "Hidden",
};

interface DrawerProduct {
  id?: string;
  name: string;
  category: string;
  description: string;
  price: string;
  salePrice: string;
  stock: string;
  status: ProductStatus;
  images: string[];
}

const EMPTY_DRAWER: DrawerProduct = {
  name: "",
  category: "Drinkware",
  description: "",
  price: "",
  salePrice: "",
  stock: "",
  status: "active",
  images: ["", "", "", "", ""],
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [sortBy, setSortBy] = useState("Name A–Z");
  const [showDrawer, setShowDrawer] = useState(false);
  const [drawerProduct, setDrawerProduct] = useState<DrawerProduct>(EMPTY_DRAWER);
  const [drawerSaved, setDrawerSaved] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function openCreate() {
    setDrawerProduct(EMPTY_DRAWER);
    setDrawerSaved(false);
    setShowDrawer(true);
  }

  function openEdit(p: Product) {
    setDrawerProduct({
      id: p.id,
      name: p.name,
      category: p.category,
      description: "",
      price: String(p.price),
      salePrice: p.salePrice ? String(p.salePrice) : "",
      stock: String(p.stock),
      status: p.status,
      images: [p.image, "", "", "", ""],
    });
    setDrawerSaved(false);
    setShowDrawer(true);
  }

  function handleSaveProduct() {
    if (!drawerProduct.name || !drawerProduct.price) return;
    const price = parseFloat(drawerProduct.price) || 0;
    const stock = parseInt(drawerProduct.stock) || 0;
    const mainImage = drawerProduct.images[0] || "https://placehold.co/80x80/e2e2e2/6a7a7b?text=IMG";

    if (drawerProduct.id) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === drawerProduct.id
            ? { ...p, name: drawerProduct.name, category: drawerProduct.category, price, stock, status: stock === 0 ? "out_of_stock" : drawerProduct.status, salePrice: drawerProduct.salePrice ? parseFloat(drawerProduct.salePrice) : undefined, image: mainImage }
            : p
        )
      );
    } else {
      const newId = `p${Date.now()}`;
      setProducts((prev) => [
        {
          id: newId,
          name: drawerProduct.name,
          sku: `SKU-${Math.floor(Math.random() * 900 + 100)}`,
          category: drawerProduct.category,
          price,
          salePrice: drawerProduct.salePrice ? parseFloat(drawerProduct.salePrice) : undefined,
          stock,
          status: stock === 0 ? "out_of_stock" : drawerProduct.status,
          image: mainImage,
        },
        ...prev,
      ]);
    }
    setDrawerSaved(true);
    setTimeout(() => setShowDrawer(false), 800);
  }

  function handleDelete(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setDeleteId(null);
  }

  function toggleVisibility(id: string) {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status: p.status === "hidden" ? "active" : "hidden" }
          : p
      )
    );
  }

  const filtered = products
    .filter((p) => {
      if (activeTab === "out_of_stock") return p.status === "out_of_stock";
      if (activeTab !== "all") return p.status === activeTab;
      return true;
    })
    .filter((p) => filterCategory === "All" || p.category === filterCategory)
    .filter((p) =>
      search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "Name A–Z") return a.name.localeCompare(b.name);
      if (sortBy === "Name Z–A") return b.name.localeCompare(a.name);
      if (sortBy === "Price: Low–High") return a.price - b.price;
      if (sortBy === "Price: High–Low") return b.price - a.price;
      if (sortBy === "Stock: Low–High") return a.stock - b.stock;
      return 0;
    });

  const tabCounts: Record<TabId, number> = {
    all: products.length,
    active: products.filter((p) => p.status === "active").length,
    out_of_stock: products.filter((p) => p.status === "out_of_stock").length,
    pending: products.filter((p) => p.status === "pending").length,
    hidden: products.filter((p) => p.status === "hidden").length,
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
          <button
            onClick={openCreate}
            className="flex items-center gap-2 h-10 px-5 bg-primary-container text-deep-navy text-sm font-bold rounded-xl border-2 border-transparent hover:border-deep-navy active:scale-[0.97] transition-all duration-150"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
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
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
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
              placeholder="Search by name or SKU…"
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
              {CATEGORIES.map((c) => (
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
        <motion.div
          layout
          className="bg-white border-2 border-deep-navy rounded-xl overflow-hidden"
        >
          {filtered.length === 0 ? (
            <div className="py-16 flex flex-col items-center text-center">
              <Package className="w-10 h-10 text-outline mb-3" />
              <p className="font-semibold text-on-surface">No products found</p>
              <p className="text-sm text-on-surface-variant mt-1">
                Try adjusting your filters or add a new product
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant">
                    {["Product", "Category", "Price", "Stock", "Status", "Actions"].map((h) => (
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
                    {filtered.map((product) => (
                      <motion.tr
                        key={product.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, ease: EASE }}
                        className="hover:bg-surface-container-low transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-10 h-10 rounded-lg object-cover border border-outline-variant shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "https://placehold.co/40x40/e2e2e2/6a7a7b?text=IMG";
                              }}
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-deep-navy truncate max-w-[160px]">
                                {product.name}
                              </p>
                              <p className="text-[10px] text-on-surface-variant font-mono">
                                {product.sku}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-on-surface-variant">
                          {product.category}
                        </td>
                        <td className="px-4 py-3.5">
                          <div>
                            <span className="text-sm font-bold text-deep-navy">
                              ${product.salePrice ?? product.price}
                            </span>
                            {product.salePrice && (
                              <span className="ml-1.5 text-xs text-outline line-through">
                                ${product.price}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`text-sm font-semibold ${
                              product.stock === 0
                                ? "text-red-600"
                                : product.stock <= 5
                                ? "text-amber-600"
                                : "text-on-surface"
                            }`}
                          >
                            {product.stock === 0 ? "—" : product.stock}
                          </span>
                          {product.stock > 0 && product.stock <= 5 && (
                            <AlertTriangle className="inline w-3 h-3 text-amber-500 ml-1" />
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-1 rounded-full border ${STATUS_BADGE[product.status]}`}
                          >
                            {STATUS_LABEL[product.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEdit(product)}
                              className="p-1.5 rounded-lg text-on-surface-variant hover:text-deep-navy hover:bg-surface-container transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => toggleVisibility(product.id)}
                              className="p-1.5 rounded-lg text-on-surface-variant hover:text-deep-navy hover:bg-surface-container transition-colors"
                              title={product.status === "hidden" ? "Show" : "Hide"}
                            >
                              {product.status === "hidden" ? (
                                <Eye className="w-3.5 h-3.5" />
                              ) : (
                                <EyeOff className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => setDeleteId(product.id)}
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
              className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-deep-navy rounded-2xl p-6 w-[340px] shadow-2xl"
            >
              <div className="w-10 h-10 bg-red-50 border border-red-200 rounded-xl flex items-center justify-center mb-4">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="font-bold text-deep-navy mb-1">Delete Product?</h3>
              <p className="text-sm text-on-surface-variant mb-5">
                This action cannot be undone. The product will be permanently removed from your store.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 h-10 border-2 border-deep-navy/20 rounded-xl text-sm font-semibold text-on-surface-variant hover:border-deep-navy transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteId)}
                  className="flex-1 h-10 bg-red-600 border-2 border-transparent text-white text-sm font-bold rounded-xl hover:bg-red-700 active:scale-[0.97] transition-all"
                >
                  Delete
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
              onClick={() => setShowDrawer(false)}
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
                    {drawerProduct.id ? "Edit" : "Create"}
                  </p>
                  <h2 className="font-bold text-deep-navy">
                    {drawerProduct.id ? "Edit Product" : "New Product"}
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
                {/* Image slots */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant mb-2.5">
                    Product Images
                    <span className="ml-2 font-normal text-outline normal-case tracking-normal">
                      paste image URLs · up to 5
                    </span>
                  </label>
                  <div className="space-y-2.5">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex gap-2.5 items-center">
                        <div className="w-14 h-14 rounded-xl border-2 border-deep-navy/20 overflow-hidden shrink-0 bg-surface-container-low flex items-center justify-center">
                          {drawerProduct.images[i] ? (
                            <img
                              src={drawerProduct.images[i]}
                              alt={`Image ${i + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <Camera className="w-4 h-4 text-outline" />
                          )}
                        </div>
                        <div className="flex-1 relative">
                          <input
                            type="url"
                            value={drawerProduct.images[i]}
                            onChange={(e) =>
                              setDrawerProduct((p) => {
                                const imgs = [...p.images];
                                imgs[i] = e.target.value;
                                return { ...p, images: imgs };
                              })
                            }
                            placeholder={i === 0 ? "Main image URL…" : `Additional image ${i + 1} URL…`}
                            className="block w-full h-10 px-3 border-2 border-deep-navy/20 rounded-xl bg-white text-xs text-on-surface placeholder:text-outline focus:border-primary-container outline-none transition-colors"
                          />
                          {i === 0 && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold uppercase tracking-wider text-primary">
                              Main
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={drawerProduct.name}
                    onChange={(e) =>
                      setDrawerProduct((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="e.g. V60 Ceramic Dripper"
                    className="block w-full h-11 px-4 border-2 border-deep-navy/20 rounded-xl bg-white text-sm text-on-surface placeholder:text-outline focus:border-primary-container outline-none transition-colors"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant mb-2">
                    Category
                  </label>
                  <select
                    value={drawerProduct.category}
                    onChange={(e) =>
                      setDrawerProduct((p) => ({ ...p, category: e.target.value }))
                    }
                    className="block w-full h-11 px-4 border-2 border-deep-navy/20 rounded-xl bg-white text-sm text-on-surface focus:border-primary-container outline-none appearance-none"
                  >
                    {["Drinkware", "Lighting", "Textiles", "Kitchenware", "Decor", "Other"].map(
                      (c) => (
                        <option key={c}>{c}</option>
                      )
                    )}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant mb-2">
                    Description
                  </label>
                  <textarea
                    value={drawerProduct.description}
                    onChange={(e) =>
                      setDrawerProduct((p) => ({ ...p, description: e.target.value }))
                    }
                    rows={3}
                    placeholder="Describe your product…"
                    className="block w-full px-4 py-3 border-2 border-deep-navy/20 rounded-xl bg-white text-sm text-on-surface placeholder:text-outline focus:border-primary-container outline-none transition-colors resize-none leading-relaxed"
                  />
                </div>

                {/* Price row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant mb-2">
                      Price ($) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={drawerProduct.price}
                      onChange={(e) =>
                        setDrawerProduct((p) => ({ ...p, price: e.target.value }))
                      }
                      placeholder="0.00"
                      className="block w-full h-11 px-4 border-2 border-deep-navy/20 rounded-xl bg-white text-sm text-on-surface focus:border-primary-container outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant mb-2">
                      Sale Price ($)
                      <span className="ml-1 font-normal text-outline normal-case tracking-normal">
                        optional
                      </span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={drawerProduct.salePrice}
                      onChange={(e) =>
                        setDrawerProduct((p) => ({ ...p, salePrice: e.target.value }))
                      }
                      placeholder="0.00"
                      className="block w-full h-11 px-4 border-2 border-deep-navy/20 rounded-xl bg-white text-sm text-on-surface focus:border-primary-container outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Stock + Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant mb-2">
                      Stock Qty
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={drawerProduct.stock}
                      onChange={(e) =>
                        setDrawerProduct((p) => ({ ...p, stock: e.target.value }))
                      }
                      placeholder="0"
                      className="block w-full h-11 px-4 border-2 border-deep-navy/20 rounded-xl bg-white text-sm text-on-surface focus:border-primary-container outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant mb-2">
                      Listing Status
                    </label>
                    <select
                      value={drawerProduct.status}
                      onChange={(e) =>
                        setDrawerProduct((p) => ({
                          ...p,
                          status: e.target.value as ProductStatus,
                        }))
                      }
                      className="block w-full h-11 px-4 border-2 border-deep-navy/20 rounded-xl bg-white text-sm text-on-surface focus:border-primary-container outline-none appearance-none"
                    >
                      <option value="active">Active</option>
                      <option value="hidden">Hidden</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Drawer footer */}
              <div className="border-t-2 border-deep-navy px-6 py-4 flex gap-3 shrink-0 bg-white">
                <button
                  onClick={() => setShowDrawer(false)}
                  className="flex-1 h-11 border-2 border-deep-navy/20 rounded-xl text-sm font-semibold text-on-surface-variant hover:border-deep-navy transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  onClick={handleSaveProduct}
                  animate={
                    drawerSaved
                      ? { backgroundColor: "#001a41" }
                      : { backgroundColor: "#00f3ff" }
                  }
                  transition={{ duration: 0.25, ease: EASE }}
                  className="flex-1 h-11 rounded-xl text-sm font-bold border-2 border-transparent hover:border-deep-navy active:scale-[0.97] transition-all duration-150"
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
                        className="text-deep-navy"
                      >
                        {drawerProduct.id ? "Save Changes" : "Create Product"}
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
