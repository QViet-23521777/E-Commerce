// ip.whitelist.ts - không cần import env nữa
import { createMiddleware } from "hono/factory";

export const ipWhitelist = createMiddleware(async (c, next) => {
  const ALLOWED_IPS =
    process.env.ADMIN_ALLOWED_IPS?.split(",").map((ip) => ip.trim()) || [];

  const clientIP =
    c.req.header("x-forwarded-for")?.split(",")[0].trim() ||
    c.req.header("x-real-ip") ||
    c.env?.remoteAddr ||
    "";

  console.log(`Client IP: ${clientIP}`);
  if (ALLOWED_IPS.length === 0) {
    console.warn("⚠️ ADMIN_ALLOWED_IPS not set - blocking all!");
    return c.json(
      { message: "Access denied: IP whitelist not configured" },
      403,
    );
  }

  if (!ALLOWED_IPS.includes(clientIP)) {
    return c.json({ message: "Access denied: IP not allowed" }, 403);
  }
  console.log(`✅ IP ${clientIP} allowed by whitelist`);
  await next();
});
