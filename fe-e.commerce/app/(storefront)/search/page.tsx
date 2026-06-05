"use client";

import { SlidersHorizontal, Grid3X3, List, X, Heart, ChevronDown, Search, Star } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { searchProductsAdvanced, formatVND, fetchShopByProduct, type UIProduct } from "@/lib/products";
import { addToCart } from "@/lib/cart";
import { BROWSE_CATEGORIES } from "@/lib/homepage-data";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

const SORT_OPTIONS: { value: NonNullable<Parameters<typeof searchProductsAdvanced>[0]["sort"]>; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
  { value: "rating", label: "Top Rated" },
  { value: "popular", label: "Best Selling" },
];

const RATING_OPTIONS = [
  { value: 0, label: "Any rating" },
  { value: 4, label: "4 stars & up" },
  { value: 3, label: "3 stars & up" },
  { value: 2, label: "2 stars & up" },
];

const PAGE_SIZE = 12;

const staggerGrid = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 14, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: EASE } },
};

function SearchInner() {
  const router = useRouter();
  const params = useSearchParams();
  const initialQ = params.get("q") ?? "";
  const initialCategory = params.get("category") ?? "";
  const initialSale = params.get("sale") === "1" || params.get("sale") === "true";

  // Committed filter state (drives the server query).
  const [query, setQuery] = useState(initialQ);
  const [inputValue, setInputValue] = useState(initialQ);
  const [category, setCategory] = useState<string>(initialCategory);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [inStock, setInStock] = useState(false);
  const [onSale, setOnSale] = useState(initialSale);
  const [sort, setSort] = useState<NonNullable<Parameters<typeof searchProductsAdvanced>[0]["sort"]>>("relevance");

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const [products, setProducts] = useState<UIProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadMoreBusy, setLoadMoreBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (pageToLoad: number, append: boolean) => {
      setError(null);
      append ? setLoadMoreBusy(true) : setLoading(true);
      try {
        const res = await searchProductsAdvanced({
          q: query.trim().length >= 2 ? query.trim() : undefined,
          type: category || undefined,
          minPrice: minPrice ? Number(minPrice) : undefined,
          maxPrice: maxPrice ? Number(maxPrice) : undefined,
          minRating: minRating || undefined,
          inStock: inStock || undefined,
          onSale: onSale || undefined,
          sort,
          page: pageToLoad,
          limit: PAGE_SIZE,
        });
        setTotal(res.total);
        setTotalPages(res.totalPages);
        setPage(res.page);
        setProducts((prev) => (append ? [...prev, ...res.items] : res.items));
      } catch (err) {
        const e = err as { message?: string };
        setError(e?.message ?? "Search failed");
        if (!append) setProducts([]);
      } finally {
        append ? setLoadMoreBusy(false) : setLoading(false);
      }
    },
    [query, category, minPrice, maxPrice, minRating, inStock, onSale, sort],
  );

  // Re-run from page 1 whenever any filter/sort/query changes (debounced so
  // typing a price doesn't fire a request per keystroke).
  useEffect(() => {
    const t = setTimeout(() => load(1, false), 300);
    return () => clearTimeout(t);
  }, [load]);

  const loadMore = () => {
    if (page >= totalPages || loadMoreBusy) return;
    load(page + 1, true);
  };

  const clearAll = () => {
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    setMinRating(0);
    setInStock(false);
    setOnSale(false);
  };

  const activeCount =
    (category ? 1 : 0) +
    (minPrice || maxPrice ? 1 : 0) +
    (minRating ? 1 : 0) +
    (inStock ? 1 : 0) +
    (onSale ? 1 : 0);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const next = inputValue.trim();
    setQuery(next);
    const url = new URL(window.location.href);
    if (next) url.searchParams.set("q", next);
    else url.searchParams.delete("q");
    router.replace(`${url.pathname}?${url.searchParams.toString()}`);
  };

  const FilterPanel = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-widest text-deep-navy">Filters</h2>
        {activeCount > 0 && (
          <button onClick={clearAll} className="text-xs font-semibold text-primary hover:underline">
            Clear all ({activeCount})
          </button>
        )}
      </div>

      {/* Category (single select) */}
      <div className="space-y-3">
        <h3 className="text-label-caps text-on-surface-variant uppercase tracking-widest text-xs">Category</h3>
        {BROWSE_CATEGORIES.map((cat) => (
          <label key={cat.slug} className="flex items-center gap-3 cursor-pointer group">
            <input
              type="radio"
              name="category"
              checked={category === cat.slug}
              onChange={() => setCategory(category === cat.slug ? "" : cat.slug)}
              onClick={() => category === cat.slug && setCategory("")}
              className="accent-primary w-4 h-4"
            />
            <span className="text-sm text-on-surface group-hover:text-deep-navy transition-colors">
              {cat.label}
            </span>
          </label>
        ))}
      </div>

      {/* Price range */}
      <div className="space-y-3">
        <h3 className="text-label-caps text-on-surface-variant uppercase tracking-widest text-xs">Price (₫)</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Min"
            className="w-full h-9 px-3 border border-deep-navy/20 rounded-lg text-xs text-on-surface bg-transparent focus:border-primary-container outline-none"
          />
          <span className="text-on-surface-variant">–</span>
          <input
            type="number"
            min={0}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max"
            className="w-full h-9 px-3 border border-deep-navy/20 rounded-lg text-xs text-on-surface bg-transparent focus:border-primary-container outline-none"
          />
        </div>
      </div>

      {/* Rating */}
      <div className="space-y-3">
        <h3 className="text-label-caps text-on-surface-variant uppercase tracking-widest text-xs">Rating</h3>
        {RATING_OPTIONS.map((r) => (
          <label key={r.value} className="flex items-center gap-3 cursor-pointer group">
            <input
              type="radio"
              name="rating"
              checked={minRating === r.value}
              onChange={() => setMinRating(r.value)}
              className="accent-primary w-4 h-4"
            />
            <span className="flex items-center gap-1 text-sm text-on-surface group-hover:text-deep-navy transition-colors">
              {r.value > 0 && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />}
              {r.label}
            </span>
          </label>
        ))}
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        <h3 className="text-label-caps text-on-surface-variant uppercase tracking-widest text-xs">Highlights</h3>
        <label className="flex items-center gap-3 cursor-pointer group">
          <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} className="accent-primary w-4 h-4" />
          <span className="text-sm text-on-surface group-hover:text-deep-navy transition-colors">In stock only</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer group">
          <input type="checkbox" checked={onSale} onChange={(e) => setOnSale(e.target.checked)} className="accent-primary w-4 h-4" />
          <span className="text-sm text-on-surface group-hover:text-deep-navy transition-colors">On sale</span>
        </label>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1">
        <div className="bg-white border-b-2 border-deep-navy py-6">
          <div className="max-w-[1280px] mx-auto px-10">
            <form
              onSubmit={submitSearch}
              className="flex items-center h-14 border-2 border-deep-navy rounded-xl bg-white focus-within:border-primary-container transition-colors px-5 gap-3 max-w-2xl"
            >
              <Search className="w-5 h-5 text-outline shrink-0" />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Search products..."
                className="flex-1 text-base text-deep-navy bg-transparent border-none outline-none placeholder:text-outline"
              />
              <button
                type="submit"
                className="text-label-caps text-on-surface-variant border border-outline-variant rounded px-2 py-0.5 hidden sm:block hover:border-deep-navy hover:text-deep-navy transition-colors"
              >
                ↵ Search
              </button>
            </form>
          </div>
        </div>

        <div className="max-w-[1280px] mx-auto px-10 py-10 flex gap-10">
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24">
              <FilterPanel />
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-outline-variant gap-4 flex-wrap">
              <p className="text-sm text-on-surface-variant">
                Showing{" "}
                <span className="font-bold text-deep-navy">
                  {products.length} of {total} {total === 1 ? "result" : "results"}
                </span>
                {query.trim() && (
                  <>
                    {" "}for <span className="font-bold text-deep-navy">&lsquo;{query}&rsquo;</span>
                  </>
                )}
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden flex items-center gap-2 h-9 px-4 border-2 border-deep-navy rounded-xl text-xs font-bold text-deep-navy"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Filters {activeCount > 0 && `(${activeCount})`}
                </button>

                {/* Sort dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setSortOpen((o) => !o)}
                    className="flex items-center h-9 px-4 border-2 border-deep-navy rounded-xl gap-2"
                  >
                    <span className="text-xs font-semibold text-deep-navy">
                      {SORT_OPTIONS.find((s) => s.value === sort)?.label}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-deep-navy" />
                  </button>
                  <AnimatePresence>
                    {sortOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-52 bg-white border-2 border-deep-navy rounded-xl overflow-hidden z-30 shadow-lg"
                      >
                        {SORT_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => {
                              setSort(opt.value);
                              setSortOpen(false);
                            }}
                            className={`block w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors ${
                              sort === opt.value
                                ? "bg-deep-navy text-primary-container"
                                : "text-deep-navy hover:bg-surface-container"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="hidden sm:flex items-center border-2 border-deep-navy rounded-xl overflow-hidden">
                  {(["grid", "list"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`h-9 w-9 flex items-center justify-center transition-colors duration-150 ${
                        viewMode === mode ? "bg-deep-navy text-primary-container" : "bg-white text-deep-navy hover:bg-surface-container"
                      }`}
                    >
                      {mode === "grid" ? <Grid3X3 className="w-4 h-4" /> : <List className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="border border-deep-navy/20 rounded-2xl overflow-hidden">
                    <div className="aspect-square bg-surface-container-low animate-pulse" />
                    <div className="p-5 space-y-2">
                      <div className="h-3 bg-surface-container-high rounded animate-pulse w-3/4" />
                      <div className="h-4 bg-surface-container-high rounded animate-pulse w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="py-16 text-center">
                <p className="text-sm text-error font-semibold">{error}</p>
              </div>
            ) : products.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <p className="text-lg font-bold text-deep-navy">No matching products.</p>
                <p className="text-sm text-on-surface-variant">
                  Try a different keyword or fewer filters.
                </p>
              </div>
            ) : (
              <motion.div
                variants={staggerGrid}
                initial="hidden"
                animate="show"
                className={viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
                  : "flex flex-col gap-4"
                }
              >
                {products.map((prod) =>
                  viewMode === "grid" ? (
                    <motion.div
                      key={prod.id}
                      variants={fadeUp}
                      className="group border border-deep-navy bg-white rounded-2xl overflow-hidden card-hover flex flex-col"
                    >
                      <Link href={`/products/${prod.id}`} className="relative aspect-square border-b border-deep-navy/20 bg-surface-container-low overflow-hidden block p-8">
                        {prod.tag && (
                          <span className="absolute top-4 left-4 z-10 bg-deep-navy text-primary-container text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg">
                            {prod.tag}
                          </span>
                        )}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-500"
                        />
                        <button className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white border border-deep-navy/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Heart className="w-4 h-4 text-deep-navy" />
                        </button>
                      </Link>
                      <div className="p-5 space-y-3 flex flex-col flex-grow">
                        <div>
                          <h3 className="text-base font-bold text-deep-navy line-clamp-2">{prod.name}</h3>
                          {prod.category && (
                            <p className="text-xs text-on-surface-variant mt-0.5 uppercase tracking-wider">{prod.category}</p>
                          )}
                          {typeof prod.rating === "number" && prod.rating > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span className="text-xs font-bold text-deep-navy">{prod.rating.toFixed(1)}</span>
                              {typeof prod.numReviews === "number" && prod.numReviews > 0 && (
                                <span className="text-xs text-on-surface-variant">({prod.numReviews})</span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-auto">
                          {prod.originalPrice ? (
                            <>
                              <span className="text-sm font-bold text-error">{formatVND(prod.price)}</span>
                              <span className="text-sm text-on-surface-variant line-through">{formatVND(prod.originalPrice)}</span>
                            </>
                          ) : (
                            <span className="text-sm font-bold text-deep-navy">{formatVND(prod.price)}</span>
                          )}
                        </div>
                        <button
                          onClick={async () => {
                            // Resolve the owning shop so the cart groups this
                            // line by seller (and checkout gets stock linkage).
                            const shop = await fetchShopByProduct(
                              String(prod.id),
                            ).catch(() => null);
                            addToCart({
                              productId: String(prod.id),
                              name: prod.name,
                              image: prod.image,
                              price: prod.price,
                              qty: 1,
                              sellerId: shop?.sellerId,
                              inventoryId: shop?.inventoryId,
                            });
                          }}
                          className="w-full py-2.5 border-t border-deep-navy/10 text-xs font-bold uppercase hover:bg-deep-navy hover:text-primary-container transition-all duration-200 active:scale-[0.97]"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key={prod.id}
                      variants={fadeUp}
                      className="group border border-deep-navy bg-white rounded-2xl overflow-hidden flex gap-0 card-hover"
                    >
                      <Link href={`/products/${prod.id}`} className="relative w-40 shrink-0 border-r border-deep-navy/20 bg-surface-container-low block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                        />
                      </Link>
                      <div className="p-6 flex flex-col flex-grow justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              {prod.tag && (
                                <span className="inline-block bg-deep-navy text-primary-container text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-lg mb-2">
                                  {prod.tag}
                                </span>
                              )}
                              <h3 className="text-base font-bold text-deep-navy">{prod.name}</h3>
                              {prod.description && (
                                <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{prod.description}</p>
                              )}
                            </div>
                            <button className="p-2 rounded-full border border-outline-variant hover:border-deep-navy transition-colors shrink-0">
                              <Heart className="w-4 h-4 text-deep-navy" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-2">
                            {prod.originalPrice ? (
                              <>
                                <span className="text-sm font-bold text-error">{formatVND(prod.price)}</span>
                                <span className="text-sm text-on-surface-variant line-through">{formatVND(prod.originalPrice)}</span>
                              </>
                            ) : (
                              <span className="text-sm font-bold text-deep-navy">{formatVND(prod.price)}</span>
                            )}
                          </div>
                          <Link
                            href={`/products/${prod.id}`}
                            className="h-9 px-5 bg-primary-container text-deep-navy text-xs font-bold rounded-xl border-2 border-transparent hover:border-deep-navy transition-colors duration-150 active:scale-[0.97] flex items-center"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  ),
                )}
              </motion.div>
            )}

            {page < totalPages && products.length > 0 && (
              <div className="mt-12 flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={loadMoreBusy}
                  className="h-12 px-10 border-2 border-deep-navy text-label-caps text-deep-navy font-bold rounded-xl hover:bg-deep-navy hover:text-primary-container transition-all duration-200 active:scale-[0.97] disabled:opacity-60"
                >
                  {loadMoreBusy ? "Loading…" : `Load More (${total - products.length} left)`}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-deep-navy/40 z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
              className="fixed left-0 top-0 h-full w-80 bg-white z-50 p-6 overflow-y-auto border-r-2 border-deep-navy"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-sm font-bold uppercase tracking-widest text-deep-navy">Filters</h2>
                <button onClick={() => setSidebarOpen(false)}>
                  <X className="w-5 h-5 text-deep-navy" />
                </button>
              </div>
              <FilterPanel />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <SearchInner />
    </Suspense>
  );
}
