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

      {/* Product grid — separated by 1px lines for a structured look */}
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        className="grid grid-cols-2 md:grid-cols-4"
      >
        {products.slice(0, 4).map((product, i) => (
          <motion.div
            key={product.id}
            variants={fadeUp}
            className={`bg-white ${i < 3 ? "border-r border-deep-navy/10" : ""}`}
          >
            <ProductCard {...product} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
