"use client";

import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

// Mock credentials for testing
const MOCK_EMAIL = "test@shopin.com";
const MOCK_PASSWORD = "password123";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (email === MOCK_EMAIL && password === MOCK_PASSWORD) {
      document.cookie = "auth_token=mock-token; path=/; max-age=86400";
      const from = searchParams.get("from") || "/profile";
      router.push(from);
    } else {
      setError("Invalid credentials. Use test@shopin.com / password123");
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b-2 border-deep-navy bg-surface-container-lowest shrink-0">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-10 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold tracking-tighter text-deep-navy"
          >
            ShopIn
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-medium text-on-surface-variant hover:text-deep-navy transition-colors duration-150"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to shop
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: EASE }}
          className="w-full max-w-[440px]"
        >
          {/* Card */}
          <div className="bg-surface-container-lowest border-2 border-deep-navy rounded-2xl overflow-hidden">
            {/* Card top accent */}
            <div className="h-1 bg-primary-container w-full" />

            <div className="px-8 py-10">
              {/* Title block */}
              <div className="mb-8">
                <p className="text-label-caps text-primary mb-2">
                  WELCOME BACK
                </p>
                <h1 className="text-[2rem] font-bold leading-tight tracking-tight text-deep-navy mb-2">
                  Sign In
                </h1>
                <p className="text-sm text-on-surface-variant">
                  Access your ShopIn account.
                </p>
              </div>

              {/* Social buttons */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button className="flex items-center justify-center gap-2 h-11 border-2 border-outline-variant rounded-xl text-sm font-semibold text-on-surface hover:border-deep-navy transition-colors duration-150">
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </button>
                <button className="flex items-center justify-center gap-2 h-11 border-2 border-outline-variant rounded-xl text-sm font-semibold text-on-surface hover:border-deep-navy transition-colors duration-150">
                  <svg
                    className="w-4 h-4 shrink-0"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  Apple
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-outline-variant" />
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  or
                </span>
                <div className="flex-1 h-px bg-outline-variant" />
              </div>

              {/* Mock credentials hint */}
              <div className="mb-4 px-3 py-2.5 bg-ice-blue/40 border border-deep-navy/10 rounded-xl text-xs text-on-surface-variant leading-relaxed">
                <span className="font-bold text-deep-navy">Test credentials:</span>{" "}
                test@shopin.com / password123
              </div>

              {/* Form */}
              <form
                className="flex flex-col gap-5"
                onSubmit={handleSubmit}
              >
                {/* Email */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.1em] text-deep-navy mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="your@email.com"
                    className="block w-full h-12 px-4 border-2 border-deep-navy/30 rounded-xl bg-white text-sm text-on-surface placeholder:text-outline focus:border-primary-container outline-none transition-colors duration-150"
                  />
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold uppercase tracking-[0.1em] text-deep-navy">
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-xs font-semibold text-primary hover:underline underline-offset-2"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      placeholder="••••••••"
                      className="block w-full h-12 px-4 pr-12 border-2 border-deep-navy/30 rounded-xl bg-white text-sm text-on-surface placeholder:text-outline focus:border-primary-container outline-none transition-colors duration-150"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-deep-navy transition-colors duration-150 p-0.5"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <p className="text-xs font-medium text-red-500 -mt-2">{error}</p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full h-12 bg-primary-container text-deep-navy text-sm font-bold rounded-xl border-2 border-transparent hover:border-deep-navy active:scale-[0.97] transition-all duration-150 mt-1"
                >
                  Sign In
                </button>
              </form>

              {/* Footer */}
              <p className="text-center text-sm text-on-surface-variant mt-6">
                New to ShopIn?{" "}
                <Link
                  href="/signup"
                  className="font-bold text-deep-navy hover:text-primary transition-colors duration-150 underline underline-offset-4"
                >
                  Create account
                </Link>
              </p>
            </div>
          </div>

          {/* Below-card note */}
          <p className="text-center text-xs text-on-surface-variant mt-5">
            By signing in you agree to our{" "}
            <span className="underline cursor-pointer">Terms of Service</span>{" "}
            and{" "}
            <span className="underline cursor-pointer">Privacy Policy</span>.
          </p>
        </motion.div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
