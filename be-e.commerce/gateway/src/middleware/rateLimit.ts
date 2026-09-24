import { Context } from "hono";
import { getConnInfo } from "@hono/node-server/conninfo";
import { rateLimiter } from "hono-rate-limiter";

// Key on the real socket address, never on X-Forwarded-For. XFF is
// client-supplied here (there is no trusted reverse proxy in front of the
// gateway), so keying on it would let an attacker rotate the header and evade
// the limit entirely — the opposite of what the limiter is for.
const clientKey = (c: Context): string => {
  try {
    return getConnInfo(c).remote.address ?? "unknown";
  } catch {
    // app.request() in tests has no socket.
    return "unknown";
  }
};

// Note: in-memory store, per-process. Fine for the single gateway container;
// swap in @hono-rate-limiter/redis if the gateway is ever scaled out.
const make = (windowMs: number, limit: number) =>
  rateLimiter({
    windowMs,
    limit,
    keyGenerator: clientKey,
    standardHeaders: "draft-7",
    message: { success: false, message: "Too many requests" },
  });

// Broad ceiling for ordinary browsing.
export const generalLimiter = make(60_000, 120);

// Password checks: each failure costs an argon2.verify on the user service.
export const loginLimiter = make(15 * 60_000, 5);

// Six-digit OTP with no server-side attempt counter — this limit is the only
// thing bounding a brute-force of the second factor and of password reset.
export const otpLimiter = make(15 * 60_000, 5);

// Account creation and reset-email endpoints: abuse here costs outbound email.
export const signupLimiter = make(60 * 60_000, 3);
