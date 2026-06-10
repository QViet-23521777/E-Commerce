"use client";

import { Eye, EyeOff, ArrowLeft, ShieldCheck, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useState } from "react";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];
const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

type Step = "form" | "success";

function translateError(msg: string | undefined): string {
  switch (msg) {
    case "Invalid token or email":
      return "That token or email doesn't match. Check your email and try again.";
    case "Invite already used or expired":
      return "This invite link has already been used. Request a new one.";
    case "Invite has expired":
      return "This invite has expired. Ask your super admin to send a new one.";
    case "Password is required":
      return "Please enter a password.";
    default:
      return msg ?? "Something went wrong. Try again.";
  }
}

export default function AdminVerifyPage() {
  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/admin/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), token: token.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message ?? "Verification failed");
      }
      setStep("success");
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(translateError(e?.message));
    } finally {
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
            href="/admin/login"
            className="flex items-center gap-1.5 text-sm font-medium text-on-surface-variant hover:text-deep-navy transition-colors duration-150"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <AnimatePresence mode="wait">
          {step === "form" ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={{ duration: 0.4, ease: EASE }}
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
                        <p className="text-[10px] text-on-surface-variant">Activate your account</p>
                      </div>
                    </div>
                    <h1 className="text-[2rem] font-bold leading-tight tracking-tight text-deep-navy mb-1.5">
                      Verify Account
                    </h1>
                    <p className="text-sm text-on-surface-variant">
                      Paste the verification token from your invite email and set your password.
                    </p>
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
                        Verification Token
                      </label>
                      <textarea
                        required
                        value={token}
                        onChange={(e) => { setToken(e.target.value); setError(""); }}
                        placeholder="Paste the token from your email…"
                        rows={3}
                        className="block w-full px-4 py-3 border-2 border-deep-navy/30 rounded-xl bg-white text-xs text-on-surface placeholder:text-outline focus:border-primary-container outline-none transition-colors duration-150 resize-none font-mono leading-relaxed"
                      />
                      <p className="text-[10px] text-outline mt-1.5">
                        Copy the full token from your admin invite email.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-[0.1em] text-deep-navy mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => { setPassword(e.target.value); setError(""); }}
                          placeholder="At least 8 characters"
                          className="block w-full h-12 px-4 pr-12 border-2 border-deep-navy/30 rounded-xl bg-white text-sm text-on-surface placeholder:text-outline focus:border-primary-container outline-none transition-colors duration-150"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-deep-navy transition-colors p-0.5"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-[0.1em] text-deep-navy mb-2">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirm ? "text" : "password"}
                          required
                          value={confirm}
                          onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                          placeholder="Re-enter your password"
                          className="block w-full h-12 px-4 pr-12 border-2 border-deep-navy/30 rounded-xl bg-white text-sm text-on-surface placeholder:text-outline focus:border-primary-container outline-none transition-colors duration-150"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm((v) => !v)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-deep-navy transition-colors p-0.5"
                          aria-label={showConfirm ? "Hide password" : "Show password"}
                        >
                          {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs font-medium text-error -mt-2"
                      >
                        {error}
                      </motion.p>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 bg-red-400 hover:bg-red-500 text-white text-sm font-bold rounded-xl border-2 border-transparent hover:border-deep-navy active:scale-[0.97] transition-all duration-150 mt-1 disabled:opacity-70"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-28 h-0.5 bg-white/30 rounded-full overflow-hidden relative">
                            <span className="absolute inset-y-0 left-0 w-8 bg-white rounded-full animate-scan" />
                          </span>
                          Activating…
                        </span>
                      ) : (
                        "Activate Account"
                      )}
                    </button>
                  </form>
                </div>
              </div>

              <p className="text-center text-xs text-on-surface-variant mt-5">
                Don&apos;t have an invite?{" "}
                <Link href="/admin/register" className="font-semibold text-deep-navy hover:underline underline-offset-2">
                  Request one
                </Link>
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="w-full max-w-[440px]"
            >
              <div className="bg-surface-container-lowest border-2 border-deep-navy rounded-2xl overflow-hidden">
                <div className="h-1 bg-red-400 w-full" />
                <div className="px-8 py-10">
                  <div className="w-12 h-12 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-5 h-5 text-red-500" />
                  </div>
                  <p className="text-label-caps text-red-500 mb-2">ACCOUNT ACTIVATED</p>
                  <h2 className="text-[1.75rem] font-bold tracking-tight text-deep-navy mb-3">
                    You&apos;re all set
                  </h2>
                  <p className="text-sm text-on-surface-variant mb-8 leading-relaxed">
                    Your admin account has been activated. You can now sign in to the admin portal.
                  </p>
                  <Link
                    href="/admin/login"
                    className="flex items-center justify-center w-full h-12 bg-red-400 hover:bg-red-500 text-white text-sm font-bold rounded-xl border-2 border-transparent hover:border-deep-navy transition-all duration-150"
                  >
                    Sign In to Admin Portal
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
