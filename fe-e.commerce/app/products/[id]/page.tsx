"use client";

import { ChevronRight, Heart, ShoppingCart, Minus, Plus, ChevronDown, Play } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const THUMBNAILS = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBqiE_3yYfaa9MGAf4ckjwM4q7Mqu2_Iz1nKbpM0LLiQiglJWVhM0M2cfKayFDUrfgnwhjus7cAj6Jm4tLDHon9-mSigEVHGvRoiKbCZGnDSEk6mTI3Ilu7ivPq83PedR7syPOMj7Echsltht2GcxDbvBHGrK2XDC3utMl7Hq4ZKuy1vCBtuybpYu4hfAVauclNgV2rdeiE4NS6_ImSl5Hcc74MRjZAc2-3ub60TPbLQ-qGPv4ZSop3evz7-r4Hh7LmhrVVRrYJzAyt",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBQnttJbzpiC4QRt8GQvgN_K-LPivaoWxQbJdHzb6kosJGev_3CVhSB--6w9rlF8agmBGyseznO-fU5e1Y510XVbDyymty-zPapnIeQH0i2v-czpBGaZUG686ds_gVZg8Yt2DZzTsztQzLti-onPa5W4qfl6OsvhvxKFZgqmbBaWe72wtwVwwZQuR9HEBPYH3t82nWIzD50ODtN_69mApTqtSBSltL2RWLb-lr-ZAJHgfzLF2T9M8XCj94gw-qjt3zBlxgWDXT7jHus",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBEFirrcDk_MGZVSgIh0HkV36UXMReWFCUmRrxoMFgIhks4x_ZjGdrOi2sUWXB_9R0NaUU7MVmhoqjFxo5_9JA9lOKMnc1xdphCtBJQj6SBAXqrc-dCPeSbM4oGqCwgrjXCItbiU-Sg--uZ4Y49um0K_Jjn1fvsI7_xnZvhuuyBbhhN5cPCeSwxgb6KraO3FNpwmpW0eCzcHee7t4hHa3wpFSiKrVSHaVFb2mh2rRwOCqEWH3M8B7I0XSaa-7IMyZtPS9qhuUp37wnL",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDuYPHC5ZucXkMLQdPzRtMwA5fwVf4vodbpXzIAj1S6x4XKjM2fAlF7-u-Z-AU3MWyNLivbqT5NJVyhECEfYebs0h9qutzgtz955zo46r6UKJ_32aNcoy_7_fNGgqJzQY7CDeFPibKGTiQOwhV3lPfA9eC6I9W4_XCDYFh4FgdiwfC_x7VTV8hox8fmMw3BIDeUe8i7OCB11qcswwjZTdPA83Cj2SJY5IbVEXpLsg6dQg6vLyyj5o-lN_LUe6-ocebtxqygqhHLieN3",
];

const SPECS = [
  { label: "Material", value: "100% ethically sourced bamboo" },
  { label: "Cord", value: "3m fabric-covered navy" },
  { label: "Bulb Type", value: "E27 LED, max 60W" },
  { label: "Weight", value: "1.2 kg" },
  { label: "Diameter Options", value: "40cm / 60cm / 80cm" },
  { label: "Country of Origin", value: "Vietnam" },
];

const TABS = [
  {
    id: "specs",
    label: "Specifications",
    content: SPECS,
  },
  {
    id: "care",
    label: "Installation & Care",
    content: [
      { label: "Cleaning", value: "Wipe with a dry or slightly damp cloth. Avoid harsh chemicals." },
      { label: "Installation", value: "Professional installation recommended. Suitable for ceilings up to 3.5m." },
      { label: "Bulb included", value: "No. Compatible with all E27 LED and filament bulbs." },
    ],
  },
  {
    id: "shipping",
    label: "Shipping",
    content: [
      { label: "Dispatch", value: "Ships in 2–4 business days." },
      { label: "Packaging", value: "Flat-packed in FSC-certified cardboard." },
      { label: "Returns", value: "30-day returns on undamaged items." },
    ],
  },
];

