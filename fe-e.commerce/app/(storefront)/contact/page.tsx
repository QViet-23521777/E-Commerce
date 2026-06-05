"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Star, Check, Send } from "lucide-react";
import Link from "next/link";
import { submitFeedback } from "@/lib/support";
import { getUser } from "@/lib/auth";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

export default function ContactPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const me = getUser();
      await submitFeedback({
        subject: subject.trim(),
        message: message.trim(),
        rating,
        author: me?.name || me?.email || "Guest",
        email: email.trim() || me?.email || "",
      });
      setSubmitted(true);
    } catch {
      setError("Could not send your message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const displayRating = hovered || rating;

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE }}
          className="text-center max-w-sm"
        >
          <div className="w-20 h-20 rounded-full bg-primary-container border-4 border-deep-navy flex items-center justify-center mx-auto mb-6">
            <Check className="w-9 h-9 text-deep-navy" strokeWidth={2.5} />
          </div>
          <h1 className="text-headline-md text-deep-navy mb-2">Message sent</h1>
          <p className="text-sm text-on-surface-variant mb-8">
            Thanks for reaching out — our team will review your message.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center h-12 px-8 bg-primary-container text-deep-navy text-label-caps font-bold rounded-xl border-2 border-transparent hover:border-deep-navy transition-colors active:scale-[0.97]"
          >
            Back to Home
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[640px] mx-auto px-4 sm:px-10 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="h-px w-6 bg-primary-container" />
            <p className="text-label-caps text-primary">Support</p>
          </div>
          <h1 className="text-display-lg-mobile text-deep-navy">Contact Us</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Questions, problems, or feedback? Send us a message.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border-2 border-deep-navy rounded-2xl overflow-hidden"
        >
          <div className="h-1 bg-primary-container" />
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant mb-2">
                Subject
              </label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="What's this about?"
                maxLength={120}
                className="block w-full h-11 px-4 border-2 border-deep-navy/20 rounded-xl bg-white text-sm focus:border-primary-container outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant mb-2">
                Email <span className="font-normal text-outline normal-case tracking-normal">(optional)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="block w-full h-11 px-4 border-2 border-deep-navy/20 rounded-xl bg-white text-sm focus:border-primary-container outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant mb-2">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what's going on…"
                rows={5}
                className="block w-full px-4 py-3 border-2 border-deep-navy/20 rounded-xl bg-white text-sm focus:border-primary-container outline-none transition-colors resize-none leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant mb-3">
                Rate your experience <span className="font-normal text-outline normal-case tracking-normal">(optional)</span>
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star === rating ? 0 : star)}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    className="transition-transform duration-100 active:scale-[0.88]"
                    aria-label={`Rate ${star} stars`}
                  >
                    <Star
                      className={`w-7 h-7 transition-colors duration-100 ${
                        star <= displayRating
                          ? "fill-primary-container text-primary-container"
                          : "fill-transparent text-outline-variant"
                      }`}
                      strokeWidth={1.5}
                    />
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={!subject.trim() || !message.trim() || submitting}
              className="flex items-center gap-2 h-11 px-8 bg-primary-container text-deep-navy text-label-caps font-bold rounded-xl border-2 border-transparent hover:border-deep-navy transition-colors active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              {submitting ? "Sending…" : "Send Message"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
