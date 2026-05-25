"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

const PRIMARY_BANNER = {
  eyebrow: "Summer Sale · Limited Time",
  headline: "Up to 70%\nOff Everything",
  sub: "Millions of products across every category. One destination.",
  cta: { label: "Shop Now", href: "/search" },
  image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=900&q=80",
};

const SECONDARY_BANNERS = [
  {
    id: "electronics",
    eyebrow: "New Arrivals",
    headline: "Latest Electronics",
    cta: { label: "Explore", href: "/search?category=electronics" },
    image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80",
    accent: "bg-secondary",
  },
  {
    id: "grocery",
    eyebrow: "Fresh Daily",
    headline: "Food & Grocery",
    cta: { label: "Shop Fresh", href: "/search?category=food-grocery" },
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80",
    accent: "bg-tertiary",
  },
];

export default function HeroBanner() {
  return (
    <section className="max-w-[1280px] mx-auto px-10 pt-6 pb-2">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:h-[400px]">
        {/* Primary banner */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: EASE }}
          className="lg:col-span-7 relative rounded-2xl overflow-hidden border-2 border-deep-navy bg-deep-navy flex flex-col justify-end p-8 md:p-10 min-h-[260px]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={PRIMARY_BANNER.image}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover opacity-15 mix-blend-luminosity"
          />
          {/* Gradient overlay for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-deep-navy/95 via-deep-navy/60 to-transparent" />

          <div className="relative z-10 space-y-4">
            <span className="text-label-caps text-primary-container tracking-widest">
              {PRIMARY_BANNER.eyebrow}
            </span>
            <h1
              className="text-display-lg-mobile md:text-display-lg text-white font-bold"
              style={{ whiteSpace: "pre-line" }}
            >
              {PRIMARY_BANNER.headline}
            </h1>
            <p className="text-body-md text-white/60 max-w-xs">{PRIMARY_BANNER.sub}</p>
            <Link
              href={PRIMARY_BANNER.cta.href}
              className="inline-flex items-center gap-2 bg-primary-container text-deep-navy px-6 py-3 rounded-xl text-label-caps font-bold hover:opacity-90 transition-opacity active:scale-[0.97]"
            >
              {PRIMARY_BANNER.cta.label} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>

        {/* Secondary banners */}
        <div className="lg:col-span-5 grid grid-rows-2 gap-4">
          {SECONDARY_BANNERS.map((banner, i) => (
            <motion.div
              key={banner.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 + 0.15, ease: EASE }}
              className={`relative rounded-2xl overflow-hidden border-2 border-deep-navy ${banner.accent} flex flex-col justify-end p-6 min-h-[110px]`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={banner.image}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-luminosity"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              <div className="relative z-10 space-y-1.5">
                <span className="text-label-caps text-white/60 tracking-widest">{banner.eyebrow}</span>
                <h2 className="text-xl font-bold text-white leading-tight">{banner.headline}</h2>
                <Link
                  href={banner.cta.href}
                  className="inline-flex items-center gap-1.5 text-primary-container text-sm font-bold hover:underline"
                >
                  {banner.cta.label} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
