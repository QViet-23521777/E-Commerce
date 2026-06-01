"use client";

import { Eye, EyeOff, ArrowLeft, Check } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import Footer from "@/components/Footer";

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number", test: (p: string) => /\d/.test(p) },
];

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");

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
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
          className="w-full max-w-md"
        >
          <div className="bg-white border-2 border-deep-navy rounded-2xl p-10 space-y-8">
            {/* Header */}
            <div className="space-y-2">
              <span className="text-label-caps text-primary uppercase tracking-widest">New account</span>
              <h1 className="text-display-lg-mobile text-deep-navy">Join ShopIn</h1>
              <p className="text-body-md text-on-surface-variant">
                Engineered precision in commerce, delivered to you.
              </p>
            </div>

            {/* Social */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "Google",
                  icon: (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  ),
                },
                {
                  label: "Apple",
                  icon: (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                  ),
                },
              ].map((provider) => (
                <button
                  key={provider.label}
                  className="flex items-center justify-center gap-2.5 h-12 border-2 border-deep-navy/30 rounded-xl text-sm font-semibold text-deep-navy hover:border-deep-navy transition-colors duration-150 active:scale-[0.97]"
                >
                  {provider.icon}
                  {provider.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-outline-variant" />
              <span className="text-label-caps text-on-surface-variant">or</span>
              <div className="flex-1 h-px bg-outline-variant" />
            </div>

            {/* Form */}
            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-deep-navy">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Alex Nordström"
                  className="w-full h-12 px-4 border border-deep-navy rounded-xl bg-white text-sm text-deep-navy placeholder:text-outline"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-deep-navy">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  className="w-full h-12 px-4 border border-deep-navy rounded-xl bg-white text-sm text-deep-navy placeholder:text-outline"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-deep-navy">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-12 px-4 pr-12 border border-deep-navy rounded-xl bg-white text-sm text-deep-navy placeholder:text-outline"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-deep-navy transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Password rules */}
                {password.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                    className="space-y-1.5 pt-2"
                  >
                    {PASSWORD_RULES.map((rule) => {
                      const ok = rule.test(password);
                      return (
                        <div key={rule.label} className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors duration-200 ${ok ? "bg-primary" : "border border-outline"}`}>
                            {ok && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                          </div>
                          <span className={`text-xs transition-colors duration-200 ${ok ? "text-primary font-semibold" : "text-on-surface-variant"}`}>
                            {rule.label}
                          </span>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-deep-navy">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    className="w-full h-12 px-4 pr-12 border border-deep-navy rounded-xl bg-white text-sm text-deep-navy placeholder:text-outline"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-deep-navy transition-colors"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-primary-container text-deep-navy text-label-caps font-bold rounded-xl border-2 border-transparent hover:border-deep-navy transition-colors duration-150 active:scale-[0.97]"
              >
                Create Account
              </button>
            </form>

            <p className="text-center text-sm text-on-surface-variant">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-deep-navy hover:text-primary transition-colors underline underline-offset-4">
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
