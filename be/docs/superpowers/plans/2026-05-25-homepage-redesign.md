# Homepage Redesign — Classic Marketplace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing lifestyle homepage with a Shopee/Lazada-style wide-category marketplace homepage using static data and the Nordic Frost design system.

**Architecture:** Five new reusable components (`ProductCard`, `CategoryChip`, `HeroBanner`, `FlashDealsSection`, `CategorySection`) are composed in a rewritten `page.tsx`. All data is hardcoded. No API calls. Existing `Navbar` and `Footer` are unchanged.

**Tech Stack:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS, framer-motion, lucide-react

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `fe-e.commerce/components/ProductCard.tsx` | Reusable product card used in flash deals, category zones, and "just for you" |
| Create | `fe-e.commerce/components/CategoryChip.tsx` | Category icon + label chip, navigates to search |
| Create | `fe-e.commerce/components/HeroBanner.tsx` | Split hero: 1 large panel + 2 small stacked panels |
| Create | `fe-e.commerce/components/FlashDealsSection.tsx` | Navy strip with countdown + horizontal scroll of compact deal cards |
| Create | `fe-e.commerce/components/CategorySection.tsx` | Category header + 4-product grid zone |
| Modify | `fe-e.commerce/app/page.tsx` | Full replacement: assemble all sections |

---

## Task 1: Create `ProductCard` component

**Files:**
- Create: `fe-e.commerce/components/ProductCard.tsx`

- [ ] **Step 1: Write the component**

```tsx
// fe-e.commerce/components/ProductCard.tsx
"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";

export interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  tag?: string;
  category?: string;
  compact?: boolean; // for flash deals strip
}

export default function ProductCard({
  id,
  name,
  price,
  originalPrice,
  image,
  tag,
  compact = false,
}: ProductCardProps) {
  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : null;

  if (compact) {
    return (
      <div className="flex-shrink-0 w-40 border border-white/20 bg-white/10 rounded-xl overflow-hidden group hover:border-primary-container transition-colors duration-200">
        <Link href={`/products/${id}`} className="block">
          <div className="aspect-square overflow-hidden bg-white/5 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt={name}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="p-2.5 space-y-1">
            <p className="text-xs font-medium text-white line-clamp-2 leading-tight">{name}</p>
            <p className="text-sm font-bold text-primary-container">${price.toFixed(2)}</p>
            {originalPrice && (
              <p className="text-[10px] text-white/40 line-through">${originalPrice.toFixed(2)}</p>
            )}
            {discount && (
              <span className="inline-block text-[10px] font-bold uppercase bg-primary-container text-deep-navy px-1.5 py-0.5 rounded">
                -{discount}%
              </span>
            )}
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className="border border-deep-navy bg-white flex flex-col group rounded-xl overflow-hidden hover:border-primary-container transition-colors duration-200">
      <Link
        href={`/products/${id}`}
        className="relative aspect-square border-b border-deep-navy/10 bg-surface-container-low overflow-hidden p-6 block"
      >
        {tag && (
          <span className="absolute top-3 left-3 bg-deep-navy text-primary-container text-[10px] font-bold uppercase px-2 py-0.5 rounded z-10">
            {tag}
          </span>
        )}
        {discount && !tag && (
          <span className="absolute top-3 left-3 bg-primary-container text-deep-navy text-[10px] font-bold uppercase px-2 py-0.5 rounded z-10">
            -{discount}%
          </span>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
        />
      </Link>
      <div className="p-4 space-y-3 flex flex-col flex-grow">
        <div className="flex-grow">
          <h3 className="text-sm font-bold text-deep-navy line-clamp-2 leading-snug">{name}</h3>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-base font-bold text-primary">${price.toFixed(2)}</span>
            {originalPrice && (
              <span className="text-xs text-on-surface-variant line-through">
                ${originalPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>
        <button className="w-full py-2.5 flex items-center justify-center gap-2 border border-deep-navy/20 rounded-lg text-xs font-bold uppercase hover:bg-deep-navy hover:text-primary-container transition-all duration-200 active:scale-[0.97]">
          <ShoppingCart className="w-3.5 h-3.5" />
          Add to Cart
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd fe-e.commerce && npx tsc --noEmit`
Expected: no errors related to `ProductCard.tsx`

