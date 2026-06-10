"use client";

import { useEffect, useRef } from "react";

type OtpInputProps = {
  value: string;
  onChange: (next: string) => void;
  onComplete?: (full: string) => void;
  length?: number;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
};

export default function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  disabled = false,
  error = false,
  autoFocus = true,
}: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  function commit(next: string) {
    const trimmed = next.slice(0, length);
    onChange(trimmed);
    if (trimmed.length === length && /^\d+$/.test(trimmed)) {
      onComplete?.(trimmed);
    }
  }

  function setDigit(i: number, raw: string) {
    const d = raw.replace(/\D/g, "").slice(-1);
    const arr = digits.slice();
    arr[i] = d;
    const next = arr.join("");
    commit(next);
    if (d && i < length - 1) refs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (!digits[i] && i > 0) {
        const arr = digits.slice();
        arr[i - 1] = "";
        commit(arr.join(""));
        refs.current[i - 1]?.focus();
        e.preventDefault();
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      refs.current[i - 1]?.focus();
      e.preventDefault();
    } else if (e.key === "ArrowRight" && i < length - 1) {
      refs.current[i + 1]?.focus();
      e.preventDefault();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    e.preventDefault();
    commit(pasted);
    const focusIdx = Math.min(pasted.length, length - 1);
    refs.current[focusIdx]?.focus();
  }

  return (
    <div className="flex gap-2 sm:gap-3 justify-between">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          disabled={disabled}
          value={d}
          onChange={(e) => setDigit(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          onFocus={(e) => e.target.select()}
          aria-label={`Digit ${i + 1} of ${length}`}
          className={`w-11 h-14 sm:w-12 text-center text-xl font-bold tabular-nums rounded-xl bg-white outline-none transition-colors duration-150 border-2 disabled:opacity-50 ${
            error
              ? "border-error text-error focus:border-error"
              : "border-deep-navy/30 text-deep-navy focus:border-primary-container"
          }`}
        />
      ))}
    </div>
  );
}
