import { Context, Next } from "hono";

export const internalAuth = async (c: Context, next: Next) => {
  const secret = c.req.header("x-internal-secret");

  if (!secret || secret !== process.env.INTERNAL_SECRET) {
    return c.json({ success: false, message: "Forbidden" }, 403);
  }

  await next();
};
