import { Context } from "hono";

type Methods = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export const Request = async (
  c: Context,
  url: string,
  method: Methods = "POST",
) => {
  try {
    const isBodyMethod = ["POST", "PUT", "PATCH"].includes(method);
    let body: string | undefined = undefined;
    if (isBodyMethod) {
      const cloned = c.req.raw.clone();
      const text = await cloned.text();
      body = text.trim() ? text : undefined;
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

    const response = await fetch(targetUrl, { method, headers, body });
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
    return c.json({ success: false, message: error.message }, 500);
  }
};