- [ ] **Step 3: Commit**

```bash
git add fe-e.commerce/components/ProductCard.tsx
git commit -m "feat: add reusable ProductCard component"
```

---

## Task 2: Create `CategoryChip` component

**Files:**
- Create: `fe-e.commerce/components/CategoryChip.tsx`

- [ ] **Step 1: Write the component**

```tsx
// fe-e.commerce/components/CategoryChip.tsx
import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface CategoryChipProps {
  label: string;
  slug: string;
  Icon: LucideIcon;
}

export default function CategoryChip({ label, slug, Icon }: CategoryChipProps) {
  return (
    <Link
      href={`/search?category=${slug}`}
      className="flex flex-col items-center gap-2 group flex-shrink-0"
    >
      <div className="w-14 h-14 rounded-full border-2 border-deep-navy bg-white flex items-center justify-center group-hover:border-primary-container group-hover:bg-surface-container-low transition-all duration-200">
        <Icon className="w-6 h-6 text-deep-navy group-hover:text-primary transition-colors duration-200" strokeWidth={1.5} />
      </div>
      <span className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant group-hover:text-deep-navy transition-colors duration-200 text-center leading-tight max-w-[60px]">
        {label}
      </span>
    </Link>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd fe-e.commerce && npx tsc --noEmit`
Expected: no errors related to `CategoryChip.tsx`

- [ ] **Step 3: Commit**

```bash
git add fe-e.commerce/components/CategoryChip.tsx
git commit -m "feat: add CategoryChip component"
```

---

## Task 3: Create `HeroBanner` component

**Files:**
- Create: `fe-e.commerce/components/HeroBanner.tsx`

- [ ] **Step 1: Write the component**

```tsx
// fe-e.commerce/components/HeroBanner.tsx
"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

const PRIMARY_BANNER = {
  eyebrow: "Summer Sale",
  headline: "Up to 70%\nOff Everything",
  sub: "Millions of products, one destination.",
  cta: { label: "Shop Now", href: "/search" },
  bg: "bg-deep-navy",
  image: "https://picsum.photos/seed/shopbanner/800/600",
};

const SECONDARY_BANNERS = [
  {
    id: "electronics",
    eyebrow: "New Arrivals",
    headline: "Latest Electronics",
    cta: { label: "Explore", href: "/search?category=electronics" },
    bg: "bg-primary",
    image: "https://picsum.photos/seed/electronics/400/300",
  },
  {
    id: "grocery",
    eyebrow: "Fresh Daily",
    headline: "Food & Grocery",
    cta: { label: "Shop Fresh", href: "/search?category=food-grocery" },
    bg: "bg-secondary",
    image: "https://picsum.photos/seed/grocery/400/300",
  },
];

export default function HeroBanner() {
  return (
    <section className="max-w-[1280px] mx-auto px-10 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-auto lg:h-[420px]">
        {/* Primary banner */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className={`lg:col-span-7 relative rounded-2xl overflow-hidden border-2 border-deep-navy ${PRIMARY_BANNER.bg} flex flex-col justify-end p-8 min-h-[260px]`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={PRIMARY_BANNER.image}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-20"
          />
          <div className="relative z-10 space-y-4">
            <span className="text-label-caps text-primary-container tracking-widest">
              {PRIMARY_BANNER.eyebrow}
            </span>
            <h1 className="text-display-lg-mobile md:text-display-lg text-white font-bold leading-tight" style={{ whiteSpace: "pre-line" }}>
              {PRIMARY_BANNER.headline}
            </h1>
            <p className="text-body-md text-white/70">{PRIMARY_BANNER.sub}</p>
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
              transition={{ duration: 0.5, delay: i * 0.1 + 0.1, ease: EASE }}
              className={`relative rounded-2xl overflow-hidden border-2 border-deep-navy ${banner.bg} flex flex-col justify-end p-6 min-h-[120px]`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={banner.image}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-20"
              />
              <div className="relative z-10 space-y-2">
                <span className="text-label-caps text-white/70 tracking-widest">{banner.eyebrow}</span>
                <h2 className="text-headline-md text-white font-bold">{banner.headline}</h2>
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd fe-e.commerce && npx tsc --noEmit`
Expected: no errors related to `HeroBanner.tsx`

