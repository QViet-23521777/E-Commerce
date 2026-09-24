import { Context } from "hono";

type Methods = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export const Request = async (
  c: Context,
  url: string,
  method: Methods = "POST",
) => {
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
        // Forward the raw bytes untouched so file uploads (multipart) survive.
        const buf = await cloned.arrayBuffer();
        body = buf.byteLength ? buf : undefined;
      } else {
        const text = await cloned.text();
        body = text.trim() ? text : undefined;
      }
    }
    const targetUrl = url;

    const headers: Record<string, string> = {
      "x-internal-secret": process.env.INTERNAL_SECRET!,
    };

    const contentType = c.req.header("content-type");
    if (contentType) headers["Content-Type"] = contentType;

    const userId = c.req.header("x-user-id");
    const userEmail = c.req.header("x-user-email");
    const userRole = c.req.header("x-user-role");
    const clientIP =
      c.req.header("x-forwarded-for")?.split(",")[0].trim() ||
      c.req.header("x-real-ip") ||
      (c as any).env?.remoteAddr ||
      c.req.raw.headers.get("x-forwarded-for") ||
      "";

    if (clientIP) headers["x-forwarded-for"] = clientIP;

    if (userId) headers["x-user-id"] = userId;
    if (userEmail) headers["x-user-email"] = userEmail;
    if (userRole) headers["x-user-role"] = userRole;

    // Node's fetch has no default timeout; without this a wedged service holds
    // the gateway's socket and buffered body indefinitely. Kept below the
    // 15s inbound timeout in app.ts so the proxy fails first and can answer.
    const response = await fetch(targetUrl, {
      method,
      headers,
      body,
      signal: AbortSignal.timeout(10_000),
    });
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
    // Oversized chunked body: let it reach bodyLimit in app.ts, which turns it
    // into a 413. Swallowing it here would report a client error as a 502.
    if (error?.name === "BodyLimitError") throw error;

    const isTimeout = error?.name === "TimeoutError" || error?.name === "AbortError";
    // Log the real cause for operators; never return it. error.message carries
    // container IPs, ports and service names on a connection failure.
    console.error(
      `[proxy] ${method} ${url} failed:`,
      error?.name ?? "Error",
      error?.message ?? error,
    );
    return c.json(
      {
        success: false,
        message: isTimeout ? "Upstream timed out" : "Upstream unavailable",
      },
      isTimeout ? 504 : 502,
    );
  }
};
