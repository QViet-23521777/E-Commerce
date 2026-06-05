"use client";

import ProductCard from "@/components/ProductCard";
import type { UIProduct } from "@/lib/products";

/**
 * A titled, horizontally-scrolling rail of products. Renders nothing when the
 * list is empty, so callers can mount it unconditionally and let it disappear
 * for users with no data (e.g. brand-new buyers with no history).
 */
export default function ProductRail({
  title,
  subtitle,
  products,
}: {
  title: string;
  subtitle?: string;
  products: UIProduct[];
}) {
  if (!products || products.length === 0) return null;

  return (
    <section className="max-w-[1280px] mx-auto px-10">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="h-px w-8 bg-primary flex-shrink-0" />
          <h2 className="text-headline-md font-bold text-deep-navy uppercase tracking-tight">
            {title}
          </h2>
        </div>
        {subtitle && (
          <span className="text-label-caps text-on-surface-variant tracking-widest">
            {subtitle}
          </span>
        )}
      </div>
      <div
        className="flex gap-4 overflow-x-auto pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {products.map((product) => (
          <div key={product.id} className="w-44 shrink-0">
            <ProductCard {...product} />
          </div>
        ))}
      </div>
    </section>
  );
}
