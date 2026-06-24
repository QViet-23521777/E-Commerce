"use client";

import Link from "next/link";
import { useState } from "react";
import { ShoppingCart, Check, Star } from "lucide-react";
import { formatVND } from "@/lib/products";
import { addToCart } from "@/lib/cart";
import { getUser } from "@/lib/auth";
import { postActivity } from "@/lib/activity";

export interface ProductCardProps {
  id: string | number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  tag?: string;
  category?: string;
  compact?: boolean;
  currency?: "VND" | "USD";
  rating?: number;
  numReviews?: number;
}

export default function ProductCard({
  id,
  name,
  price,
  originalPrice,
  image,
  tag,
  compact = false,
  currency = "VND",
  rating,
  numReviews,
}: ProductCardProps) {
  const [added, setAdded] = useState(false);
  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : null;
  const fmt = (n: number) =>
    currency === "VND" ? formatVND(n) : `$${n.toFixed(2)}`;

  const handleClick = () => {
    const user = getUser();
    if (user) {
      postActivity({ userId: user.userId, activity: "click", productId: String(id) });
    }
  };

  const handleAddToCart = () => {
    addToCart({ productId: String(id), name, image, price, qty: 1 });
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  if (compact) {
    return (
      <div className="flex-shrink-0 w-40 border border-white/20 bg-white/10 rounded-xl overflow-hidden group hover:border-primary-container transition-colors duration-200">
        <Link href={`/products/${id}`} className="block" onClick={handleClick}>
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
            <p className="text-sm font-bold text-primary-container">{fmt(price)}</p>
            {originalPrice && (
              <p className="text-[10px] text-white/40 line-through">{fmt(originalPrice)}</p>
            )}
            {discount && (
              <span className="inline-block text-[10px] font-bold bg-primary-container text-deep-navy px-1.5 py-0.5 rounded">
                -{discount}%
              </span>
            )}
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className="border border-deep-navy bg-white flex flex-col group rounded-xl overflow-hidden card-hover">
      <Link
        href={`/products/${id}`}
        onClick={handleClick}
        className="relative aspect-square border-b border-deep-navy/10 bg-surface-container-low overflow-hidden p-5 block"
      >
        {tag && (
          <span className="absolute top-3 left-3 bg-deep-navy text-primary-container text-[10px] font-bold uppercase px-2 py-0.5 rounded z-10 tracking-wider">
            {tag}
          </span>
        )}
        {discount && !tag && (
          <span className="absolute top-3 left-3 bg-primary-container text-deep-navy text-[10px] font-bold uppercase px-2 py-0.5 rounded z-10 tracking-wider">
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
          <h3 className="text-sm font-semibold text-deep-navy line-clamp-2 leading-snug">{name}</h3>
          {typeof rating === "number" && rating > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs font-bold text-deep-navy">{rating.toFixed(1)}</span>
              {typeof numReviews === "number" && numReviews > 0 && (
                <span className="text-xs text-on-surface-variant">({numReviews})</span>
              )}
            </div>
          )}
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-base font-bold text-primary">{fmt(price)}</span>
            {originalPrice && (
              <span className="text-xs text-on-surface-variant line-through">
                {fmt(originalPrice)}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleAddToCart}
          aria-label={`Add ${name} to cart`}
          className={`w-full py-2.5 flex items-center justify-center gap-2 border-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 active:scale-[0.97] ${
            added
              ? "border-deep-navy bg-deep-navy text-primary-container"
              : "border-deep-navy/30 text-deep-navy hover:border-deep-navy hover:bg-deep-navy hover:text-primary-container"
          }`}
        >
          {added ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Added
            </>
          ) : (
            <>
              <ShoppingCart className="w-3.5 h-3.5" />
              Add to Cart
            </>
          )}
        </button>
      </div>
    </div>
  );
}