- [ ] **Step 3: Commit**

```bash
git add fe-e.commerce/components/HeroBanner.tsx
git commit -m "feat: add HeroBanner component"
```

---

## Task 4: Create `FlashDealsSection` component

**Files:**
- Create: `fe-e.commerce/components/FlashDealsSection.tsx`

- [ ] **Step 1: Write the component**

```tsx
// fe-e.commerce/components/FlashDealsSection.tsx
"use client";

import { Zap } from "lucide-react";
import { motion } from "motion/react";
import ProductCard, { ProductCardProps } from "./ProductCard";

const FLASH_DEALS: ProductCardProps[] = [
  { id: 101, name: "Wireless Earbuds Pro", price: 29.99, originalPrice: 79.99, image: "https://picsum.photos/seed/earbuds/400/400", category: "electronics" },
  { id: 102, name: "Smart Watch Series X", price: 89.99, originalPrice: 199.99, image: "https://picsum.photos/seed/smartwatch/400/400", category: "electronics" },
  { id: 103, name: "Portable Charger 20000mAh", price: 19.99, originalPrice: 49.99, image: "https://picsum.photos/seed/charger/400/400", category: "electronics" },
  { id: 104, name: "Running Shoes Ultra", price: 44.99, originalPrice: 110.00, image: "https://picsum.photos/seed/shoes/400/400", category: "sports" },
  { id: 105, name: "Skincare Glow Set", price: 24.99, originalPrice: 65.00, image: "https://picsum.photos/seed/skincare/400/400", category: "health-beauty" },
  { id: 106, name: "Coffee Maker Pro", price: 34.99, originalPrice: 89.99, image: "https://picsum.photos/seed/coffee/400/400", category: "home-living" },
];

export default function FlashDealsSection() {
  return (
    <section className="bg-deep-navy py-6">
      <div className="max-w-[1280px] mx-auto px-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-primary-container fill-primary-container" />
            <h2 className="text-headline-md font-bold text-white uppercase tracking-tight">
              Flash Deals
            </h2>
            {/* Static countdown */}
            <div className="flex items-center gap-1 ml-2">
              {["02", "34", "17"].map((unit, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="bg-primary-container text-deep-navy text-sm font-bold px-2 py-0.5 rounded tabular-nums">
                    {unit}
                  </span>
                  {i < 2 && <span className="text-primary-container font-bold">:</span>}
                </span>
              ))}
            </div>
          </div>
          <a href="/search?tag=flash-deal" className="text-primary-container text-sm font-bold hover:underline">
            See All →
          </a>
        </div>

        {/* Horizontal scroll */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd fe-e.commerce && npx tsc --noEmit`
Expected: no errors related to `FlashDealsSection.tsx`

- [ ] **Step 3: Commit**

```bash
git add fe-e.commerce/components/FlashDealsSection.tsx
git commit -m "feat: add FlashDealsSection component"
```

---

## Task 5: Create `CategorySection` component

**Files:**
- Create: `fe-e.commerce/components/CategorySection.tsx`

- [ ] **Step 1: Write the component**

