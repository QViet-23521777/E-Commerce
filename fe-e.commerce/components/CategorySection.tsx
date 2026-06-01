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
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] },
  },
};

export default function CategorySection({ title, slug, products }: CategorySectionProps) {
  return (
    <div>
      {/* Category header — matches page-level section heading style */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-px w-8 bg-primary flex-shrink-0" />
          <h2 className="text-headline-md font-bold text-deep-navy uppercase tracking-tight">
            {title}
          </h2>
        </div>
        <Link
          href={`/search?category=${slug}`}
          className="flex items-center gap-1.5 text-sm font-bold text-primary hover:text-deep-navy transition-colors"
        >
          See All <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Product grid with breathing room between cards */}
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {products.slice(0, 4).map((product) => (
          <motion.div key={product.id} variants={fadeUp}>
            <ProductCard {...product} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
