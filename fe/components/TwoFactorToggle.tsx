"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Loader2, Check, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/api";

type ProfileResponse = {
  success: boolean;
  data: { twoFactorEnabled?: boolean };
};

type SaveState = "idle" | "saving" | "saved" | "error";

/**
 * Self-contained card that reads and flips the signed-in account's
 * `twoFactorEnabled` setting via GET/PUT `/api/users/profile`. Works for buyer,
 * seller, and admin tokens (the gateway auth guard is role-agnostic).
 *
 * When ON, login emails a 6-digit code (the second-factor step). When OFF,
 * login signs in directly — faster, but no email verification.
 */
export default function TwoFactorToggle({
  className = "",
}: {
  className?: string;
}) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [save, setSave] = useState<SaveState>("idle");

  useEffect(() => {
    let cancelled = false;
    apiRequest<ProfileResponse>("/api/users/profile", { method: "GET" })
      .then((res) => {
        if (!cancelled) setEnabled(res.data.twoFactorEnabled !== false);
      })
      .catch((e) => {
        if (!cancelled)
          setLoadError(
            (e as { message?: string })?.message ||
              "Couldn't load your security settings.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggle() {
    if (enabled === null || save === "saving") return;
    const next = !enabled;
    setEnabled(next); // optimistic
    setSave("saving");
    try {
      await apiRequest("/api/users/profile", {
        method: "PUT",
        body: { twoFactorEnabled: next },
      });
      setSave("saved");
      setTimeout(() => setSave("idle"), 2000);
    } catch (e) {
      setEnabled(!next); // revert
      setSave("error");
      setTimeout(() => setSave("idle"), 3000);
      void e;
    }
  }

  return (
    <div
      className={`bg-surface-container-lowest border-2 border-deep-navy rounded-2xl overflow-hidden ${className}`}
    >
      <div className="h-1 bg-primary-container w-full" />
      <div className="px-6 py-6">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 shrink-0 bg-primary-container/20 border-2 border-primary-container rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-label-caps text-primary mb-1">Login Security</p>
            <h3 className="text-headline-md text-deep-navy leading-tight">
              Email Verification
            </h3>
            <p className="text-sm text-on-surface-variant mt-1.5 max-w-md">
              When on, we email a 6-digit code each time you sign in. Turn it off
              to log in faster with just your password.
            </p>

            {/* Status line */}
            <div className="h-5 mt-3 flex items-center gap-1.5 text-xs font-semibold">
              {save === "saving" && (
                <span className="flex items-center gap-1.5 text-on-surface-variant">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…
                </span>
              )}
              {save === "saved" && (
                <span className="flex items-center gap-1.5 text-primary">
                  <Check className="w-3.5 h-3.5" /> Saved
                </span>
              )}
              {save === "error" && (
                <span className="flex items-center gap-1.5 text-error">
                  <AlertCircle className="w-3.5 h-3.5" /> Couldn&apos;t save —
                  try again
                </span>
              )}
              {save === "idle" && enabled !== null && (
                <span className="text-on-surface-variant">
                  {enabled
                    ? "Verification is ON — most secure."
                    : "Verification is OFF — faster sign-in."}
                </span>
              )}
            </div>
          </div>

          {/* Toggle switch */}
          <button
            type="button"
            role="switch"
            aria-checked={enabled === true}
            aria-label="Toggle email verification at login"
            disabled={loading || enabled === null || !!loadError}
            onClick={toggle}
            className={`relative shrink-0 mt-1 w-14 h-8 rounded-full border-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
              enabled
                ? "bg-primary-container border-deep-navy"
                : "bg-surface-container border-outline"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-deep-navy transition-transform duration-200 ${
                enabled ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {loadError && (
          <p className="mt-4 text-xs font-medium text-error">{loadError}</p>
        )}
      </div>
    </div>
  );
}
