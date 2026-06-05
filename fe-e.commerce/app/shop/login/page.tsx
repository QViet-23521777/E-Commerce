"use client";

import { Eye, EyeOff, ArrowLeft, Store, ShieldCheck, RotateCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { saveTokens, roleFromToken } from "@/lib/auth";
import OtpInput from "@/components/OtpInput";

const NOT_A_SELLER =
  "This account isn't a seller account. Sign in at the buyer storefront instead.";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

type LoginResponse = {
  data: { id: string; name: string; email: string; twoFactorEnabled?: boolean };
  tokens: { accessToken: string; refreshToken: string };
};

export default function ShopLoginPage() {
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userId, setUserId] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiRequest<LoginResponse>("/api/users/login", {
        method: "POST",
        body: { email, password },
      });
      // Email verification off → login already issued tokens; go straight in.
      if (res.data.twoFactorEnabled === false) {
        // Only seller accounts may enter the seller hub. The generic login
        // endpoint authenticates buyers too, so gate on the token's role.
        if (roleFromToken(res.tokens.accessToken) !== "seller") {
          setError(NOT_A_SELLER);
          return;
        }
        saveTokens(res.tokens.accessToken, res.tokens.refreshToken, "shop");
        window.location.assign("/shop/dashboard");
        return;
      }
      setUserId(res.data.id);
      setStep("otp");
      setResendCooldown(30);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(translateAuthError(e?.message) ?? "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(submittedOtp?: string) {
    const code = submittedOtp ?? otp;
    if (code.length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await apiRequest<LoginResponse>("/api/users/second-factor-auth", {
        method: "POST",
        body: { userId, otp: code },
      });
      // Same seller-only gate as the no-2FA path, now that we hold the token.
      if (roleFromToken(res.tokens.accessToken) !== "seller") {
        setError(NOT_A_SELLER);
        setOtp("");
        return;
      }
      saveTokens(res.tokens.accessToken, res.tokens.refreshToken, "shop");
      window.location.assign("/shop/dashboard");
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(translateAuthError(e?.message) ?? "Verification failed. Try again.");
      setOtp("");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0 || loading) return;
    setError("");
    setLoading(true);
    try {
      await apiRequest("/api/users/login", {
        method: "POST",
        body: { email, password },
      });
      setResendCooldown(30);
      setOtp("");
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(translateAuthError(e?.message) ?? "Couldn't resend code.");
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
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/5 border border-primary/20 px-2 py-0.5 rounded-full">
              Seller Hub
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
        <AnimatePresence mode="wait">
          {step === "credentials" ? (
            <motion.div
              key="credentials"
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="w-full max-w-[440px]"
            >
              <div className="bg-surface-container-lowest border-2 border-deep-navy rounded-2xl overflow-hidden">
                <div className="h-1 bg-primary-container w-full" />

                <div className="px-8 py-10">
                  <div className="mb-8">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="w-9 h-9 bg-deep-navy rounded-xl flex items-center justify-center shrink-0">
                        <Store className="w-4.5 h-4.5 text-primary-container" />
                      </div>
                      <div>
                        <p className="text-label-caps text-primary">SELLER PORTAL</p>
                        <p className="text-[10px] text-on-surface-variant">Manage your shop on ShopIn</p>
                      </div>
                    </div>
                    <h1 className="text-[2rem] font-bold leading-tight tracking-tight text-deep-navy mb-1.5">
                      Shop Sign In
                    </h1>
                    <p className="text-sm text-on-surface-variant">
                      Access your seller dashboard and manage your store.
                    </p>
                  </div>

                  <form className="flex flex-col gap-5" onSubmit={handleCredentials}>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-[0.1em] text-deep-navy mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(""); }}
                        placeholder="seller@example.com"
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
                      <p className="text-xs font-medium text-error -mt-2">{error}</p>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 bg-primary-container text-deep-navy text-sm font-bold rounded-xl border-2 border-transparent hover:border-deep-navy active:scale-[0.97] transition-all duration-150 mt-1 disabled:opacity-60"
                    >
                      {loading ? "Signing in…" : "Continue"}
                    </button>
                  </form>

                  <div className="mt-6 pt-5 border-t border-outline-variant text-center">
                    <p className="text-sm text-on-surface-variant">
                      Not a seller yet?{" "}
                      <Link
                        href="/shop/signup"
                        className="font-bold text-deep-navy hover:text-primary transition-colors underline underline-offset-4"
                      >
                        Apply to open a shop
                      </Link>
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-center text-xs text-on-surface-variant mt-5">
                Seller accounts are subject to our{" "}
                <span className="underline cursor-pointer">Seller Agreement</span>.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="otp"
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="w-full max-w-[440px]"
            >
              <div className="bg-surface-container-lowest border-2 border-deep-navy rounded-2xl overflow-hidden">
                <div className="h-1 bg-primary-container w-full" />
                <div className="px-8 py-10">
                  <div className="mb-8">
                    <div className="w-12 h-12 bg-primary-container/20 border-2 border-primary-container rounded-2xl flex items-center justify-center mb-5">
                      <ShieldCheck className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-label-caps text-primary mb-2">VERIFICATION</p>
                    <h1 className="text-[2rem] font-bold leading-tight tracking-tight text-deep-navy mb-2">
                      Enter Your Code
                    </h1>
                    <p className="text-sm text-on-surface-variant">
                      We sent a 6-digit code to{" "}
                      <strong className="text-deep-navy break-all">{email}</strong>.
                    </p>
                  </div>

                  <form
                    className="flex flex-col gap-5"
                    onSubmit={(e) => { e.preventDefault(); handleVerifyOtp(); }}
                  >
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-[0.1em] text-deep-navy mb-3">
                        Verification Code
                      </label>
                      <OtpInput
                        value={otp}
                        onChange={(v) => { setOtp(v); if (error) setError(""); }}
                        onComplete={(full) => handleVerifyOtp(full)}
                        disabled={loading}
                        error={!!error}
                      />
                    </div>

                    {error && (
                      <p className="text-xs font-medium text-error">{error}</p>
                    )}

                    <button
                      type="submit"
                      disabled={loading || otp.length !== 6}
                      className="w-full h-12 bg-primary-container text-deep-navy text-sm font-bold rounded-xl border-2 border-transparent hover:border-deep-navy active:scale-[0.97] transition-all duration-150 mt-1 disabled:opacity-60"
                    >
                      {loading ? "Verifying…" : "Verify & Sign In"}
                    </button>
                  </form>

                  <div className="flex items-center justify-between mt-6 pt-5 border-t border-outline-variant">
                    <button
                      type="button"
                      onClick={() => { setStep("credentials"); setOtp(""); setError(""); }}
                      className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-deep-navy transition-colors duration-150"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Change email
                    </button>
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendCooldown > 0 || loading}
                      className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline underline-offset-2 disabled:text-on-surface-variant disabled:no-underline disabled:cursor-not-allowed"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function translateAuthError(msg: string | undefined): string | null {
  if (!msg) return null;
  switch (msg) {
    case "INVALID_CREDENTIALS":
      return "That email or password isn't right.";
    case "INVALID_OTP":
      return "That code doesn't match. Try again.";
    case "OTP_REQUIRED":
      return "Enter the 6-digit code from your email.";
    case "USER_NOT_FOUND":
      return "Account not found.";
    case "EMAIL_NOT_VERIFIED":
      return "Verify your email before signing in.";
    default:
      return msg;
  }
}
