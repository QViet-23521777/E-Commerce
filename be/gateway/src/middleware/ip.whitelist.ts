import { createMiddleware } from "hono/factory";
import { getConnInfo } from "@hono/node-server/conninfo";

export const ipWhitelist = createMiddleware(async (c, next) => {
  const ALLOWED_IPS =
    process.env.ADMIN_ALLOWED_IPS?.split(",").map((ip) => ip.trim()) || [];

  let remoteAddr = "";
  try {
    const info = getConnInfo(c);
    remoteAddr = info.remote.address ?? "";
  } catch { /* not available in this runtime */ }

  const clientIP =
    c.req.header("x-forwarded-for")?.split(",")[0].trim() ||
    c.req.header("x-real-ip") ||
    remoteAddr ||
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
