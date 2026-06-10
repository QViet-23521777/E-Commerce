"use client";

import { Eye, EyeOff, ArrowLeft, Store, ShieldCheck, RotateCw, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { saveTokens } from "@/lib/auth";
import OtpInput from "@/components/OtpInput";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number", test: (p: string) => /\d/.test(p) },
];

type RegisterResponse = {
  success: boolean;
  data: { id: string; name: string; email: string };
};

type SellerVerifyResponse = {
  success: boolean;
  data: {
    tokens: { accessToken: string; refreshToken: string };
  };
};

export default function ShopSignupPage() {
  const [step, setStep] = useState<"form" | "otp">("form");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

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

  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!PASSWORD_RULES.every((r) => r.test(password))) {
      setError("Password doesn't meet the requirements.");
      return;
    }
    setLoading(true);
    try {
      let activeUserId = userId;
      if (!activeUserId) {
        const reg = await apiRequest<RegisterResponse>("/api/users/register", {
          method: "POST",
          body: { name, email, password },
        });
        activeUserId = reg.data.id;
        setUserId(activeUserId);
      }
      await apiRequest("/api/sellers/create", {
        method: "POST",
        body: { userId: activeUserId, address, phone },
      });
      setStep("otp");
      setResendCooldown(30);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(translateError(e?.message) ?? "Couldn't create your shop account.");
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
      const res = await apiRequest<SellerVerifyResponse>("/api/sellers/verify", {
        method: "POST",
        body: { userId, otp: code },
      });
      const tokens = res.data?.tokens;
      if (!tokens) throw new Error("MISSING_TOKENS");
      saveTokens(tokens.accessToken, tokens.refreshToken, "shop");
      window.location.assign("/shop/dashboard");
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(translateError(e?.message) ?? "Verification failed. Try again.");
      setOtp("");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0 || loading || !userId) return;
    setError("");
    setLoading(true);
    try {
      await apiRequest("/api/sellers/create", {
        method: "POST",
        body: { userId, address, phone },
      });
      setResendCooldown(30);
      setOtp("");
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(translateError(e?.message) ?? "Couldn't resend code.");
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
            href="/shop/login"
            className="flex items-center gap-1.5 text-sm font-medium text-on-surface-variant hover:text-deep-navy transition-colors duration-150"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
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
              className="w-full max-w-[480px]"
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
                        <p className="text-label-caps text-primary">OPEN A SHOP</p>
                        <p className="text-[10px] text-on-surface-variant">Become a seller on ShopIn</p>
                      </div>
                    </div>
                    <h1 className="text-[2rem] font-bold leading-tight tracking-tight text-deep-navy mb-1.5">
                      Apply to Sell
                    </h1>
                    <p className="text-sm text-on-surface-variant">
                      Tell us about your shop. We&apos;ll verify your email with a one-time code.
                    </p>
                  </div>

                  <form className="flex flex-col gap-5" onSubmit={handleSubmitForm}>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-[0.1em] text-deep-navy mb-2">
                        Shop / Owner Name
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => { setName(e.target.value); setError(""); }}
                        placeholder="Acme Goods"
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
                        placeholder="seller@example.com"
                        className="block w-full h-12 px-4 border-2 border-deep-navy/30 rounded-xl bg-white text-sm text-on-surface placeholder:text-outline focus:border-primary-container outline-none transition-colors duration-150"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-[0.1em] text-deep-navy mb-2">
                          Pickup Address
                        </label>
                        <input
                          type="text"
                          required
                          value={address}
                          onChange={(e) => { setAddress(e.target.value); setError(""); }}
                          placeholder="123 Le Loi, D.1"
                          className="block w-full h-12 px-4 border-2 border-deep-navy/30 rounded-xl bg-white text-sm text-on-surface placeholder:text-outline focus:border-primary-container outline-none transition-colors duration-150"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-[0.1em] text-deep-navy mb-2">
                          Phone
                        </label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => { setPhone(e.target.value); setError(""); }}
                          placeholder="0901234567"
                          className="block w-full h-12 px-4 border-2 border-deep-navy/30 rounded-xl bg-white text-sm text-on-surface placeholder:text-outline focus:border-primary-container outline-none transition-colors duration-150"
                        />
                      </div>
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
                      <ul className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                        {PASSWORD_RULES.map((r) => {
                          const ok = r.test(password);
                          return (
                            <li
                              key={r.label}
                              className={`flex items-center gap-1.5 text-[11px] font-medium ${
                                ok ? "text-primary" : "text-on-surface-variant"
                              }`}
                            >
                              <Check className={`w-3 h-3 ${ok ? "opacity-100" : "opacity-30"}`} />
                              {r.label}
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-[0.1em] text-deep-navy mb-2">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirm ? "text" : "password"}
                          required
                          value={confirmPassword}
                          onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                          placeholder="••••••••"
                          className="block w-full h-12 px-4 pr-12 border-2 border-deep-navy/30 rounded-xl bg-white text-sm text-on-surface placeholder:text-outline focus:border-primary-container outline-none transition-colors duration-150"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm((v) => !v)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-deep-navy transition-colors p-0.5"
                        >
                          {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                      {loading ? "Submitting…" : "Send Verification Code"}
                    </button>
                  </form>

                  <div className="mt-6 pt-5 border-t border-outline-variant text-center">
                    <p className="text-sm text-on-surface-variant">
                      Already a seller?{" "}
                      <Link
                        href="/shop/login"
                        className="font-bold text-deep-navy hover:text-primary transition-colors underline underline-offset-4"
                      >
                        Sign in
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
                      Activate Your Shop
                    </h1>
                    <p className="text-sm text-on-surface-variant">
                      We sent a 6-digit code to{" "}
                      <strong className="text-deep-navy break-all">{email}</strong>. It expires in 15 minutes.
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
                      {loading ? "Verifying…" : "Activate Shop"}
                    </button>
                  </form>

                  <div className="flex items-center justify-between mt-6 pt-5 border-t border-outline-variant">
                    <button
                      type="button"
                      onClick={() => { setStep("form"); setOtp(""); setError(""); }}
                      className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-deep-navy transition-colors duration-150"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Edit details
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

function translateError(msg: string | undefined): string | null {
  if (!msg) return null;
  switch (msg) {
    case "EMAIL_EXISTS":
      return "An account with that email already exists. Sign in instead.";
    case "USER_NOT_FOUND":
      return "Account not found. Start over.";
    case "USER_ALREADY_A_SELLER":
      return "That account is already a seller. Sign in instead.";
    case "ADDRESS_REQUIRED":
      return "Pickup address is required.";
    case "PHONE_REQUIRED":
      return "Phone number is required.";
    case "INVALID_OTP":
      return "That code doesn't match. Try again.";
    case "MISSING_TOKENS":
      return "Couldn't sign you in automatically. Try logging in.";
    default:
      return msg;
  }
}