```tsx
// fe-e.commerce/components/CategorySection.tsx
"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import ProductCard, { ProductCardProps } from "./ProductCard";

interface CategorySectionProps {
  title: string;
  slug: string;
  products: ProductCardProps[];
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 14, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.23, 1, 0.32, 1] } },
};

export default function CategorySection({ title, slug, products }: CategorySectionProps) {
  return (
    <div className="border-2 border-deep-navy rounded-2xl overflow-hidden bg-white">
      {/* Category header */}
      <div className="flex items-center justify-between px-6 py-4 border-b-2 border-deep-navy bg-surface-container-low">
        <h2 className="text-headline-md font-bold text-deep-navy uppercase tracking-tight">
          {title}
        </h2>
        <Link
          href={`/search?category=${slug}`}
          className="flex items-center gap-1.5 text-sm font-bold text-primary hover:text-deep-navy transition-colors"
        >
          See All <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      {/* Product grid */}
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        className="grid grid-cols-2 md:grid-cols-4 gap-px bg-deep-navy/10"
      >
        {products.slice(0, 4).map((product) => (
          <motion.div key={product.id} variants={fadeUp} className="bg-white">
            <ProductCard {...product} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd fe-e.commerce && npx tsc --noEmit`
Expected: no errors related to `CategorySection.tsx`

- [ ] **Step 3: Commit**

```bash
git add fe-e.commerce/components/CategorySection.tsx
git commit -m "feat: add CategorySection component"
```

---

## Task 6: Create data file with all homepage static data

**Files:**
- Create: `fe-e.commerce/lib/homepage-data.ts`

- [ ] **Step 1: Write the data file**

