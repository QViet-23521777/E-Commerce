"use client";

import { Zap } from "lucide-react";
import { motion } from "motion/react";
import ProductCard, { ProductCardProps } from "./ProductCard";

const FLASH_DEALS: ProductCardProps[] = [
  {
    id: 101,
    name: "Wireless Earbuds Pro",
    price: 29.99,
    originalPrice: 79.99,
    image: "https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=400&q=80",
    category: "electronics",
    compact: true,
  },
  {
    id: 102,
    name: "Smart Watch Series X",
    price: 89.99,
    originalPrice: 199.99,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80",
    category: "electronics",
    compact: true,
  },
  {
    id: 103,
    name: "Portable Charger 20000mAh",
    price: 19.99,
    originalPrice: 49.99,
    image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&q=80",
    category: "electronics",
    compact: true,
  },
  {
    id: 104,
    name: "Running Shoes Ultra",
    price: 44.99,
    originalPrice: 110.0,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
    category: "sports",
    compact: true,
  },
  {
    id: 105,
    name: "Skincare Glow Set",
    price: 24.99,
    originalPrice: 65.0,
    image: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&q=80",
    category: "health-beauty",
    compact: true,
  },
  {
    id: 106,
    name: "Coffee Maker Pro",
    price: 34.99,
    originalPrice: 89.99,
    image: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400&q=80",
    category: "home-living",
    compact: true,
  },
  {
    id: 107,
    name: "Yoga Mat Premium",
    price: 19.99,
    originalPrice: 44.99,
    image: "https://images.unsplash.com/photo-1601925228907-5e2e654a5de5?w=400&q=80",
    category: "sports",
    compact: true,
  },
  {
    id: 108,
    name: "Mechanical Keyboard",
    price: 59.99,
    originalPrice: 129.99,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&q=80",
    category: "electronics",
    compact: true,
  },
];

export default function FlashDealsSection() {
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
            href="/search?tag=flash-deal"
            className="text-primary-container text-sm font-bold hover:underline underline-offset-2 tracking-wide"
          >
            See All →
          </a>
        </div>

        {/* Horizontal scroll strip */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="flex gap-3 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {FLASH_DEALS.map((product) => (
            <ProductCard key={product.id} {...product} compact />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
