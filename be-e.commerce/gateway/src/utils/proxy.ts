import { Context } from "hono";

type Methods = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export const Request = async (
  c: Context,
  url: string,
  method: Methods = "POST",
) => {
  try {
    const isBodyMethod = ["POST", "PUT", "PATCH"].includes(method);
    const body = isBodyMethod ? await c.req.text() : undefined;
    const query = new URL(c.req.url).search;
    const targetUrl = `${url}${query}`;

    const headers: Record<string, string> = {
      "x-internal-secret": process.env.INTERNAL_SECRET!,
    };

    const contentType = c.req.header("content-type");
    if (contentType) headers["Content-Type"] = contentType;

    const userId = c.req.header("x-user-id");
    const userEmail = c.req.header("x-user-email");
    const userRole = c.req.header("x-user-role");

    if (userId) headers["x-user-id"] = userId;
    if (userEmail) headers["x-user-email"] = userEmail;
    if (userRole) headers["x-user-role"] = userRole;

    const response = await fetch(targetUrl, {
      method,
      headers,
      body: body && body.length > 0 ? body : undefined,
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
    return c.body(text, response.status as any, responseType
      ? { "Content-Type": responseType }
      : undefined);
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
};
