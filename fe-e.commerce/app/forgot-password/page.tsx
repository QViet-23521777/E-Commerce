"use client";

import { ArrowLeft, CheckCircle, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Footer from "@/components/Footer";
import { apiRequest } from "@/lib/api";
import OtpInput from "@/components/OtpInput";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

function translateAuthError(msg: string | undefined): string | null {
  if (!msg) return null;
  switch (msg) {
    case "USER_NOT_FOUND":
      return "No account is registered with that email.";
    case "INVALID_OTP":
      return "That code doesn't match. Try again.";
    case "INVALID_TOKEN":
      return "Reset link is invalid. Request a new one.";
    case "TOKEN_EXPIRED":
      return "Reset link expired. Request a new one.";
    case "PASSWORD_SAME_AS_OLD":
      return "Choose a password different from your current one.";
    default:
      return msg;
  }
}

function ResetPasswordCard({ resetToken, emailHint }: { resetToken: string; emailHint?: string }) {
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (otp.length !== 6) { setError("Enter the 6-digit code from your email."); return; }
    if (newPassword.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }

    setLoading(true);
    try {
      // Step 1: verify the OTP against the reset token
      await apiRequest(`/api/users/verify-resetpassword?token=${encodeURIComponent(resetToken)}`, {
        method: "POST",
        body: { otp },
      });
      // Step 2: change the password (no oldPassword needed for reset flow)
      await apiRequest("/api/users/change-password", {
        method: "POST",
        body: { token: resetToken, newPassword },
      });
      setResetDone(true);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(translateAuthError(e?.message) ?? "Reset failed. The link may have expired.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b-2 border-deep-navy bg-surface-container-lowest shrink-0">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-10 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tighter text-deep-navy">
            ShopIn
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <AnimatePresence mode="wait">
          {!resetDone ? (
            <motion.div
              key="reset-form"
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.97 }}
              transition={{ duration: 0.45, ease: EASE }}
              className="w-full max-w-[440px]"
            >
              <div className="bg-surface-container-lowest border-2 border-deep-navy rounded-2xl overflow-hidden">
                <div className="h-1 bg-primary-container w-full" />
                <div className="px-8 py-10">
                  <div className="mb-8">
                    <div className="w-12 h-12 bg-primary-container/20 border-2 border-primary-container rounded-2xl flex items-center justify-center mb-5">
                      <ShieldCheck className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-label-caps text-primary mb-2">PASSWORD RESET</p>
                    <h1 className="text-[2rem] font-bold leading-tight tracking-tight text-deep-navy mb-2">
                      Set New Password
                    </h1>
                    <p className="text-sm text-on-surface-variant">
                      {emailHint ? (
                        <>We sent a 6-digit code to <strong className="text-deep-navy break-all">{emailHint}</strong>. Enter it below, then choose a new password.</>
                      ) : (
                        <>Enter the 6-digit code from your email, then choose a new password.</>
                      )}
                    </p>
                  </div>

                  <form className="flex flex-col gap-5" onSubmit={handleResetPassword}>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-[0.1em] text-deep-navy mb-3">
                        Verification Code
                      </label>
                      <OtpInput
                        value={otp}
                        onChange={(v) => { setOtp(v); if (error) setError(""); }}
                        disabled={loading}
                        error={!!error && otp.length < 6}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-[0.1em] text-deep-navy mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          minLength={8}
                          value={newPassword}
                          onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
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
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-[0.1em] text-deep-navy mb-2">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirm ? "text" : "password"}
                          required
                          minLength={8}
                          value={confirmPassword}
                          onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                          placeholder="••••••••"
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

                    {error && (
                      <p className="text-xs font-medium text-error -mt-2">{error}</p>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 bg-primary-container text-deep-navy text-sm font-bold rounded-xl border-2 border-transparent hover:border-deep-navy active:scale-[0.97] transition-all duration-150 mt-1 disabled:opacity-60"
                    >
                      {loading ? "Saving…" : "Set New Password"}
                    </button>
                  </form>
                </div>
              </div>

              <p className="text-center text-xs text-on-surface-variant mt-5">
                Remembered your password?{" "}
                <Link href="/login" className="underline cursor-pointer hover:text-deep-navy transition-colors duration-150">
                  Sign in
                </Link>
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="reset-done"
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.45, ease: EASE }}
              className="w-full max-w-[440px]"
            >
              <div className="bg-surface-container-lowest border-2 border-deep-navy rounded-2xl overflow-hidden">
                <div className="h-1 bg-primary-container w-full" />
                <div className="px-8 py-10 text-center space-y-6">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.4, ease: EASE }}
                    className="flex justify-center"
                  >
                    <div className="w-14 h-14 bg-primary-container/20 border-2 border-primary rounded-full flex items-center justify-center">
                      <CheckCircle className="w-7 h-7 text-primary" />
                    </div>
                  </motion.div>
                  <div className="space-y-2">
                    <h2 className="text-[2rem] font-bold leading-tight tracking-tight text-deep-navy">
                      Password updated!
                    </h2>
                    <p className="text-sm text-on-surface-variant">
                      Your password has been changed. Sign in with your new credentials.
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
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}

function RequestResetCard() {
  const [email, setEmail] = useState("");
  const [issuedToken, setIssuedToken] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRequestReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiRequest<{ success: boolean; token: string }>(
        "/api/users/send-reset-password-email",
        { method: "POST", body: { email } },
      );
      if (!res?.token) throw new Error("MISSING_TOKEN");
      setIssuedToken(res.token);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(translateAuthError(e?.message) ?? "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (issuedToken) return <ResetPasswordCard resetToken={issuedToken} emailHint={email} />;

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
        <AnimatePresence mode="wait">
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="w-full max-w-[440px]"
          >
            <div className="bg-surface-container-lowest border-2 border-deep-navy rounded-2xl overflow-hidden">
              <div className="h-1 bg-primary-container w-full" />
              <div className="px-8 py-10">
                <div className="mb-8">
                  <div className="w-12 h-12 bg-primary-container/20 border-2 border-primary-container rounded-2xl flex items-center justify-center mb-5">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-label-caps text-primary mb-2">ACCOUNT RECOVERY</p>
                  <h1 className="text-[2rem] font-bold leading-tight tracking-tight text-deep-navy mb-2">
                    Reset Password
                  </h1>
                  <p className="text-sm text-on-surface-variant">
                    Enter your email. We&apos;ll send a 6-digit code so you can choose a new password right after.
                  </p>
                </div>

                <form className="flex flex-col gap-5" onSubmit={handleRequestReset}>
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

                    {error && (
                      <p className="text-xs font-medium text-error -mt-2">{error}</p>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 bg-primary-container text-deep-navy text-sm font-bold rounded-xl border-2 border-transparent hover:border-deep-navy active:scale-[0.97] transition-all duration-150 mt-1 disabled:opacity-60"
                    >
                      {loading ? "Sending…" : "Send Reset Link"}
                    </button>
                  </form>

                  <p className="text-center text-sm text-on-surface-variant mt-6">
                    Know your password?{" "}
                    <Link
                      href="/login"
                      className="font-bold text-deep-navy hover:text-primary transition-colors duration-150 underline underline-offset-4"
                    >
                      Sign in
                    </Link>
                  </p>
                </div>
              </div>

              <p className="text-center text-xs text-on-surface-variant mt-5">
                Need help?{" "}
                <span className="underline cursor-pointer hover:text-deep-navy transition-colors duration-150">
                  Contact support
                </span>
              </p>
            </motion.div>
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}

function ForgotPasswordPageInner() {
  const searchParams = useSearchParams();
  const resetToken = searchParams.get("token");

  if (resetToken) return <ResetPasswordCard resetToken={resetToken} />;
  return <RequestResetCard />;
}

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordPageInner />
    </Suspense>
  );
}
