"use client";

import { Eye, EyeOff, ArrowLeft, Check, CheckCircle } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import Footer from "@/components/Footer";
import { apiRequest } from "@/lib/api";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number", test: (p: string) => /\d/.test(p) },
];

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      await apiRequest("/api/users/register", {
        method: "POST",
        body: { name: fullName, email, password },
      });
      setEmailSent(true);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b-2 border-deep-navy bg-surface-container-lowest shrink-0">
          <div className="max-w-[1280px] mx-auto px-6 sm:px-10 h-16 flex items-center">
            <Link href="/" className="text-xl font-bold tracking-tighter text-deep-navy">ShopIn</Link>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="w-full max-w-[440px]"
          >
            <div className="bg-surface-container-lowest border-2 border-deep-navy rounded-2xl overflow-hidden">
              <div className="h-1 bg-primary-container w-full" />
              <div className="px-8 py-10 text-center space-y-6">
                <div className="w-14 h-14 bg-primary-container/20 border-2 border-primary rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-7 h-7 text-primary" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-[2rem] font-bold leading-tight tracking-tight text-deep-navy">Check your inbox</h2>
                  <p className="text-sm text-on-surface-variant">
                    We sent a verification link to <strong className="text-deep-navy">{email}</strong>. Click it to activate your account before signing in.
                  </p>
                </div>
                <Link
                  href="/login"
                  className="flex items-center justify-center w-full h-12 bg-primary-container text-deep-navy text-sm font-bold rounded-xl border-2 border-transparent hover:border-deep-navy active:scale-[0.97] transition-all duration-150"
                >
                  Go to Sign In
                </Link>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b-2 border-deep-navy bg-surface-container-lowest shrink-0">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-10 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tighter text-deep-navy">
            ShopIn
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-sm font-medium text-on-surface-variant hover:text-deep-navy transition-colors duration-150"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: EASE }}
          className="w-full max-w-[440px]"
        >
          <div className="bg-surface-container-lowest border-2 border-deep-navy rounded-2xl overflow-hidden">
            {/* Cyan accent bar */}
            <div className="h-1 bg-primary-container w-full" />

            <div className="px-8 py-10">
              {/* Title block */}
              <div className="mb-8">
                <p className="text-label-caps text-primary mb-2">NEW ACCOUNT</p>
                <h1 className="text-[2rem] font-bold leading-tight tracking-tight text-deep-navy mb-2">
                  Join ShopIn
                </h1>
                <p className="text-sm text-on-surface-variant">
                  Engineered precision in commerce, delivered to you.
                </p>
              </div>

              {/* Social buttons */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button className="flex items-center justify-center gap-2 h-11 border-2 border-outline-variant rounded-xl text-sm font-semibold text-on-surface hover:border-deep-navy transition-colors duration-150">
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </button>
                <button className="flex items-center justify-center gap-2 h-11 border-2 border-outline-variant rounded-xl text-sm font-semibold text-on-surface hover:border-deep-navy transition-colors duration-150">
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  Apple
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-outline-variant" />
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-outline-variant" />
              </div>

              {/* Form */}
              <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.1em] text-deep-navy mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Alex Nordström"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="block w-full h-12 px-4 border-2 border-deep-navy/30 rounded-xl bg-white text-sm text-on-surface placeholder:text-outline focus:border-primary-container outline-none transition-colors duration-150"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.1em] text-deep-navy mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    className="block w-full h-12 px-4 border-2 border-deep-navy/30 rounded-xl bg-white text-sm text-on-surface placeholder:text-outline focus:border-primary-container outline-none transition-colors duration-150"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.1em] text-deep-navy mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full h-12 px-4 pr-12 border-2 border-deep-navy/30 rounded-xl bg-white text-sm text-on-surface placeholder:text-outline focus:border-primary-container outline-none transition-colors duration-150"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-deep-navy transition-colors duration-150 p-0.5"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password rules */}
                  {password.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.25, ease: EASE }}
                      className="space-y-1.5 pt-3"
                    >
                      {PASSWORD_RULES.map((rule) => {
                        const ok = rule.test(password);
                        return (
                          <div key={rule.label} className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors duration-200 ${ok ? "bg-primary" : "border-2 border-outline-variant"}`}>
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

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.1em] text-deep-navy mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                      className="block w-full h-12 px-4 pr-12 border-2 border-deep-navy/30 rounded-xl bg-white text-sm text-on-surface placeholder:text-outline focus:border-primary-container outline-none transition-colors duration-150"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-deep-navy transition-colors duration-150 p-0.5"
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <p className="text-xs font-medium text-error -mt-2">{error}</p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-primary-container text-deep-navy text-sm font-bold rounded-xl border-2 border-transparent hover:border-deep-navy active:scale-[0.97] transition-all duration-150 mt-1 disabled:opacity-60"
                >
                  {loading ? "Creating account…" : "Create Account"}
                </button>
              </form>

              {/* Footer link */}
              <p className="text-center text-sm text-on-surface-variant mt-6">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-bold text-deep-navy hover:text-primary transition-colors duration-150 underline underline-offset-4"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          {/* Below-card note */}
          <p className="text-center text-xs text-on-surface-variant mt-5">
            By creating an account you agree to our{" "}
            <span className="underline cursor-pointer">Terms of Service</span>{" "}
            and{" "}
            <span className="underline cursor-pointer">Privacy Policy</span>.
          </p>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
