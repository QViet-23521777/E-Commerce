"use client";

import { motion } from "motion/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroBanner from "@/components/HeroBanner";
import FlashDealsSection from "@/components/FlashDealsSection";
import CategorySection from "@/components/CategorySection";
import CategoryChip from "@/components/CategoryChip";
import ProductCard from "@/components/ProductCard";
import {
  BROWSE_CATEGORIES,
  ELECTRONICS_PRODUCTS,
  FASHION_PRODUCTS,
  GROCERY_PRODUCTS,
  JUST_FOR_YOU,
} from "@/lib/homepage-data";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.32, ease: EASE },
  },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Announcement bar */}
      <div className="bg-deep-navy text-neon-cyan text-label-caps text-center py-2.5 tracking-widest overflow-hidden">
        <span>
          FREE SHIPPING ON ORDERS OVER $50 &nbsp;·&nbsp; FLASH DEALS EVERY DAY &nbsp;·&nbsp; MILLIONS OF PRODUCTS
        </span>
      </div>

      <Navbar />

      <main className="pb-20 space-y-8">
        {/* ── 1. Hero Banner ── */}
        <HeroBanner />

        {/* ── 2. Browse Categories ── */}
        <section className="max-w-[1280px] mx-auto px-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px w-8 bg-primary flex-shrink-0" />
            <h2 className="text-headline-md font-bold text-deep-navy uppercase tracking-tight">
              Browse Categories
            </h2>
          </div>
          <div
            className="flex gap-7 overflow-x-auto pb-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {BROWSE_CATEGORIES.map((cat) => (
              <CategoryChip key={cat.slug} label={cat.label} slug={cat.slug} Icon={cat.Icon} />
            ))}
          </div>
        </section>

        {/* ── 3. Flash Deals ── */}
        <FlashDealsSection />

        {/* ── 4. Shop by Category ── */}
        <section className="max-w-[1280px] mx-auto px-10 space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-px w-8 bg-primary flex-shrink-0" />
            <h2 className="text-headline-md font-bold text-deep-navy uppercase tracking-tight">
              Shop by Category
            </h2>
          </div>
          <CategorySection
            title="Electronics"
            slug="electronics"
            products={ELECTRONICS_PRODUCTS}
          />
          <CategorySection
            title="Women&apos;s Fashion"
            slug="fashion"
            products={FASHION_PRODUCTS}
          />
          <CategorySection
            title="Food &amp; Grocery"
            slug="food-grocery"
            products={GROCERY_PRODUCTS}
          />
        </section>

        {/* ── 5. Just for You ── */}
        <section className="max-w-[1280px] mx-auto px-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-primary flex-shrink-0" />
              <h2 className="text-headline-md font-bold text-deep-navy uppercase tracking-tight">
                Just for You
              </h2>
            </div>
            <span className="text-label-caps text-on-surface-variant tracking-widest">
              Personalised picks
            </span>
          </div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4"
          >
            {JUST_FOR_YOU.map((product) => (
              <motion.div key={product.id} variants={fadeUp}>
                <ProductCard {...product} />
              </motion.div>
            ))}
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
