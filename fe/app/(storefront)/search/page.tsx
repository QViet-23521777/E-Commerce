"use client";

import { SlidersHorizontal, Grid3X3, List, X, Heart, ChevronDown, Search } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { searchProducts, fetchTopByType, fetchTopSale, formatVND, type UIProduct } from "@/lib/products";
import { addToCart } from "@/lib/cart";
import { BROWSE_CATEGORIES } from "@/lib/homepage-data";

const MATERIALS = ["On Sale", "Bestseller", "High Reward Points"];

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

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
  const initialSale = params.get("sale");

  const [query, setQuery] = useState(initialQ);
  const [inputValue, setInputValue] = useState(initialQ);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeCategories, setActiveCategories] = useState<string[]>(
    initialCategory ? [initialCategory] : [],
  );
  const [activeFlags, setActiveFlags] = useState<string[]>(
    initialSale ? ["On Sale"] : [],
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState<UIProduct[]>([]);
  const [cursor, setCursor] = useState<{ lastTrack?: number; lastId?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadMoreBusy, setLoadMoreBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runQuery = useCallback(
    async (q: string, append = false, c: { lastTrack?: number; lastId?: string } | null = null) => {
      setError(null);
      append ? setLoadMoreBusy(true) : setLoading(true);
      try {
        if (q.trim().length >= 2) {
          const res = await searchProducts(q.trim(), 12, c);
          setProducts((prev) => (append ? [...prev, ...res.items] : res.items));
          setCursor(res.nextCursor);
        } else if (activeCategories.length > 0) {
          const lists = await Promise.all(
            activeCategories.map((cat) => fetchTopByType(cat, 12)),
          );
          const merged: UIProduct[] = [];
          const seen = new Set<string>();
          for (const list of lists) {
            for (const p of list) {
              if (!seen.has(p.id)) {
                seen.add(p.id);
                merged.push(p);
              }
            }
          }
          setProducts(merged);
          setCursor(null);
        } else if (activeFlags.includes("On Sale")) {
          // No query/category but the "On Sale" highlight is on (e.g. arriving
          // from the Flash Deals "See All" link, /search?sale=1) — show the
          // best current discounts.
          const items = await fetchTopSale(24);
          setProducts(items);
          setCursor(null);
        } else {
          setProducts([]);
          setCursor(null);
        }
      } catch (err) {
        const e = err as { message?: string };
        setError(e?.message ?? "Search failed");
        if (!append) setProducts([]);
      } finally {
        append ? setLoadMoreBusy(false) : setLoading(false);
      }
    },
    [activeCategories, activeFlags],
  );

  useEffect(() => {
    runQuery(query, false, null);
  }, [query, runQuery]);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (activeCategories.length > 0 && query.trim().length >= 2) {
      list = list.filter((p) => p.type && activeCategories.includes(p.type));
    }
    if (activeFlags.includes("On Sale"))
      list = list.filter((p) => (p.salePercent ?? 0) > 0);
    if (activeFlags.includes("Bestseller"))
      list = list.filter((p) => (p.numPurchases ?? 0) >= 1000);
    if (activeFlags.includes("High Reward Points"))
      list = list.filter((p) => (p.point ?? 0) >= 20);
    return list;
  }, [products, activeCategories, activeFlags, query]);

  const toggleFilter = (
    val: string,
    active: string[],
    set: React.Dispatch<React.SetStateAction<string[]>>,
  ) => set(active.includes(val) ? active.filter((v) => v !== val) : [...active, val]);

  const clearAll = () => {
    setActiveCategories([]);
    setActiveFlags([]);
  };
  const activeCount = activeCategories.length + activeFlags.length;

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const next = inputValue.trim();
    setQuery(next);
    const url = new URL(window.location.href);
    if (next) url.searchParams.set("q", next);
    else url.searchParams.delete("q");
    router.replace(`${url.pathname}?${url.searchParams.toString()}`);
  };

  const loadMore = () => {
    if (!cursor || loadMoreBusy) return;
    runQuery(query, true, cursor);
  };

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
            <div className="sticky top-24 space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-widest text-deep-navy">Filters</h2>
                {activeCount > 0 && (
                  <button onClick={clearAll} className="text-xs font-semibold text-primary hover:underline">
                    Clear all ({activeCount})
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="text-label-caps text-on-surface-variant uppercase tracking-widest text-xs">Category</h3>
                {BROWSE_CATEGORIES.map((cat) => (
                  <label key={cat.slug} className="flex items-center gap-3 cursor-pointer group">
                    <div
                      onClick={() => toggleFilter(cat.slug, activeCategories, setActiveCategories)}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors duration-150 cursor-pointer ${
                        activeCategories.includes(cat.slug)
                          ? "bg-primary-container border-primary"
                          : "border-deep-navy group-hover:border-primary"
                      }`}
                    >
                      {activeCategories.includes(cat.slug) && (
                        <svg className="w-2.5 h-2.5 text-deep-navy" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                          <path d="M2 6l3 3 5-5" />
                        </svg>
                      )}
                    </div>
                    <span
                      onClick={() => toggleFilter(cat.slug, activeCategories, setActiveCategories)}
                      className="text-sm text-on-surface cursor-pointer group-hover:text-deep-navy transition-colors"
                    >
                      {cat.label}
                    </span>
                  </label>
                ))}
              </div>

              <div className="space-y-3">
                <h3 className="text-label-caps text-on-surface-variant uppercase tracking-widest text-xs">Highlights</h3>
                {MATERIALS.map((mat) => (
                  <label key={mat} className="flex items-center gap-3 cursor-pointer group">
                    <div
                      onClick={() => toggleFilter(mat, activeFlags, setActiveFlags)}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors duration-150 cursor-pointer ${
                        activeFlags.includes(mat)
                          ? "bg-primary-container border-primary"
                          : "border-deep-navy group-hover:border-primary"
                      }`}
                    >
                      {activeFlags.includes(mat) && (
                        <svg className="w-2.5 h-2.5 text-deep-navy" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                          <path d="M2 6l3 3 5-5" />
                        </svg>
                      )}
                    </div>
                    <span
                      onClick={() => toggleFilter(mat, activeFlags, setActiveFlags)}
                      className="text-sm text-on-surface cursor-pointer group-hover:text-deep-navy transition-colors"
                    >
                      {mat}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-outline-variant gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <p className="text-sm text-on-surface-variant">
                  Showing <span className="font-bold text-deep-navy">{filteredProducts.length} results</span>
                  {query.trim() && (
                    <>
                      {" "}for <span className="font-bold text-deep-navy">&lsquo;{query}&rsquo;</span>
                    </>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <AnimatePresence>
                  {[...activeCategories, ...activeFlags].map((f) => (
                    <motion.span
                      key={f}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.2, ease: EASE }}
                      className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-deep-navy text-primary-container text-xs font-bold rounded-lg"
                    >
                      {f}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => {
                          toggleFilter(f, activeCategories, setActiveCategories);
                          toggleFilter(f, activeFlags, setActiveFlags);
                        }}
                      />
                    </motion.span>
                  ))}
                </AnimatePresence>

                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden flex items-center gap-2 h-9 px-4 border-2 border-deep-navy rounded-xl text-xs font-bold text-deep-navy"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Filters {activeCount > 0 && `(${activeCount})`}
                </button>

                <div className="relative flex items-center h-9 px-4 border-2 border-deep-navy rounded-xl gap-2 cursor-pointer">
                  <span className="text-xs font-semibold text-deep-navy">Relevance</span>
                  <ChevronDown className="w-3.5 h-3.5 text-deep-navy" />
                </div>

                <div className="flex items-center border-2 border-deep-navy rounded-xl overflow-hidden">
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
            ) : filteredProducts.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <p className="text-lg font-bold text-deep-navy">No matching products.</p>
                <p className="text-sm text-on-surface-variant">
                  {query.trim().length < 2 && activeCategories.length === 0
                    ? "Try a search term (at least 2 characters) or pick a category."
                    : "Try a different keyword or fewer filters."}
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
                {filteredProducts.map((prod) =>
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
                          onClick={() =>
                            addToCart({
                              productId: String(prod.id),
                              name: prod.name,
                              image: prod.image,
                              price: prod.price,
                              qty: 1,
                            })
                          }
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

            {cursor && filteredProducts.length > 0 && (
              <div className="mt-12 flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={loadMoreBusy}
                  className="h-12 px-10 border-2 border-deep-navy text-label-caps text-deep-navy font-bold rounded-xl hover:bg-deep-navy hover:text-primary-container transition-all duration-200 active:scale-[0.97] disabled:opacity-60"
                >
                  {loadMoreBusy ? "Loading…" : "Load More"}
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
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase text-on-surface-variant">Category</h3>
                  {BROWSE_CATEGORIES.map((cat) => (
                    <button
                      key={cat.slug}
                      onClick={() => toggleFilter(cat.slug, activeCategories, setActiveCategories)}
                      className={`block w-full text-left text-sm px-3 py-2 rounded-lg ${
                        activeCategories.includes(cat.slug)
                          ? "bg-deep-navy text-primary-container"
                          : "bg-surface-container-low text-on-surface"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
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
