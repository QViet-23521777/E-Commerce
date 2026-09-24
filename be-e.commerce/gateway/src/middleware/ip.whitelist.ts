import { createMiddleware } from "hono/factory";
import { getConnInfo } from "@hono/node-server/conninfo";

// The real socket address only — never X-Forwarded-For / X-Real-IP. There is no
// trusted reverse proxy in front of this gateway, so those headers are
// client-supplied: honouring them let `curl -H "X-Forwarded-For: 127.0.0.1"`
// walk straight past this allowlist.
//
// Behind Docker this sees the bridge address of the caller, which is why
// ADMIN_ALLOWED_IPS in .env.docker lists the 172.x gateway addresses. If a real
// reverse proxy is ever put in front, allowlist the proxy's address here and
// re-introduce XFF parsing only for peers you have verified.
export const ipWhitelist = createMiddleware(async (c, next) => {
  const ALLOWED_IPS = (process.env.ADMIN_ALLOWED_IPS ?? "")
    .split(",")
    .map((ip) => ip.trim())
    .filter(Boolean);

  let clientIP = "";
  try {
    clientIP = getConnInfo(c).remote.address ?? "";
  } catch { /* no socket, e.g. app.request() in tests */ }

  if (ALLOWED_IPS.length === 0) {
    console.warn("⚠️ ADMIN_ALLOWED_IPS not set - blocking all!");
    return c.json(
      { message: "Access denied: IP whitelist not configured" },
      403,
    );
  }

  if (!clientIP || !ALLOWED_IPS.includes(clientIP)) {
    console.warn(`[ipWhitelist] blocked ${clientIP || "unknown address"}`);
    return c.json({ message: "Access denied: IP not allowed" }, 403);
  }
  await next();
});
