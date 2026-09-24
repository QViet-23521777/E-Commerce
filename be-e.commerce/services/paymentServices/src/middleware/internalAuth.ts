import { Context, Next } from "hono";
import { timingSafeEqual } from "crypto";

// Constant-time compare. Never log either side: this secret is what makes a
// request look internal to every service in the stack.
const secretMatches = (received: string | undefined): boolean => {
  const expected = process.env.INTERNAL_SECRET;
  if (!received || !expected) return false;

  const a = Buffer.from(received, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
};

export const internalAuth = async (c: Context, next: Next) => {
  if (!secretMatches(c.req.header("x-internal-secret"))) {
    return c.json({ success: false, message: "Forbidden" }, 403);
  }

  await next();
};
