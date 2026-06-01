"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Star, Check, ChevronLeft, Camera } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

const PRODUCT = {
  name: "V60 Ceramic Dripper",
  variant: "White / 02",
  image:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDuYPHC5ZucXkMLQdPzRtMwA5fwVf4vodbpXzIAj1S6x4XKjM2fAlF7-u-Z-AU3MWyNLivbqT5NJVyhECEfYebs0h9qutzgtz955zo46r6UKJ_32aNcoy_7_fNGgqJzQY7CDeFPibKGTiQOwhV3lPfA9eC6I9W4_XCDYFh4FgdiwfC_x7VTV8hox8fmMw3BIDeUe8i7OCB11qcswwjZTdPA83Cj2SJY5IbVEXpLsg6dQg6vLyyj5o-lN_LUe6-ocebtxqygqhHLieN3",
  shop: "Nordic Living Co.",
  shopAvatar: "NL",
};

const STAR_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Great",
  5: "Excellent",
};

export default function WriteReviewPage() {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setSubmitting(false);
    setSubmitted(true);
  }

  const displayRating = hovered || rating;

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
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
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

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

          {/* Product card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE, delay: 0.06 }}
            className="flex gap-4 p-5 bg-white border-2 border-deep-navy rounded-2xl mb-6"
          >
            <div className="w-20 h-20 border border-deep-navy/15 rounded-xl bg-surface-container-low p-3 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={PRODUCT.image}
                alt={PRODUCT.name}
                className="w-full h-full object-contain"
                onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/80x80/e2e2e2/6a7a7b?text=IMG"; }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-deep-navy">{PRODUCT.name}</p>
              <p className="text-xs text-on-surface-variant mt-0.5">{PRODUCT.variant}</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-5 h-5 bg-deep-navy rounded flex items-center justify-center text-[8px] font-bold text-primary-container shrink-0">
                  {PRODUCT.shopAvatar}
                </div>
                <p className="text-xs text-on-surface-variant">{PRODUCT.shop}</p>
              </div>
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

              {/* Photo upload placeholder */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant mb-2.5">
                  Add Photos
                  <span className="ml-2 font-normal text-outline normal-case tracking-normal">optional</span>
                </label>
                <button
                  type="button"
                  className="flex items-center gap-3 border-2 border-dashed border-deep-navy/20 hover:border-deep-navy rounded-xl px-5 py-4 transition-colors duration-150 group w-full sm:w-auto"
                >
                  <div className="w-9 h-9 border border-deep-navy/20 group-hover:border-deep-navy rounded-lg flex items-center justify-center transition-colors">
                    <Camera className="w-4 h-4 text-on-surface-variant" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-deep-navy">Upload photos</p>
                    <p className="text-[10px] text-on-surface-variant">JPG, PNG · up to 5 images</p>
                  </div>
                </button>
              </div>

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
        </div>
      </main>

      <Footer />
    </div>
  );
}
