import { Context, Next } from "hono";
import { JwtUtils } from "../utils/jwtUtils";

export const authenticate = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json(
        {
          success: false,
          message: "Authorization header missing or malformed",
        },
        401,
      );
    }

    const token = authHeader.substring(7);
    const decoded = JwtUtils.verifyToken(token, process.env.JWT_SECRET!);

    c.set("userId", decoded.userId);
    c.set("userEmail", decoded.email);
    c.set("userRole", decoded.role ?? "user");

    c.set("userId", decoded.userId);
    c.set("userEmail", decoded.email);
    c.set("userRole", decoded.role ?? "user");

    c.req.raw.headers.set("x-internal-secret", process.env.INTERNAL_SECRET!);

    await next();
  } catch (error) {
    return c.json({ success: false, message: "Authentication failed" }, 401);
  }
};

export const authorize = (...roles: string[]) => {
  return async (c: Context, next: Next) => {
    const userId = c.req.header("x-user-id");
    const role = c.req.header("x-user-role");

    if (!userId || !role || !roles.includes(role)) {
      return c.json(
        {
          success: false,
          message:
            "Forbidden: You don't have permission to access this resource",
        },
        403,
      );
    }

    await next();
  };
};

export const injectInternalSecret = async (c: Context, next: Next) => {
  c.req.raw.headers.set("x-internal-secret", process.env.INTERNAL_SECRET!);
  await next();
};
