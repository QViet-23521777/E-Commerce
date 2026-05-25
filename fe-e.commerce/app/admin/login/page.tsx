"use client";

import { Eye, EyeOff, ArrowLeft, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];
const MOCK_EMAIL = "admin@shopin.com";
const MOCK_PASSWORD = "admin123";

export default function AdminLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    if (email === MOCK_EMAIL && password === MOCK_PASSWORD) {
      document.cookie = "admin_token=mock-admin-token; path=/; max-age=86400";
      router.push("/admin/dashboard");
    } else {
      setError("Invalid credentials. Use admin@shopin.com / admin123");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b-2 border-deep-navy bg-surface-container-lowest shrink-0">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-tighter text-deep-navy">ShopIn</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
              Admin
            </span>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-medium text-on-surface-variant hover:text-deep-navy transition-colors duration-150"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to shop
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
            <div className="h-1 bg-red-400 w-full" />

            <div className="px-8 py-10">
              <div className="mb-8">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 bg-deep-navy rounded-xl flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4.5 h-4.5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-label-caps text-red-500">ADMIN PORTAL</p>
                    <p className="text-[10px] text-on-surface-variant">Platform administration</p>
                  </div>
                </div>
                <h1 className="text-[2rem] font-bold leading-tight tracking-tight text-deep-navy mb-1.5">
                  Admin Sign In
                </h1>
                <p className="text-sm text-on-surface-variant">
                  Access the ShopIn platform administration panel.
                </p>
              </div>

              <div className="mb-5 px-3.5 py-3 bg-red-50 border border-red-200 rounded-xl text-xs text-on-surface-variant leading-relaxed">
                <span className="font-bold text-deep-navy">Test credentials:</span>{" "}
                admin@shopin.com{" "}
                <span className="text-outline mx-1">/</span>{" "}
                admin123
              </div>

              <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.1em] text-deep-navy mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="admin@shopin.com"
                    className="block w-full h-12 px-4 border-2 border-deep-navy/30 rounded-xl bg-white text-sm text-on-surface placeholder:text-outline focus:border-primary-container outline-none transition-colors duration-150"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.1em] text-deep-navy mb-2">
                    Password
                  </label>
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
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-deep-navy transition-colors p-0.5"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs font-medium text-red-500 -mt-2"
                  >
                    {error}
                  </motion.p>
                )}

                <motion.button
                  type="submit"
                  disabled={loading}
                  animate={loading ? { backgroundColor: "#001a41" } : { backgroundColor: "#f87171" }}
                  transition={{ duration: 0.25, ease: EASE }}
                  className="w-full h-12 text-white text-sm font-bold rounded-xl border-2 border-transparent hover:border-deep-navy active:scale-[0.97] transition-all duration-150 mt-1 disabled:opacity-70 relative overflow-hidden"
                >
                  <AnimatePresence mode="wait">
                    {loading ? (
                      <motion.span
                        key="loading"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="flex items-center justify-center gap-2"
                      >
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Signing in…
                      </motion.span>
                    ) : (
                      <motion.span
                        key="idle"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                      >
                        Sign In to Admin Panel
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </form>
            </div>
          </div>

          <p className="text-center text-xs text-on-surface-variant mt-5">
            Restricted access. Authorised personnel only.
          </p>
        </motion.div>
      </main>
    </div>
  );
}
