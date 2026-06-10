"use client";

import { Eye, EyeOff, ArrowLeft, ShieldCheck, CheckCircle2, KeyRound } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useState } from "react";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

type Step = "form" | "success";

function translateError(msg: string | undefined): string {
  switch (msg) {
    case "INVALID_SECRET":
      return "Incorrect secret code. Contact your super admin.";
    case "Email already exists":
      return "An account with this email already exists.";
    case "SERVER_MISCONFIGURED":
      return "Server setup error. Contact your super admin.";
    case "GATEWAY_UNREACHABLE":
      return "Cannot reach the server. Check that Docker is running.";
    default:
      return msg ?? "Something went wrong. Try again.";
  }
}

export default function AdminRegisterPage() {
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [secretCode, setSecretCode] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, secretCode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message ?? "Unknown error");
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
                        <KeyRound className="w-4.5 h-4.5 text-red-400" />
                      </div>
                      <div>
                        <p className="text-label-caps text-red-500">ADMIN PORTAL</p>
                        <p className="text-[10px] text-on-surface-variant">Create administrator account</p>
                      </div>
                    </div>
                    <h1 className="text-[2rem] font-bold leading-tight tracking-tight text-deep-navy mb-1.5">
                      Register Admin
                    </h1>
                    <p className="text-sm text-on-surface-variant">
                      Enter your details and the secret code to create an admin account. You&apos;ll receive a verification email.
                    </p>
                  </div>

                  <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-[0.1em] text-deep-navy mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => { setName(e.target.value); setError(""); }}
                        placeholder="Jane Smith"
                        className="block w-full h-12 px-4 border-2 border-deep-navy/30 rounded-xl bg-white text-sm text-on-surface placeholder:text-outline focus:border-primary-container outline-none transition-colors duration-150"
                      />
                    </div>

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
                        Secret Code
                      </label>
                      <div className="relative">
                        <input
                          type={showSecret ? "text" : "password"}
                          required
                          value={secretCode}
                          onChange={(e) => { setSecretCode(e.target.value); setError(""); }}
                          placeholder="Enter the admin creation code"
                          className="block w-full h-12 px-4 pr-12 border-2 border-deep-navy/30 rounded-xl bg-white text-sm text-on-surface placeholder:text-outline focus:border-primary-container outline-none transition-colors duration-150"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecret((v) => !v)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-deep-navy transition-colors p-0.5"
                          aria-label={showSecret ? "Hide code" : "Show code"}
                        >
                          {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                          Sending invite…
                        </span>
                      ) : (
                        "Send Invite Email"
                      )}
                    </button>
                  </form>
                </div>
              </div>

              <p className="text-center text-xs text-on-surface-variant mt-5">
                Already have an account?{" "}
                <Link href="/admin/login" className="font-semibold text-deep-navy hover:underline underline-offset-2">
                  Sign in
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
                  <p className="text-label-caps text-red-500 mb-2">INVITE SENT</p>
                  <h2 className="text-[1.75rem] font-bold tracking-tight text-deep-navy mb-3">
                    Check your email
                  </h2>
                  <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
                    A verification token has been sent to{" "}
                    <strong className="text-deep-navy">{email}</strong>. Copy the token from your email and use it on the verify page to set your password.
                  </p>

                  <div className="bg-surface-container border border-outline-variant rounded-xl p-4 mb-6">
                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-on-surface-variant mb-1">Next step</p>
                    <p className="text-sm text-on-surface">
                      Go to{" "}
                      <Link href="/admin/verify" className="font-semibold text-deep-navy underline underline-offset-2">
                        /admin/verify
                      </Link>{" "}
                      and paste the token from your email to activate your account.
                    </p>
                  </div>

                  <Link
                    href="/admin/verify"
                    className="flex items-center justify-center w-full h-12 bg-red-400 hover:bg-red-500 text-white text-sm font-bold rounded-xl border-2 border-transparent hover:border-deep-navy transition-all duration-150"
                  >
                    Go to Verify Page
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
