"use client";

import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiRequest } from "@/lib/api";
import Footer from "@/components/Footer";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

type Status = "pending" | "success" | "error" | "missing-token";

function translateVerifyError(msg: string | undefined): string {
  if (!msg) return "We couldn't verify your email. The link may be invalid.";
  switch (msg) {
    case "INVALID_TOKEN":
      return "This verification link is invalid or has already been used.";
    case "TOKEN_EXPIRED":
      return "This verification link has expired. Sign up again to receive a new one.";
    default:
      return msg;
  }
}

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>(token ? "pending" : "missing-token");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        await apiRequest(`/api/users/verify-email?token=${encodeURIComponent(token)}`, {
          method: "GET",
        });
        if (!cancelled) setStatus("success");
      } catch (err: unknown) {
        if (cancelled) return;
        const e = err as { message?: string };
        setErrorMsg(translateVerifyError(e?.message));
        setStatus("error");
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b-2 border-deep-navy bg-surface-container-lowest shrink-0">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-10 h-16 flex items-center">
          <Link href="/" className="text-xl font-bold tracking-tighter text-deep-navy">
            ShopIn
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
            <div className="h-1 bg-primary-container w-full" />
            <div className="px-8 py-10 text-center space-y-6">
              {status === "pending" && (
                <>
                  <div className="flex justify-center">
                    <div className="w-14 h-14 bg-primary-container/20 border-2 border-primary-container rounded-full flex items-center justify-center">
                      <Loader2 className="w-7 h-7 text-primary animate-spin" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-label-caps text-primary">VERIFYING</p>
                    <h2 className="text-[2rem] font-bold leading-tight tracking-tight text-deep-navy">
                      Verifying your email
                    </h2>
                    <p className="text-sm text-on-surface-variant">
                      Hang tight — this only takes a moment.
                    </p>
                  </div>
                  <div className="h-0.5 bg-surface-container overflow-hidden rounded-full">
                    <div className="h-full w-1/4 bg-primary-container animate-scan" />
                  </div>
                </>
              )}

              {status === "success" && (
                <>
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.05, duration: 0.4, ease: EASE }}
                    className="flex justify-center"
                  >
                    <div className="w-14 h-14 bg-primary-container/20 border-2 border-primary rounded-full flex items-center justify-center">
                      <CheckCircle className="w-7 h-7 text-primary" />
                    </div>
                  </motion.div>
                  <div className="space-y-2">
                    <p className="text-label-caps text-primary">VERIFIED</p>
                    <h2 className="text-[2rem] font-bold leading-tight tracking-tight text-deep-navy">
                      Email confirmed
                    </h2>
                    <p className="text-sm text-on-surface-variant">
                      Your account is active. You can sign in now.
                    </p>
                  </div>
                  <Link
                    href="/login"
                    className="flex items-center justify-center w-full h-12 bg-primary-container text-deep-navy text-sm font-bold rounded-xl border-2 border-transparent hover:border-deep-navy active:scale-[0.97] transition-all duration-150"
                  >
                    Go to Sign In
                  </Link>
                </>
              )}

              {status === "error" && (
                <>
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.05, duration: 0.4, ease: EASE }}
                    className="flex justify-center"
                  >
                    <div className="w-14 h-14 bg-error/10 border-2 border-error rounded-full flex items-center justify-center">
                      <XCircle className="w-7 h-7 text-error" />
                    </div>
                  </motion.div>
                  <div className="space-y-2">
                    <p className="text-label-caps text-error">LINK PROBLEM</p>
                    <h2 className="text-[2rem] font-bold leading-tight tracking-tight text-deep-navy">
                      Verification failed
                    </h2>
                    <p className="text-sm text-on-surface-variant">{errorMsg}</p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Link
                      href="/signup"
                      className="flex items-center justify-center w-full h-12 bg-primary-container text-deep-navy text-sm font-bold rounded-xl border-2 border-transparent hover:border-deep-navy active:scale-[0.97] transition-all duration-150"
                    >
                      Sign Up Again
                    </Link>
                    <Link
                      href="/login"
                      className="flex items-center justify-center w-full h-12 border-2 border-deep-navy/30 rounded-xl text-sm font-semibold text-on-surface-variant hover:border-deep-navy hover:text-deep-navy transition-all duration-150"
                    >
                      Back to Sign In
                    </Link>
                  </div>
                </>
              )}

              {status === "missing-token" && (
                <>
                  <div className="flex justify-center">
                    <div className="w-14 h-14 bg-primary-container/20 border-2 border-primary-container rounded-full flex items-center justify-center">
                      <Mail className="w-7 h-7 text-primary" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-label-caps text-primary">CHECK YOUR EMAIL</p>
                    <h2 className="text-[2rem] font-bold leading-tight tracking-tight text-deep-navy">
                      No token provided
                    </h2>
                    <p className="text-sm text-on-surface-variant">
                      Open the verification link from the email we sent you.
                    </p>
                  </div>
                  <Link
                    href="/login"
                    className="flex items-center justify-center w-full h-12 border-2 border-deep-navy/30 rounded-xl text-sm font-semibold text-on-surface-variant hover:border-deep-navy hover:text-deep-navy transition-all duration-150"
                  >
                    Back to Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailInner />
    </Suspense>
  );
}
