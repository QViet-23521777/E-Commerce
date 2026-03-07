import { Context, Next } from "hono";

export const extractUser = async (c: Context, next: Next) => {
  const userId = c.req.header("x-user-id");
  const email = c.req.header("x-user-email");
  const role = c.req.header("x-user-role");

  if (!userId) {
    return c.json({ success: false, message: "Unauthorized" }, 401);
  }

  c.set("user", { id: userId, email, role });

  await next();
};
