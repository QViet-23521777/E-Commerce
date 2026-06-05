"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Star, Check, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { fetchOrderById, type OrderItem } from "@/lib/orders";
import { submitProductReview } from "@/lib/products";
import { getUser } from "@/lib/auth";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

const STAR_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Great",
  5: "Excellent",
};

// A reviewable line: prefer the catalog product id (reviews live on the Product).
type Reviewable = {
  productId: string;
  name: string;
  image: string;
};

const toReviewable = (items: OrderItem[]): Reviewable[] =>
  items
    .map((i) => ({
      productId: String(i.catalogProductId || i.productId || ""),
      name: i.name,
      image: i.image || "",
    }))
    .filter((r) => r.productId);

export default function WriteReviewPage() {
  const params = useParams<{ id: string }>();
  const orderId = params?.id;

  const [products, setProducts] = useState<Reviewable[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    let alive = true;
    (async () => {
      const order = await fetchOrderById(orderId);
      if (!alive) return;
      const reviewable = order ? toReviewable(order.items || []) : [];
      setProducts(reviewable);
      setSelectedId(reviewable[0]?.productId ?? "");
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [orderId]);

  const selected = products.find((p) => p.productId === selectedId) ?? null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0 || !selected) return;
    setSubmitting(true);
    setError(null);
    try {
      const me = getUser();
      // Compose the review text from the optional title + body.
      const text = [title.trim(), body.trim()].filter(Boolean).join(" — ");
      await submitProductReview(selected.productId, {
        rating,
        text,
        author: me?.name || me?.email || "Anonymous",
      });
      setSubmitted(true);
    } catch {
      setError("Could not submit your review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const displayRating = hovered || rating;

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="text-center max-w-sm"
          >
            <div className="w-20 h-20 rounded-full bg-primary-container border-4 border-deep-navy flex items-center justify-center mx-auto mb-6">
              <Check className="w-9 h-9 text-deep-navy" strokeWidth={2.5} />
            </div>
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="h-px w-6 bg-primary-container" />
              <p className="text-label-caps text-primary">Review Posted</p>
              <div className="h-px w-6 bg-primary-container" />
            </div>
            <h1 className="text-headline-md text-deep-navy mb-2">Thank you!</h1>
            <p className="text-sm text-on-surface-variant mb-8">
              Your review helps other shoppers make better decisions.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/orders"
                className="flex items-center justify-center gap-2 h-12 bg-primary-container text-deep-navy text-label-caps font-bold rounded-xl border-2 border-transparent hover:border-deep-navy transition-colors active:scale-[0.97]"
              >
                Back to Orders
              </Link>
              <Link
                href="/"
                className="flex items-center justify-center h-12 border-2 border-deep-navy text-deep-navy text-label-caps font-bold rounded-xl hover:bg-surface-container transition-colors active:scale-[0.97]"
              >
                Continue Shopping
              </Link>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1">
        <div className="max-w-[720px] mx-auto px-4 sm:px-10 py-10">
          {/* Breadcrumb */}
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface mb-8 transition-colors duration-150"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Orders
          </Link>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="mb-8"
          >
            <div className="flex items-center gap-2.5 mb-1">
              <div className="h-px w-6 bg-primary-container flex-shrink-0" />
              <p className="text-label-caps text-primary">Your Experience</p>
            </div>
            <h1 className="text-display-lg-mobile text-deep-navy">Write a Review</h1>
          </motion.div>

          {loading ? (
            <div className="bg-white border-2 border-deep-navy rounded-2xl p-10 text-center text-sm text-on-surface-variant">
              Loading your order…
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white border-2 border-deep-navy rounded-2xl p-10 text-center">
              <p className="font-bold text-deep-navy mb-1">Nothing to review</p>
              <p className="text-sm text-on-surface-variant">
                We couldn&apos;t find any products on this order.
              </p>
            </div>
          ) : (
            <>
              {/* Product card / selector */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE, delay: 0.06 }}
                className="p-5 bg-white border-2 border-deep-navy rounded-2xl mb-6"
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">
                  {products.length > 1 ? "Choose a product to review" : "Reviewing"}
                </p>
                <div className="flex flex-col gap-2">
                  {products.map((p) => {
                    const active = p.productId === selectedId;
                    return (
                      <button
                        key={p.productId}
                        type="button"
                        onClick={() => setSelectedId(p.productId)}
                        className={`flex gap-4 items-center text-left p-3 rounded-xl border-2 transition-colors ${
                          active
                            ? "border-deep-navy bg-surface-container-low"
                            : "border-transparent hover:bg-surface-container-low"
                        }`}
                      >
                        <div className="w-16 h-16 border border-deep-navy/15 rounded-xl bg-surface-container-low p-2 shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.image || "https://placehold.co/80x80/e2e2e2/6a7a7b?text=IMG"}
                            alt={p.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://placehold.co/80x80/e2e2e2/6a7a7b?text=IMG";
                            }}
                          />
                        </div>
                        <p className="flex-1 min-w-0 font-bold text-deep-navy">{p.name}</p>
                        {products.length > 1 && (
                          <span
                            className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                              active ? "border-deep-navy bg-primary-container" : "border-outline-variant"
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>

              {/* Review form */}
              <motion.form
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE, delay: 0.12 }}
                className="bg-white border-2 border-deep-navy rounded-2xl overflow-hidden"
              >
                <div className="h-1 bg-primary-container" />

                <div className="p-6 space-y-8">
                  {/* Star rating */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-4">
                      Overall Rating
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHovered(star)}
                          onMouseLeave={() => setHovered(0)}
                          className="transition-transform duration-100 active:scale-[0.88]"
                          aria-label={`Rate ${star} stars`}
                        >
                          <Star
                            className={`w-9 h-9 transition-colors duration-100 ${
                              star <= displayRating
                                ? "fill-primary-container text-primary-container"
                                : "fill-transparent text-outline-variant"
                            }`}
                            strokeWidth={1.5}
                          />
                        </button>
                      ))}
                      <AnimatePresence mode="wait">
                        {displayRating > 0 && (
                          <motion.span
                            key={displayRating}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 8 }}
                            transition={{ duration: 0.15, ease: EASE }}
                            className="ml-3 text-sm font-bold text-deep-navy"
                          >
                            {STAR_LABELS[displayRating]}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                    {rating === 0 && (
                      <p className="text-[10px] text-outline mt-2">Select a rating to continue</p>
                    )}
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant mb-2.5">
                      Review Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Summarise your experience in a few words"
                      maxLength={80}
                      className="w-full h-11 px-0 bg-transparent border-b-2 border-deep-navy/20 text-sm font-medium text-deep-navy placeholder:text-outline focus:border-primary-container outline-none transition-colors duration-200 rounded-none"
                    />
                  </div>

                  {/* Body */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant mb-2.5">
                      Detailed Review
                    </label>
                    <textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="What did you like or dislike? How was the quality, packaging, or delivery?"
                      rows={5}
                      className="w-full px-0 bg-transparent border-b-2 border-deep-navy/20 text-sm text-deep-navy placeholder:text-outline focus:border-primary-container outline-none transition-colors duration-200 rounded-none resize-none leading-relaxed"
                    />
                  </div>

                  {error && (
                    <p className="text-sm font-semibold text-red-600">{error}</p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-2 border-t border-deep-navy/10">
                    <motion.button
                      type="submit"
                      disabled={rating === 0 || submitting}
                      animate={
                        submitting
                          ? { backgroundColor: "#001a41" }
                          : { backgroundColor: "#00f3ff" }
                      }
                      transition={{ duration: 0.25, ease: EASE }}
                      className="h-11 px-8 text-deep-navy text-label-caps font-bold rounded-xl border-2 border-transparent hover:border-deep-navy transition-colors duration-150 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                    >
                      <AnimatePresence mode="wait">
                        {submitting ? (
                          <motion.span
                            key="submitting"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.2, ease: EASE }}
                            className="flex items-center gap-2 text-white"
                          >
                            <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            Submitting…
                          </motion.span>
                        ) : (
                          <motion.span
                            key="submit"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.2, ease: EASE }}
                          >
                            Submit Review
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                    <Link
                      href="/orders"
                      className="h-11 px-8 border-2 border-deep-navy/30 text-deep-navy text-label-caps font-bold rounded-xl hover:border-deep-navy hover:bg-surface-container transition-colors duration-150 active:scale-[0.97] flex items-center"
                    >
                      Cancel
                    </Link>
                  </div>
                </div>
              </motion.form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
