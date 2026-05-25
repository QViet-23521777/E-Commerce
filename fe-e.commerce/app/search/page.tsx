"use client";

import { SlidersHorizontal, Grid3X3, List, X, Heart, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const CATEGORIES = ["Vases & Vessels", "Lighting", "Textiles", "Kitchenware", "Furniture"];
const MATERIALS = ["Recycled Glass", "Bamboo", "Ceramic", "Oak Wood", "Linen"];

const PRODUCTS = [
  { id: 1, name: "Ribbed Glass Vase", material: "Recycled glass, mouth-blown", price: 125, salePrice: null, tag: "New", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBQnttJbzpiC4QRt8GQvgN_K-LPivaoWxQbJdHzb6kosJGev_3CVhSB--6w9rlF8agmBGyseznO-fU5e1Y510XVbDyymty-zPapnIeQH0i2v-czpBGaZUG686ds_gVZg8Yt2DZzTsztQzLti-onPa5W4qfl6OsvhvxKFZgqmbBaWe72wtwVwwZQuR9HEBPYH3t82nWIzD50ODtN_69mApTqtSBSltL2RWLb-lr-ZAJHgfzLF2T9M8XCj94gw-qjt3zBlxgWDXT7jHus" },
  { id: 2, name: "Hand-Woven Bamboo Lamp", material: "100% ethically sourced bamboo", price: 345, salePrice: null, tag: null, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBqiE_3yYfaa9MGAf4ckjwM4q7Mqu2_Iz1nKbpM0LLiQiglJWVhM0M2cfKayFDUrfgnwhjus7cAj6Jm4tLDHon9-mSigEVHGvRoiKbCZGnDSEk6mTI3Ilu7ivPq83PedR7syPOMj7Echsltht2GcxDbvBHGrK2XDC3utMl7Hq4ZKuy1vCBtuybpYu4hfAVauclNgV2rdeiE4NS6_ImSl5Hcc74MRjZAc2-3ub60TPbLQ-qGPv4ZSop3evz7-r4Hh7LmhrVVRrYJzAyt" },
  { id: 3, name: "Ceramic Planter Trio", material: "Stoneware ceramic, matte glaze", price: 240, salePrice: 189, tag: "Sale", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBEFirrcDk_MGZVSgIh0HkV36UXMReWFCUmRrxoMFgIhks4x_ZjGdrOi2sUWXB_9R0NaUU7MVmhoqjFxo5_9JA9lOKMnc1xdphCtBJQj6SBAXqrc-dCPeSbM4oGqCwgrjXCItbiU-Sg--uZ4Y49um0K_Jjn1fvsI7_xnZvhuuyBbhhN5cPCeSwxgb6KraO3FNpwmpW0eCzcHee7t4hHa3wpFSiKrVSHaVFb2mh2rRwOCqEWH3M8B7I0XSaa-7IMyZtPS9qhuUp37wnL" },
  { id: 4, name: "V60 Ceramic Dripper", material: "High-fired ceramic, pour-over", price: 45, salePrice: null, tag: "New", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDuYPHC5ZucXkMLQdPzRtMwA5fwVf4vodbpXzIAj1S6x4XKjM2fAlF7-u-Z-AU3MWyNLivbqT5NJVyhECEfYebs0h9qutzgtz955zo46r6UKJ_32aNcoy_7_fNGgqJzQY7CDeFPibKGTiQOwhV3lPfA9eC6I9W4_XCDYFh4FgdiwfC_x7VTV8hox8fmMw3BIDeUe8i7OCB11qcswwjZTdPA83Cj2SJY5IbVEXpLsg6dQg6vLyyj5o-lN_LUe6-ocebtxqygqhHLieN3" },
  { id: 5, name: "Linen Throw Set", material: "100% Belgian linen, stonewashed", price: 175, salePrice: null, tag: null, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAgZgxJBL_cQBXBw5VzGLXPpgE5RrL1cjMbWzL19VtO-XmfNNZV1pTCD8rc39nQXx99rcFwYIBT_DXnucwl9RgW8yKfo4HhdOSq_L0oCSntd6PaPXphuxOKKyW1xWwfBGwb72fuxp_0uPUaDG4DJGiKGwxMoyC3d6Miv61WWKFUAWGd3H-IlEY28QsPuHJioAksGYxaOHKRI2Qg3AG52p3ws5sxT3xorquBUeftVmdxuHfT73crxvuynz2znqMFjVdss1scuZQ8o4Nz" },
  { id: 6, name: "Task Lamp T-1", material: "Aluminium, matte powder coat", price: 120, salePrice: null, tag: null, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBqiE_3yYfaa9MGAf4ckjwM4q7Mqu2_Iz1nKbpM0LLiQiglJWVhM0M2cfKayFDUrfgnwhjus7cAj6Jm4tLDHon9-mSigEVHGvRoiKbCZGnDSEk6mTI3Ilu7ivPq83PedR7syPOMj7Echsltht2GcxDbvBHGrK2XDC3utMl7Hq4ZKuy1vCBtuybpYu4hfAVauclNgV2rdeiE4NS6_ImSl5Hcc74MRjZAc2-3ub60TPbLQ-qGPv4ZSop3evz7-r4Hh7LmhrVVRrYJzAyt" },
];

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

const staggerGrid = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 14, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: EASE } },
};

export default function SearchPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [activeMaterials, setActiveMaterials] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleFilter = (
    val: string,
    active: string[],
    set: React.Dispatch<React.SetStateAction<string[]>>
  ) => set(active.includes(val) ? active.filter((v) => v !== val) : [...active, val]);

  const clearAll = () => { setActiveCategories([]); setActiveMaterials([]); };
  const activeCount = activeCategories.length + activeMaterials.length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Search hero bar */}
        <div className="bg-white border-b-2 border-deep-navy py-6">
          <div className="max-w-[1280px] mx-auto px-10">
            <div className="flex items-center h-14 border-2 border-deep-navy rounded-xl bg-white focus-within:border-primary-container transition-colors px-5 gap-3 max-w-2xl">
              <svg className="w-5 h-5 text-outline shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                defaultValue="Sustainable Home Decor"
                className="flex-1 text-base text-deep-navy bg-transparent border-none placeholder:text-outline"
              />
              <span className="text-label-caps text-on-surface-variant border border-outline-variant rounded px-2 py-0.5 hidden sm:block">
                ↵ Search
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-[1280px] mx-auto px-10 py-10 flex gap-10">
          {/* ── Filter Sidebar ── */}
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

              {/* Category */}
              <div className="space-y-3">
                <h3 className="text-label-caps text-on-surface-variant uppercase tracking-widest text-xs">Category</h3>
                {CATEGORIES.map((cat) => (
                  <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                    <div
                      onClick={() => toggleFilter(cat, activeCategories, setActiveCategories)}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors duration-150 cursor-pointer ${
                        activeCategories.includes(cat)
                          ? "bg-primary-container border-primary"
                          : "border-deep-navy group-hover:border-primary"
                      }`}
                    >
                      {activeCategories.includes(cat) && (
                        <svg className="w-2.5 h-2.5 text-deep-navy" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                          <path d="M2 6l3 3 5-5" />
                        </svg>
                      )}
                    </div>
                    <span
                      onClick={() => toggleFilter(cat, activeCategories, setActiveCategories)}
                      className="text-sm text-on-surface cursor-pointer group-hover:text-deep-navy transition-colors"
                    >
                      {cat}
                    </span>
                  </label>
                ))}
              </div>

              {/* Material */}
              <div className="space-y-3">
                <h3 className="text-label-caps text-on-surface-variant uppercase tracking-widest text-xs">Material</h3>
                {MATERIALS.map((mat) => (
                  <label key={mat} className="flex items-center gap-3 cursor-pointer group">
                    <div
                      onClick={() => toggleFilter(mat, activeMaterials, setActiveMaterials)}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors duration-150 cursor-pointer ${
                        activeMaterials.includes(mat)
                          ? "bg-primary-container border-primary"
                          : "border-deep-navy group-hover:border-primary"
                      }`}
                    >
                      {activeMaterials.includes(mat) && (
                        <svg className="w-2.5 h-2.5 text-deep-navy" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                          <path d="M2 6l3 3 5-5" />
                        </svg>
                      )}
                    </div>
                    <span
                      onClick={() => toggleFilter(mat, activeMaterials, setActiveMaterials)}
                      className="text-sm text-on-surface cursor-pointer group-hover:text-deep-navy transition-colors"
                    >
                      {mat}
                    </span>
                  </label>
                ))}
              </div>

              {/* Price range */}
              <div className="space-y-3">
                <h3 className="text-label-caps text-on-surface-variant uppercase tracking-widest text-xs">Price Range</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="$0"
                    className="w-full h-10 px-3 border border-deep-navy rounded-xl text-sm bg-white text-deep-navy placeholder:text-outline"
                  />
                  <span className="text-on-surface-variant text-sm">–</span>
                  <input
                    type="number"
                    placeholder="$500"
                    className="w-full h-10 px-3 border border-deep-navy rounded-xl text-sm bg-white text-deep-navy placeholder:text-outline"
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* ── Results ── */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-outline-variant">
              <div className="flex items-center gap-4">
                <p className="text-sm text-on-surface-variant">
                  Showing <span className="font-bold text-deep-navy">24 results</span> for{" "}
                  <span className="font-bold text-deep-navy">&lsquo;Sustainable Home Decor&rsquo;</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Active filter chips */}
                <AnimatePresence>
                  {[...activeCategories, ...activeMaterials].map((f) => (
                    <motion.span
                      key={f}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                      className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-deep-navy text-primary-container text-xs font-bold rounded-lg"
                    >
                      {f}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => {
                          toggleFilter(f, activeCategories, setActiveCategories);
                          toggleFilter(f, activeMaterials, setActiveMaterials);
                        }}
                      />
                    </motion.span>
                  ))}
                </AnimatePresence>

                {/* Mobile filter toggle */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden flex items-center gap-2 h-9 px-4 border-2 border-deep-navy rounded-xl text-xs font-bold text-deep-navy"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Filters {activeCount > 0 && `(${activeCount})`}
                </button>

                {/* Sort */}
                <div className="relative flex items-center h-9 px-4 border-2 border-deep-navy rounded-xl gap-2 cursor-pointer">
                  <span className="text-xs font-semibold text-deep-navy">Relevance</span>
                  <ChevronDown className="w-3.5 h-3.5 text-deep-navy" />
                </div>

                {/* View toggle */}
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

            {/* Product grid */}
            <motion.div
              variants={staggerGrid}
              initial="hidden"
              animate="show"
              className={viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
                : "flex flex-col gap-4"
              }
            >
              {PRODUCTS.map((prod) =>
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
                        <h3 className="text-base font-bold text-deep-navy">{prod.name}</h3>
                        <p className="text-xs text-on-surface-variant mt-0.5">{prod.material}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-auto">
                        {prod.salePrice ? (
                          <>
                            <span className="text-sm font-bold text-error">${prod.salePrice}</span>
                            <span className="text-sm text-on-surface-variant line-through">${prod.price}</span>
                          </>
                        ) : (
                          <span className="text-sm font-bold text-deep-navy">${prod.price}.00</span>
                        )}
                      </div>
                      <button className="w-full py-2.5 border-t border-deep-navy/10 text-xs font-bold uppercase hover:bg-deep-navy hover:text-primary-container transition-all duration-200 active:scale-[0.97]">
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
                            <p className="text-xs text-on-surface-variant mt-1">{prod.material}</p>
                          </div>
                          <button className="p-2 rounded-full border border-outline-variant hover:border-deep-navy transition-colors shrink-0">
                            <Heart className="w-4 h-4 text-deep-navy" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                          {prod.salePrice ? (
                            <>
                              <span className="text-sm font-bold text-error">${prod.salePrice}</span>
                              <span className="text-sm text-on-surface-variant line-through">${prod.price}</span>
                            </>
                          ) : (
                            <span className="text-sm font-bold text-deep-navy">${prod.price}.00</span>
                          )}
                        </div>
                        <button className="h-9 px-5 bg-primary-container text-deep-navy text-xs font-bold rounded-xl border-2 border-transparent hover:border-deep-navy transition-colors duration-150 active:scale-[0.97]">
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              )}
            </motion.div>

            {/* Load more */}
            <div className="mt-12 flex justify-center">
              <button className="h-12 px-10 border-2 border-deep-navy text-label-caps text-deep-navy font-bold rounded-xl hover:bg-deep-navy hover:text-primary-container transition-all duration-200 active:scale-[0.97]">
                Load More
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile filter drawer */}
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
              <p className="text-sm text-on-surface-variant">Filter options available on desktop view.</p>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