```ts
// fe-e.commerce/lib/homepage-data.ts
import {
  Monitor, ShoppingBag, UtensilsCrossed, Home, Heart,
  Dumbbell, BookOpen, Baby, Car, PawPrint
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ProductCardProps } from "@/components/ProductCard";

export interface CategoryChipData {
  label: string;
  slug: string;
  Icon: LucideIcon;
}

export const BROWSE_CATEGORIES: CategoryChipData[] = [
  { label: "Electronics", slug: "electronics", Icon: Monitor },
  { label: "Fashion", slug: "fashion", Icon: ShoppingBag },
  { label: "Food & Grocery", slug: "food-grocery", Icon: UtensilsCrossed },
  { label: "Home & Living", slug: "home-living", Icon: Home },
  { label: "Health & Beauty", slug: "health-beauty", Icon: Heart },
  { label: "Sports", slug: "sports", Icon: Dumbbell },
  { label: "Books", slug: "books", Icon: BookOpen },
  { label: "Toys & Baby", slug: "toys-baby", Icon: Baby },
  { label: "Automotive", slug: "automotive", Icon: Car },
  { label: "Pet Supplies", slug: "pet-supplies", Icon: PawPrint },
];

export const ELECTRONICS_PRODUCTS: ProductCardProps[] = [
  { id: 201, name: "4K Smart TV 55\"", price: 399.99, originalPrice: 599.99, image: "https://picsum.photos/seed/tv/400/400", category: "electronics", tag: "Hot" },
  { id: 202, name: "Laptop Pro 14 i7", price: 849.99, originalPrice: 1199.99, image: "https://picsum.photos/seed/laptop/400/400", category: "electronics" },
  { id: 203, name: "Noise Cancelling Headphones", price: 149.99, originalPrice: 249.99, image: "https://picsum.photos/seed/headphones/400/400", category: "electronics" },
  { id: 204, name: "Mechanical Keyboard RGB", price: 79.99, originalPrice: 129.99, image: "https://picsum.photos/seed/keyboard/400/400", category: "electronics" },
];

export const FASHION_PRODUCTS: ProductCardProps[] = [
  { id: 301, name: "Linen Summer Dress", price: 34.99, originalPrice: 59.99, image: "https://picsum.photos/seed/dress/400/400", category: "fashion", tag: "New" },
  { id: 302, name: "Classic White Sneakers", price: 49.99, originalPrice: 89.99, image: "https://picsum.photos/seed/sneakers/400/400", category: "fashion" },
  { id: 303, name: "Crossbody Leather Bag", price: 64.99, originalPrice: 110.00, image: "https://picsum.photos/seed/bag/400/400", category: "fashion" },
  { id: 304, name: "Floral Blouse Collection", price: 24.99, originalPrice: 44.99, image: "https://picsum.photos/seed/blouse/400/400", category: "fashion" },
];

export const GROCERY_PRODUCTS: ProductCardProps[] = [
  { id: 401, name: "Organic Grain Bundle", price: 12.99, originalPrice: 18.99, image: "https://picsum.photos/seed/grain/400/400", category: "food-grocery" },
  { id: 402, name: "Premium Olive Oil 500ml", price: 9.99, originalPrice: 15.99, image: "https://picsum.photos/seed/oliveoil/400/400", category: "food-grocery" },
  { id: 403, name: "Herbal Tea Collection", price: 7.99, originalPrice: 13.99, image: "https://picsum.photos/seed/tea/400/400", category: "food-grocery" },
  { id: 404, name: "Nuts & Seeds Mix 500g", price: 8.49, originalPrice: 12.99, image: "https://picsum.photos/seed/nuts/400/400", category: "food-grocery" },
];

export const JUST_FOR_YOU: ProductCardProps[] = [
  { id: 501, name: "Bluetooth Speaker Mini", price: 24.99, originalPrice: 49.99, image: "https://picsum.photos/seed/speaker/400/400" },
  { id: 502, name: "Yoga Mat Premium", price: 19.99, originalPrice: 39.99, image: "https://picsum.photos/seed/yogamat/400/400" },
  { id: 503, name: "Vitamin C Serum 30ml", price: 14.99, originalPrice: 29.99, image: "https://picsum.photos/seed/serum/400/400" },
  { id: 504, name: "Ceramic Mug Set (4)", price: 22.99, originalPrice: 39.99, image: "https://picsum.photos/seed/mugs/400/400" },
  { id: 505, name: "Running Socks Pack 6", price: 9.99, originalPrice: 17.99, image: "https://picsum.photos/seed/socks/400/400" },
  { id: 506, name: "Desk Organizer Wood", price: 18.99, originalPrice: 32.99, image: "https://picsum.photos/seed/organizer/400/400" },
  { id: 507, name: "Travel Pillow Memory Foam", price: 16.99, originalPrice: 29.99, image: "https://picsum.photos/seed/pillow/400/400" },
  { id: 508, name: "Resistance Band Set", price: 11.99, originalPrice: 22.99, image: "https://picsum.photos/seed/bands/400/400" },
  { id: 509, name: "Scented Candle Set", price: 21.99, originalPrice: 39.99, image: "https://picsum.photos/seed/candles/400/400" },
  { id: 510, name: "Phone Stand Adjustable", price: 8.99, originalPrice: 15.99, image: "https://picsum.photos/seed/phonestand/400/400" },
  { id: 511, name: "Reusable Water Bottle", price: 13.99, originalPrice: 24.99, image: "https://picsum.photos/seed/bottle/400/400" },
  { id: 512, name: "Wireless Mouse Slim", price: 17.99, originalPrice: 34.99, image: "https://picsum.photos/seed/mouse/400/400" },
  { id: 513, name: "Bamboo Cutting Board", price: 15.99, originalPrice: 27.99, image: "https://picsum.photos/seed/cuttingboard/400/400" },
  { id: 514, name: "Face Roller Jade", price: 10.99, originalPrice: 21.99, image: "https://picsum.photos/seed/roller/400/400" },
  { id: 515, name: "LED Desk Lamp USB", price: 20.99, originalPrice: 39.99, image: "https://picsum.photos/seed/lamp/400/400" },
  { id: 516, name: "Protein Shake Shaker", price: 7.99, originalPrice: 14.99, image: "https://picsum.photos/seed/shaker/400/400" },
  { id: 517, name: "Canvas Tote Bag", price: 12.99, originalPrice: 22.99, image: "https://picsum.photos/seed/tote/400/400" },
  { id: 518, name: "Herb Garden Starter Kit", price: 17.99, originalPrice: 30.99, image: "https://picsum.photos/seed/herbs/400/400" },
  { id: 519, name: "Sleep Eye Mask Silk", price: 9.99, originalPrice: 18.99, image: "https://picsum.photos/seed/eyemask/400/400" },
  { id: 520, name: "Mini Fan USB Rechargeable", price: 11.99, originalPrice: 21.99, image: "https://picsum.photos/seed/minifan/400/400" },
];
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd fe-e.commerce && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add fe-e.commerce/lib/homepage-data.ts
git commit -m "feat: add homepage static data"
```