const RELATED = [
  { id: 2, name: "Ribbed Glass Vase", price: "$125.00", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBQnttJbzpiC4QRt8GQvgN_K-LPivaoWxQbJdHzb6kosJGev_3CVhSB--6w9rlF8agmBGyseznO-fU5e1Y510XVbDyymty-zPapnIeQH0i2v-czpBGaZUG686ds_gVZg8Yt2DZzTsztQzLti-onPa5W4qfl6OsvhvxKFZgqmbBaWe72wtwVwwZQuR9HEBPYH3t82nWIzD50ODtN_69mApTqtSBSltL2RWLb-lr-ZAJHgfzLF2T9M8XCj94gw-qjt3zBlxgWDXT7jHus" },
  { id: 3, name: "Task Lamp T-1", price: "$120.00", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBqiE_3yYfaa9MGAf4ckjwM4q7Mqu2_Iz1nKbpM0LLiQiglJWVhM0M2cfKayFDUrfgnwhjus7cAj6Jm4tLDHon9-mSigEVHGvRoiKbCZGnDSEk6mTI3Ilu7ivPq83PedR7syPOMj7Echsltht2GcxDbvBHGrK2XDC3utMl7Hq4ZKuy1vCBtuybpYu4hfAVauclNgV2rdeiE4NS6_ImSl5Hcc74MRjZAc2-3ub60TPbLQ-qGPv4ZSop3evz7-r4Hh7LmhrVVRrYJzAyt" },
  { id: 4, name: "Mono Plate Series", price: "$55.00", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBEFirrcDk_MGZVSgIh0HkV36UXMReWFCUmRrxoMFgIhks4x_ZjGdrOi2sUWXB_9R0NaUU7MVmhoqjFxo5_9JA9lOKMnc1xdphCtBJQj6SBAXqrc-dCPeSbM4oGqCwgrjXCItbiU-Sg--uZ4Y49um0K_Jjn1fvsI7_xnZvhuuyBbhhN5cPCeSwxgb6KraO3FNpwmpW0eCzcHee7t4hHa3wpFSiKrVSHaVFb2mh2rRwOCqEWH3M8B7I0XSaa-7IMyZtPS9qhuUp37wnL" },
];

export default function ProductDetailPage() {
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState("specs");
  const [selectedSize, setSelectedSize] = useState("60cm");
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const handleAddToCart = () => {
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="border-b border-outline-variant bg-white">
          <div className="max-w-[1280px] mx-auto px-10 py-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            <Link href="/" className="hover:text-deep-navy transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/search?category=lighting" className="hover:text-deep-navy transition-colors">Lighting</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-deep-navy">Pendants</span>
          </div>
        </div>

        {/* Product section */}
        <div className="max-w-[1280px] mx-auto px-10 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* ── Image gallery ── */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className="space-y-4"
            >
              {/* Main image */}
              <div className="relative aspect-square border-2 border-deep-navy rounded-2xl overflow-hidden bg-surface-container-low">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeImage}
                    src={THUMBNAILS[activeImage]}
                    alt="Hand-Woven Bamboo Lamp"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="w-full h-full object-contain p-12"
                  />
                </AnimatePresence>
                {/* Video play hint */}
                <button className="absolute bottom-5 right-5 w-10 h-10 bg-white border-2 border-deep-navy rounded-xl flex items-center justify-center hover:bg-primary-container transition-colors">
                  <Play className="w-4 h-4 text-deep-navy fill-deep-navy" />
                </button>
              </div>

              {/* Thumbnails */}
              <div className="grid grid-cols-4 gap-3">
                {THUMBNAILS.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`aspect-square border-2 rounded-xl overflow-hidden bg-surface-container-low transition-colors duration-150 ${
                      activeImage === i ? "border-primary-container" : "border-deep-navy/30 hover:border-deep-navy"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="w-full h-full object-contain p-3" />
                  </button>
                ))}
              </div>
            </motion.div>

            {/* ── Product info ── */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
              className="space-y-8"
            >
              {/* Badge + title */}
              <div className="space-y-3">
                <span className="inline-block px-3 py-1 bg-deep-navy text-primary-container text-[10px] font-bold uppercase tracking-widest rounded-lg">
                  Bestseller
                </span>
                <h1 className="text-display-lg-mobile text-deep-navy">Hand-Woven Bamboo Lamp</h1>
                <div className="flex items-center gap-3">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className="w-4 h-4 text-primary-container fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm text-on-surface-variant">(147 reviews)</span>
                </div>
                <p className="text-3xl font-bold tracking-tight text-deep-navy">$345.00</p>
              </div>

              <p className="text-body-md text-on-surface-variant">
                Clinical light diffusion through a structurally rigorous natural bamboo matrix.
                Handcrafted by artisans in the Mekong Delta using traditional weaving techniques
                refined over three generations.
              </p>

              {/* Finish selector */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-widest text-deep-navy">Finish</span>
                <div className="relative">
                  <select className="w-full h-12 px-4 pr-10 border-2 border-deep-navy rounded-xl bg-white text-sm text-deep-navy appearance-none cursor-pointer">
                    <option>Natural Birch</option>
                    <option>Dark Walnut</option>
                    <option>Bleached White</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-deep-navy pointer-events-none" />
                </div>
              </div>

              {/* Size selector */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-widest text-deep-navy">Diameter</span>
                <div className="flex gap-3">
                  {["40cm", "60cm", "80cm"].map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`h-10 px-5 border-2 rounded-xl text-sm font-semibold transition-colors duration-150 active:scale-[0.97] ${
                        selectedSize === size
                          ? "bg-deep-navy text-primary-container border-deep-navy"
                          : "border-deep-navy/40 text-deep-navy hover:border-deep-navy"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-widest text-deep-navy">Quantity</span>
                <div className="flex items-center border-2 border-deep-navy rounded-xl overflow-hidden w-fit">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-11 h-11 flex items-center justify-center hover:bg-surface-container transition-colors active:scale-[0.97]"
                  >
                    <Minus className="w-4 h-4 text-deep-navy" />
                  </button>
                  <span className="w-14 text-center text-sm font-bold text-deep-navy border-x-2 border-deep-navy h-11 flex items-center justify-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-11 h-11 flex items-center justify-center hover:bg-surface-container transition-colors active:scale-[0.97]"
                  >
                    <Plus className="w-4 h-4 text-deep-navy" />
                  </button>
                </div>
              </div>

              {/* CTA buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 h-14 flex items-center justify-center gap-2.5 bg-primary-container text-deep-navy text-label-caps font-bold rounded-xl border-2 border-transparent hover:border-deep-navy transition-colors duration-150 active:scale-[0.97]"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={addedToCart ? "added" : "add"}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                    >
                      {addedToCart ? "Added ✓" : "Add to Basket"}
                    </motion.span>
                  </AnimatePresence>
                </button>
                <button
                  onClick={() => setWishlisted((v) => !v)}
                  className={`w-14 h-14 flex items-center justify-center border-2 rounded-xl transition-colors duration-150 active:scale-[0.97] ${
                    wishlisted ? "bg-deep-navy border-deep-navy text-primary-container" : "border-deep-navy hover:bg-surface-container"
                  }`}
                >
                  <Heart className={`w-5 h-5 ${wishlisted ? "fill-primary-container text-primary-container" : "text-deep-navy"}`} />
                </button>
              </div>

              {/* Shipping notice */}
              <div className="flex items-center gap-3 p-4 bg-surface-container-low border border-outline-variant rounded-xl">
                <div className="w-2 h-2 bg-primary rounded-full shrink-0" />
                <p className="text-sm text-on-surface-variant">
                  <span className="font-semibold text-deep-navy">In stock</span> — Ships in 2–4 business days. Free shipping on orders over $150.
                </p>
              </div>
            </motion.div>
          </div>

          {/* ── Expandable tabs ── */}
          <div className="mt-16 border-t-2 border-deep-navy">
            <div className="flex border-b-2 border-deep-navy">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`h-14 px-8 text-sm font-bold uppercase tracking-widest transition-colors duration-150 border-r-2 border-deep-navy last:border-r-0 ${
                    activeTab === tab.id
                      ? "bg-deep-navy text-primary-container"
                      : "text-deep-navy hover:bg-surface-container"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {TABS.map(
                (tab) =>
                  activeTab === tab.id && (
                    <motion.div
                      key={tab.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                      className="py-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                      {tab.content.map((row) => (
                        <div key={row.label} className="p-5 bg-white border border-deep-navy/20 rounded-xl">
                          <dt className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{row.label}</dt>
                          <dd className="mt-1.5 text-sm text-deep-navy">{row.value}</dd>
                        </div>
                      ))}
                    </motion.div>
                  )
              )}
            </AnimatePresence>
          </div>

          {/* ── Related products ── */}
          <div className="mt-16">
            <div className="flex items-end justify-between mb-8 border-b-2 border-deep-navy pb-4">
              <h2 className="text-headline-md font-bold uppercase tracking-tight text-deep-navy">You May Also Like</h2>
              <Link href="/search" className="text-sm font-bold uppercase text-on-surface-variant hover:text-primary transition-colors">
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {RELATED.map((prod, i) => (
                <motion.div
                  key={prod.id}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                  className="group border border-deep-navy rounded-2xl overflow-hidden bg-white card-hover"
                >
                  <Link href={`/products/${prod.id}`} className="block aspect-square border-b border-deep-navy/20 bg-surface-container-low p-8">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-500"
                    />
                  </Link>
                  <div className="p-5 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-deep-navy">{prod.name}</h3>
                      <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mt-0.5">{prod.price}</p>
                    </div>
                    <button className="h-9 px-4 bg-primary-container text-deep-navy text-xs font-bold rounded-xl border-2 border-transparent hover:border-deep-navy transition-colors active:scale-[0.97]">
                      Add
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
