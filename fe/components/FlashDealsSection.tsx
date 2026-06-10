"use client";

import { Zap } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import { fetchTopSale, type UIProduct } from "@/lib/products";

export default function FlashDealsSection() {
  const [deals, setDeals] = useState<UIProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const items = await fetchTopSale(10);
        if (!cancelled) setDeals(items);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Nothing on sale and finished loading — hide the strip entirely.
  if (!loading && deals.length === 0) return null;

  return (
    <section className="bg-deep-navy py-6 border-y-2 border-deep-navy">
      <div className="max-w-[1280px] mx-auto px-10">
        {/* Header row */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-primary-container fill-primary-container" />
            <h2 className="text-headline-md font-bold text-white uppercase tracking-tight">
              Flash Deals
            </h2>
            {/* Countdown timer — static display */}
            <div className="flex items-center gap-1 ml-3">
              {["02", "34", "17"].map((unit, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="bg-primary-container text-deep-navy text-sm font-bold px-2 py-0.5 rounded tabular-nums leading-none">
                    {unit}
                  </span>
                  {i < 2 && <span className="text-primary-container/60 font-bold text-sm">:</span>}
                </span>
              ))}
            </div>
          </div>
          <a
            href="/search?sale=1"
            className="text-primary-container text-sm font-bold hover:underline underline-offset-2 tracking-wide"
          >
            See All →
          </a>
        </div>

        {/* Horizontal scroll strip */}
        {loading ? (
          <div
            className="flex gap-3 overflow-x-auto pb-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-40 rounded-xl overflow-hidden border border-white/20 bg-white/10"
              >
                <div className="aspect-square bg-white/10 animate-pulse" />
                <div className="p-2.5 space-y-2">
                  <div className="h-3 bg-white/15 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-white/15 rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="flex gap-3 overflow-x-auto pb-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {deals.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={product.price}
                originalPrice={product.originalPrice}
                image={product.image}
                tag={product.tag}
                category={product.category}
                compact
              />
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