---

## Task 7: Rewrite `page.tsx` with the new marketplace homepage

**Files:**
- Modify: `fe-e.commerce/app/page.tsx` (full replacement)

- [ ] **Step 1: Replace page.tsx entirely**

```tsx
// fe-e.commerce/app/page.tsx
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

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.23, 1, 0.32, 1] as [number,number,number,number] } },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Announcement bar */}
      <div className="bg-deep-navy text-neon-cyan text-label-caps text-center py-2.5 tracking-widest">
        FREE SHIPPING ON ORDERS OVER $50 &nbsp;·&nbsp; FLASH DEALS EVERY DAY &nbsp;·&nbsp; MILLIONS OF PRODUCTS
      </div>

      <Navbar />

      <main className="space-y-8 pb-16">
        {/* 1. Hero Banner */}
        <HeroBanner />

        {/* 2. Browse Categories */}
        <section className="max-w-[1280px] mx-auto px-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-headline-md font-bold text-deep-navy uppercase tracking-tight">
              Browse Categories
            </h2>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
            {BROWSE_CATEGORIES.map((cat) => (
              <CategoryChip key={cat.slug} label={cat.label} slug={cat.slug} Icon={cat.Icon} />
            ))}
          </div>
        </section>

        {/* 3. Flash Deals */}
        <FlashDealsSection />

        {/* 4. Shop by Category zones */}
        <section className="max-w-[1280px] mx-auto px-10 space-y-6">
          <CategorySection title="Electronics" slug="electronics" products={ELECTRONICS_PRODUCTS} />
          <CategorySection title="Women's Fashion" slug="fashion" products={FASHION_PRODUCTS} />
          <CategorySection title="Food & Grocery" slug="food-grocery" products={GROCERY_PRODUCTS} />
        </section>

        {/* 5. Just for You */}
        <section className="max-w-[1280px] mx-auto px-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-8 bg-primary flex-shrink-0" />
            <h2 className="text-headline-md font-bold text-deep-navy uppercase tracking-tight">
              Just for You
            </h2>
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd fe-e.commerce && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Check the dev server renders correctly**

Run: `cd fe-e.commerce && npm run dev`

Open `http://localhost:3000` and verify:
- Announcement bar visible
- Hero banner with primary (large) + two secondary (stacked) panels
- "Browse Categories" horizontal scroll row with 10 chips
- Flash Deals navy strip with countdown + 6 compact product cards
- Three category sections (Electronics, Women's Fashion, Food & Grocery), each with 4 product cards
- "Just for You" grid with 20 product cards (5 columns on desktop)
- No console errors

- [ ] **Step 4: Commit**

```bash
git add fe-e.commerce/app/page.tsx fe-e.commerce/lib/homepage-data.ts
git commit -m "feat: marketplace homepage redesign - classic layout"
```

---

## Self-Review Checklist

- [x] All 8 spec sections covered: announcement bar, navbar (unchanged), hero, category chips, flash deals, 3 category zones, just for you, footer
- [x] No TBD/TODO placeholders — all steps have real code
- [x] `ProductCardProps` interface defined in Task 1 and imported consistently in Tasks 4, 5, 6, 7
- [x] `CategoryChip` receives `Icon: LucideIcon` in Task 2, and data file exports `Icon: LucideIcon` in Task 6 — consistent
- [x] Data file created as Task 6 (before Task 7 which imports it) — correct ordering
- [x] `compact` prop on ProductCard used in FlashDealsSection (Task 4) — defined in Task 1 ✓
