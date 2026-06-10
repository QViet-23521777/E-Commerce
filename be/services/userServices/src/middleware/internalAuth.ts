import { Context, Next } from "hono";

export const internalAuth = async (c: Context, next: Next) => {
  const secret = c.req.header("x-internal-secret");

  console.log("x-internal-secret received:", secret);
  console.log("INTERNAL_SECRET from env:", process.env.INTERNAL_SECRET);
  console.log("Match:", secret === process.env.INTERNAL_SECRET);

  if (!secret || secret !== process.env.INTERNAL_SECRET) {
    return c.json({ success: false, message: "Forbidden" }, 403);
  }

  await next();
};
