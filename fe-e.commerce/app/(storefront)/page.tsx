"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import HeroBanner from "@/components/HeroBanner";
import FlashDealsSection from "@/components/FlashDealsSection";
import CategorySection from "@/components/CategorySection";
import CategoryChip from "@/components/CategoryChip";
import ProductCard from "@/components/ProductCard";
import ProductRail from "@/components/ProductRail";
import { BROWSE_CATEGORIES, toCategoryChips, type CategoryChipData } from "@/lib/homepage-data";
import { fetchCategories } from "@/lib/support";
import {
  fetchTopByType,
  fetchTopPoint,
  fetchTopPurchases,
  fetchTopSale,
  type UIProduct,
} from "@/lib/products";
import { fetchRecommendedForYou, fetchRecentlyViewed } from "@/lib/recommendations";
import { getUser } from "@/lib/auth";

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

// Must match the canonical product `type` values in the catalogue (see
// BROWSE_CATEGORIES). Lowercase retail slugs match nothing and render an empty
// "Shop by Category" section.
const FEATURED_TYPES = ["Electronics", "Fashion", "Kitchenware"] as const;
const FEATURED_TITLES: Record<(typeof FEATURED_TYPES)[number], string> = {
  Electronics: "Electronics",
  Fashion: "Fashion",
  Kitchenware: "Kitchenware",
};

export default function Home() {
  const [byType, setByType] = useState<Record<string, UIProduct[]>>({});
  const [justForYou, setJustForYou] = useState<UIProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryChipData[]>(BROWSE_CATEGORIES);
  const [recommended, setRecommended] = useState<UIProduct[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<UIProduct[]>([]);

  // Personalised rails (logged-in buyers only) — derived from the activity
  // pipeline. Best-effort: any failure just leaves the rail empty/hidden.
  useEffect(() => {
    const user = getUser();
    if (!user?.userId) return;
    let cancelled = false;
    (async () => {
      const [recs, recent] = await Promise.all([
        fetchRecommendedForYou(user.userId, 12),
        fetchRecentlyViewed(user.userId, 10),
      ]);
      if (cancelled) return;
      setRecommended(recs);
      setRecentlyViewed(recent);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Prefer the admin-managed categories; fall back to the static list.
      const cats = await fetchCategories().catch(() => []);
      if (!cancelled && cats.length) setCategories(toCategoryChips(cats));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [typeResults, purchases, sale, point] = await Promise.all([
          Promise.all(FEATURED_TYPES.map((t) => fetchTopByType(t, 4))),
          fetchTopPurchases(8),
          fetchTopSale(8),
          fetchTopPoint(8),
        ]);
        if (cancelled) return;

        const map: Record<string, UIProduct[]> = {};
        FEATURED_TYPES.forEach((t, i) => (map[t] = typeResults[i]));
        setByType(map);

        // Mix purchases, sale and point for "Just for You", dedupe.
        const seen = new Set<string>();
        const mix: UIProduct[] = [];
        for (const list of [purchases, point, sale]) {
          for (const p of list) {
            if (!seen.has(p.id)) {
              seen.add(p.id);
              mix.push(p);
            }
          }
        }
        setJustForYou(mix.slice(0, 20));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background font-sans">
      <div className="bg-deep-navy text-neon-cyan text-label-caps text-center py-2.5 tracking-widest overflow-hidden">
        <span>
          FREE SHIPPING ON ORDERS OVER 500.000₫ &nbsp;·&nbsp; FLASH DEALS EVERY DAY &nbsp;·&nbsp; MILLIONS OF PRODUCTS
        </span>
      </div>


      <main className="pb-20 space-y-8">
        <HeroBanner />

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
            {categories.map((cat) => (
              <CategoryChip key={cat.slug} label={cat.label} slug={cat.slug} Icon={cat.Icon} />
            ))}
          </div>
        </section>

        <FlashDealsSection />

        <ProductRail
          title="Recommended for You"
          subtitle="Based on your activity"
          products={recommended}
        />

        <ProductRail
          title="Recently Viewed"
          subtitle="Pick up where you left off"
          products={recentlyViewed}
        />

        <section className="max-w-[1280px] mx-auto px-10 space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-px w-8 bg-primary flex-shrink-0" />
            <h2 className="text-headline-md font-bold text-deep-navy uppercase tracking-tight">
              Shop by Category
            </h2>
          </div>
          {FEATURED_TYPES.map((t) => {
            const products = byType[t] ?? [];
            if (loading && products.length === 0) {
              return <CategorySkeleton key={t} title={FEATURED_TITLES[t]} />;
            }
            if (products.length === 0) return null;
            return (
              <CategorySection
                key={t}
                title={FEATURED_TITLES[t]}
                slug={t}
                products={products}
              />
            );
          })}
        </section>

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

          {loading && justForYou.length === 0 ? (
            <GridSkeleton count={10} />
          ) : (
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4"
            >
              {justForYou.map((product) => (
                <motion.div key={product.id} variants={fadeUp}>
                  <ProductCard {...product} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>
      </main>

    </div>
  );
}

function CategorySkeleton({ title }: { title: string }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px w-8 bg-primary flex-shrink-0" />
        <h2 className="text-headline-md font-bold text-deep-navy uppercase tracking-tight">
          {title}
        </h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

function GridSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="border border-deep-navy/20 bg-white rounded-xl overflow-hidden">
      <div className="aspect-square bg-surface-container-low animate-pulse" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-surface-container-high rounded animate-pulse w-3/4" />
        <div className="h-4 bg-surface-container-high rounded animate-pulse w-1/2" />
      </div>
    </div>
  );
}
