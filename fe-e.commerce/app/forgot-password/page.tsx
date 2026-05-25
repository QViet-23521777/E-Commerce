"use client";

import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import Footer from "@/components/Footer";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b-2 border-deep-navy bg-white">
        <div className="max-w-[1280px] mx-auto px-10 h-20 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tighter text-deep-navy">
            ShopIn
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2 text-sm font-medium text-on-surface-variant hover:text-deep-navy transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to sign in
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.97 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="w-full max-w-md"
            >
              <div className="bg-white border-2 border-deep-navy rounded-2xl p-10 space-y-8">
                {/* Icon */}
                <div className="w-14 h-14 bg-primary-container/20 border-2 border-primary-container rounded-2xl flex items-center justify-center">
                  <Mail className="w-6 h-6 text-primary" />
                </div>

                {/* Header */}
                <div className="space-y-2">
                  <span className="text-label-caps text-primary uppercase tracking-widest">Account recovery</span>
                  <h1 className="text-display-lg-mobile text-deep-navy">Reset Password</h1>
                  <p className="text-body-md text-on-surface-variant">
                    Enter your email address and we&apos;ll send you a link to reset your password.
                  </p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-widest text-deep-navy">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="your@email.com"
                      className="w-full h-12 px-4 border border-deep-navy rounded-xl bg-white text-sm text-deep-navy placeholder:text-outline"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-primary-container text-deep-navy text-label-caps font-bold rounded-xl border-2 border-transparent hover:border-deep-navy transition-colors duration-150 active:scale-[0.97]"
                  >
                    Send Reset Link
                  </button>
                </form>

                <Link
                  href="/login"
                  className="flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-deep-navy transition-colors justify-center"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to login
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="w-full max-w-md"
            >
              <div className="bg-white border-2 border-deep-navy rounded-2xl p-10 space-y-8 text-center">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  className="flex justify-center"
                >
                  <div className="w-16 h-16 bg-primary-container/20 border-2 border-primary rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-primary" />
                  </div>
                </motion.div>

                <div className="space-y-3">
                  <h2 className="text-display-lg-mobile text-deep-navy">Check your inbox</h2>
                  <p className="text-body-md text-on-surface-variant">
                    We&apos;ve sent a password reset link to your email address. The link expires in 15 minutes.
                  </p>
                </div>

                {/* Scanning progress bar */}
                <div className="h-0.5 bg-surface-container overflow-hidden rounded-full">
                  <div className="h-full w-1/4 bg-primary-container animate-scan" />
                </div>

                <Link
                  href="/login"
                  className="inline-block w-full py-3.5 bg-primary-container text-deep-navy text-label-caps font-bold rounded-xl border-2 border-transparent hover:border-deep-navy transition-colors duration-150 active:scale-[0.97] text-center"
                >
                  Back to Sign In
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
