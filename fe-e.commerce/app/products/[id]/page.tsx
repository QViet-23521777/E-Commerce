"use client";

import {
  ChevronRight,
  Heart,
  ShoppingCart,
  Minus,
  Plus,
  Store,
  MapPin,
  MessageCircle,
  Package,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  fetchInventoryByName,
  fetchProductById,
  fetchShopByProduct,
  fetchTopByType,
  formatVND,
  type ShopOfProduct,
  type UIProduct,
} from "@/lib/products";
import { fetchSellerPublicProfile, type PublicShop } from "@/lib/seller";
import { addToCart } from "@/lib/cart";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [product, setProduct] = useState<UIProduct | null>(null);
  const [related, setRelated] = useState<UIProduct[]>([]);
  const [stock, setStock] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [activeTab, setActiveTab] = useState("specs");
  const [shop, setShop] = useState<PublicShop | null>(null);
  const [shopStats, setShopStats] = useState<ShopOfProduct | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setNotFound(false);
      const p = await fetchProductById(id);
      if (cancelled) return;
      if (!p) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setProduct(p);
      setLoading(false);

      fetchShopByProduct(p.id).then(async (stats) => {
        if (cancelled || !stats) return;
        setShopStats(stats);
        const sp = await fetchSellerPublicProfile(stats.sellerId);
        if (!cancelled) setShop(sp);
      });

      const [rel, hits] = await Promise.all([
        p.type ? fetchTopByType(p.type, 6) : Promise.resolve([] as UIProduct[]),
        fetchInventoryByName(p.name),
      ]);
      if (cancelled) return;
      setRelated(rel.filter((r) => r.id !== p.id).slice(0, 3));
      if (hits.length === 0) {
        setStock(null);
      } else {
        const total = hits.reduce((sum, h) => sum + (Number(h.quantity) || 0), 0);
        setStock(total);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      productId: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      qty: quantity,
      variant: product.type,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-[1280px] mx-auto px-10 py-12 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="aspect-square bg-surface-container-low animate-pulse rounded-2xl" />
            <div className="space-y-4">
              <div className="h-8 bg-surface-container-high rounded animate-pulse w-2/3" />
              <div className="h-12 bg-surface-container-high rounded animate-pulse w-full" />
              <div className="h-4 bg-surface-container-high rounded animate-pulse w-1/2" />
              <div className="h-32 bg-surface-container-low rounded animate-pulse w-full" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-10 py-24">
          <div className="text-center space-y-3">
            <p className="text-headline-md font-bold text-deep-navy">Product not found</p>
            <p className="text-sm text-on-surface-variant">
              The product you&apos;re looking for may have been removed.
            </p>
            <Link
              href="/"
              className="inline-block mt-4 h-11 px-6 bg-primary-container text-deep-navy text-sm font-bold rounded-xl border-2 border-transparent hover:border-deep-navy"
            >
              Back to home
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const inStock = stock === null ? true : stock > 0;
  const stockLabel =
    stock === null
      ? "Stock managed by sellers"
      : stock > 0
        ? `${stock} in stock`
        : "Out of stock";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="border-b border-outline-variant bg-white">
          <div className="max-w-[1280px] mx-auto px-10 py-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            <Link href="/" className="hover:text-deep-navy transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            {product.type && (
              <>
                <Link
                  href={`/search?category=${encodeURIComponent(product.type)}`}
                  className="hover:text-deep-navy transition-colors"
                >
                  {product.type}
                </Link>
                <ChevronRight className="w-3 h-3" />
              </>
            )}
            <span className="text-deep-navy line-clamp-1">{product.name}</span>
          </div>
        </div>

        <div className="max-w-[1280px] mx-auto px-10 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="space-y-4"
            >
              <div className="relative aspect-square border-2 border-deep-navy rounded-2xl overflow-hidden bg-surface-container-low">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-contain p-12"
                />
                {product.salePercent && product.salePercent > 0 ? (
                  <span className="absolute top-5 left-5 bg-deep-navy text-primary-container text-[10px] font-bold uppercase px-3 py-1 rounded-lg tracking-widest">
                    -{product.salePercent}%
                  </span>
                ) : null}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
              className="space-y-8"
            >
              <div className="space-y-3">
                {product.tag && (
                  <span className="inline-block px-3 py-1 bg-deep-navy text-primary-container text-[10px] font-bold uppercase tracking-widest rounded-lg">
                    {product.tag}
                  </span>
                )}
                <h1 className="text-display-lg-mobile text-deep-navy">{product.name}</h1>
                {product.type && (
                  <p className="text-xs uppercase tracking-widest text-on-surface-variant">{product.type}</p>
                )}
                <div className="flex items-baseline gap-4">
                  <p className="text-3xl font-bold tracking-tight text-deep-navy">
                    {formatVND(product.price)}
                  </p>
                  {product.originalPrice && (
                    <p className="text-lg text-on-surface-variant line-through">
                      {formatVND(product.originalPrice)}
                    </p>
                  )}
                </div>
                {product.point ? (
                  <p className="text-xs font-semibold text-primary">
                    Earn {product.point} reward points
                  </p>
                ) : null}
              </div>

              {product.description && (
                <p className="text-body-md text-on-surface-variant">
                  {product.description}
                </p>
              )}

              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-widest text-deep-navy">Quantity</span>
                <div className="flex items-center border-2 border-deep-navy rounded-xl overflow-hidden w-fit">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-11 h-11 flex items-center justify-center hover:bg-surface-container transition-colors active:scale-[0.97]"
                  >
                    <Minus className="w-4 h-4 text-deep-navy" />
                  </button>
                  <span className="w-14 text-center text-sm font-bold text-deep-navy border-x-2 border-deep-navy h-11 flex items-center justify-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-11 h-11 flex items-center justify-center hover:bg-surface-container transition-colors active:scale-[0.97]"
                  >
                    <Plus className="w-4 h-4 text-deep-navy" />
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAddToCart}
                  disabled={!inStock}
                  className="flex-1 h-14 flex items-center justify-center gap-2.5 bg-primary-container text-deep-navy text-label-caps font-bold rounded-xl border-2 border-transparent hover:border-deep-navy transition-colors duration-150 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={addedToCart ? "added" : "add"}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2, ease: EASE }}
                    >
                      {!inStock ? "Out of stock" : addedToCart ? "Added ✓" : "Add to Basket"}
                    </motion.span>
                  </AnimatePresence>
                </button>
                <button
                  onClick={() => setWishlisted((v) => !v)}
                  className={`w-14 h-14 flex items-center justify-center border-2 rounded-xl transition-colors duration-150 active:scale-[0.97] ${
                    wishlisted ? "bg-deep-navy border-deep-navy text-primary-container" : "border-deep-navy hover:bg-surface-container"
                  }`}
                >
                  <Heart className={`w-5 h-5 ${wishlisted ? "fill-primary-container text-primary-container" : "text-deep-navy"}`} />
                </button>
              </div>

              <div className="flex items-center gap-3 p-4 bg-surface-container-low border border-outline-variant rounded-xl">
                <div className={`w-2 h-2 rounded-full shrink-0 ${inStock ? "bg-primary" : "bg-error"}`} />
                <p className="text-sm text-on-surface-variant">
                  <span className="font-semibold text-deep-navy">{inStock ? "In stock" : "Unavailable"}</span>
                  {" — "}
                  {stockLabel}. Free shipping on orders over {formatVND(500000)}.
                </p>
              </div>

              {(shop || shopStats) && (
                <div className="p-5 bg-white border-2 border-deep-navy rounded-xl space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-deep-navy flex items-center justify-center shrink-0">
                        <Store className="w-5 h-5 text-primary-container" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Sold by</p>
                        <p className="text-sm font-bold text-deep-navy truncate capitalize">
                          {shop?.name || "Shop"}
                        </p>
                        {shop?.address && (
                          <p className="flex items-center gap-1 text-xs text-on-surface-variant truncate">
                            <MapPin className="w-3 h-3 shrink-0" />
                            {shop.address}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled
                      title="Chat is coming soon"
                      className="flex items-center gap-1.5 h-9 px-3 shrink-0 border-2 border-deep-navy/20 text-deep-navy text-xs font-bold rounded-xl opacity-60 cursor-not-allowed"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Chat
                    </button>
                  </div>
                  {shopStats && (
                    <div className="flex items-center gap-5 pt-3 border-t border-outline-variant">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-deep-navy">
                        <Package className="w-3.5 h-3.5 text-primary" />
                        {shopStats.productCount} products
                      </span>
                      <span className="text-xs font-semibold text-deep-navy">
                        {shopStats.unitsSold.toLocaleString()} sold
                      </span>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>

          <div className="mt-16 border-t-2 border-deep-navy">
            <div className="flex border-b-2 border-deep-navy">
              {(["specs", "shipping"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`h-14 px-8 text-sm font-bold uppercase tracking-widest transition-colors duration-150 border-r-2 border-deep-navy last:border-r-0 ${
                    activeTab === tab
                      ? "bg-deep-navy text-primary-container"
                      : "text-deep-navy hover:bg-surface-container"
                  }`}
                >
                  {tab === "specs" ? "Details" : "Shipping"}
                </button>
              ))}
            </div>

            <div className="py-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeTab === "specs" ? (
                <>
                  <DetailRow label="Category" value={product.type ?? "—"} />
                  <DetailRow label="Reward Points" value={String(product.point ?? 0)} />
                  <DetailRow label="Sold" value={`${product.numPurchases ?? 0} units`} />
                  {product.salePercent && product.salePercent > 0 ? (
                    <DetailRow label="Discount" value={`${product.salePercent}% off`} />
                  ) : null}
                  <DetailRow label="Original Price" value={formatVND(product.originalPrice ?? product.price)} />
                  <DetailRow label="Current Price" value={formatVND(product.price)} />
                </>
              ) : (
                <>
                  <DetailRow label="Dispatch" value="Ships in 2–4 business days." />
                  <DetailRow label="Free shipping" value={`On orders over ${formatVND(500000)}`} />
                  <DetailRow label="Returns" value="30-day returns on undamaged items." />
                </>
              )}
            </div>
          </div>

          {related.length > 0 && (
            <div className="mt-16">
              <div className="flex items-end justify-between mb-8 border-b-2 border-deep-navy pb-4">
                <h2 className="text-headline-md font-bold uppercase tracking-tight text-deep-navy">You May Also Like</h2>
                {product.type && (
                  <Link
                    href={`/search?category=${encodeURIComponent(product.type)}`}
                    className="text-sm font-bold uppercase text-on-surface-variant hover:text-primary transition-colors"
                  >
                    View All →
                  </Link>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {related.map((prod, i) => (
                  <motion.div
                    key={prod.id}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.07, duration: 0.35, ease: EASE }}
                    className="group border border-deep-navy rounded-2xl overflow-hidden bg-white card-hover"
                  >
                    <Link href={`/products/${prod.id}`} className="block aspect-square border-b border-deep-navy/20 bg-surface-container-low p-8">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-500"
                      />
                    </Link>
                    <div className="p-5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-deep-navy line-clamp-1">{prod.name}</h3>
                        <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mt-0.5">
                          {formatVND(prod.price)}
                        </p>
                      </div>
                      <Link
                        href={`/products/${prod.id}`}
                        className="h-9 px-4 bg-primary-container text-deep-navy text-xs font-bold rounded-xl border-2 border-transparent hover:border-deep-navy transition-colors active:scale-[0.97] flex items-center"
                      >
                        View
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-5 bg-white border border-deep-navy/20 rounded-xl">
      <dt className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{label}</dt>
      <dd className="mt-1.5 text-sm text-deep-navy">{value}</dd>
    </div>
  );
}
