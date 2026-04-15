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

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-internal-secret": process.env.INTERNAL_SECRET!,
    };

    const userId = c.get("userId") as string | undefined;
    const userEmail = c.get("userEmail") as string | undefined;
    const userRole = c.get("userRole") as string | undefined;

    if (userId) headers["x-user-id"] = userId;
    if (userEmail) headers["x-user-email"] = userEmail;
    if (userRole) headers["x-user-role"] = userRole;

    const response = await fetch(url, {
      method,
      headers,
      body,
    });

    const data = await response.json();
    return c.json(data, response.status as any);
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
};
