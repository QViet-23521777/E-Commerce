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

    c.set("user", {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    });

    await next();
  } catch (error) {
    return c.json({ success: false, message: "Authentication failed" }, 401);
  }
};

export const authorize = (...roles: string[]) => {
  return async (c: Context, next: Next) => {
    const user = c.get("user") as any;
    const role = user?.role;

    if (!role || !roles.includes(role)) {
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
