import { Context } from "hono";
import jwt from "jsonwebtoken";
import { getBreaker } from "./circuit-breaker";
import { SERVICE_FALLBACKS } from "./service-fallbacks";

type Methods = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

let cachedPrivateKey: string | null = null;
const getPrivateKey = () => {
  if (!cachedPrivateKey) {
    cachedPrivateKey = Buffer.from(process.env.PRIVATE_KEY_B64!, "base64").toString();
  }
  return cachedPrivateKey;
};

function getServiceName(url: string): string {
  try {
    return new URL(url).hostname; // "user-service", "promotion-service", ...
  } catch {
    return "unknown";
  }
}

export const Request = async (
  c: Context,
  url: string,
  method: Methods = "POST",
) => {
  const serviceName = getServiceName(url);
  const breaker = getBreaker(serviceName);
  const fallback = SERVICE_FALLBACKS[serviceName];

  // Circuit đang OPEN — fail fast, không gọi vào service
  if (breaker.opened) {
    if (fallback) {
      console.warn(`[Proxy] ⚡ Fallback cho ${serviceName} (circuit open)`);
      return c.json(fallback, 200);
    }
    return c.json(
      { success: false, message: `${serviceName} đang gặp sự cố, vui lòng thử lại sau` },
      503,
    );
  }

  try {
    const isBodyMethod = ["POST", "PUT", "PATCH"].includes(method);
    const reqContentType = c.req.header("content-type") || "";
    const isBinaryBody =
      reqContentType.includes("multipart/form-data") ||
      reqContentType.includes("application/octet-stream");

    let body: string | ArrayBuffer | undefined = undefined;
    if (isBodyMethod) {
      const cloned = c.req.raw.clone();
      if (isBinaryBody) {
        const buf = await cloned.arrayBuffer();
        body = buf.byteLength ? buf : undefined;
      } else {
        const text = await cloned.text();
        body = text.trim() ? text : undefined;
      }
    }

    const serviceToken = jwt.sign(
      { caller: "gateway" },
      getPrivateKey(),
      { algorithm: "RS256", expiresIn: "60s" },
    );

    const headers: Record<string, string> = {
      "x-internal-token": serviceToken,
    };

    const contentType = c.req.header("content-type");
    if (contentType) headers["Content-Type"] = contentType;

    const userId    = c.req.header("x-user-id");
    const userEmail = c.req.header("x-user-email");
    const userRole  = c.req.header("x-user-role");
    const clientIP  =
      c.req.header("x-forwarded-for")?.split(",")[0].trim() ||
      c.req.header("x-real-ip") ||
      (c as any).env?.remoteAddr ||
      c.req.raw.headers.get("x-forwarded-for") ||
      "";

    if (clientIP)    headers["x-forwarded-for"] = clientIP;
    if (userId)      headers["x-user-id"]        = userId;
    if (userEmail)   headers["x-user-email"]     = userEmail;
    if (userRole)    headers["x-user-role"]       = userRole;

    const response = await breaker.fire(url, { method, headers, body }) as Response;

    if (response.status === 204) {
      return new Response(null, { status: 204 });
    }

    const responseType = response.headers.get("content-type") || "";
    if (responseType.includes("application/json")) {
      const data = await response.json();
      return c.json(data, response.status as any);
    }
    const text = await response.text();
    return c.body(
      text,
      response.status as any,
      responseType ? { "Content-Type": responseType } : undefined,
    );

  } catch (error: any) {
    // Service vừa lỗi (hoặc circuit vừa trip ngay request này) — thử dùng fallback
    if (fallback) {
      console.warn(`[Proxy] ⚡ Fallback cho ${serviceName} (${error.message})`);
      return c.json(fallback, 200);
    }
    if (error.message?.includes("Timed out") || error.name === "AbortError") {
      return c.json({ success: false, message: "Service timeout" }, 504);
    }
    return c.json({ success: false, message: error.message }, 503);
  }
};