import { Context, Next } from "hono";

export const requireAdmin = async (c: Context, next: Next) => {
  const user = c.get("user") as { role?: string } | undefined;

  if (user?.role !== "admin") {
    return c.json({ success: false, message: "Admin access required" }, 403);
  }

  await next();
};
