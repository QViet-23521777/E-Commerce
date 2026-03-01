import { Context, Next } from "hono";
import { JwtService } from "../utils/jwtService";
import { auth } from "hono/utils/basic-auth";

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
    const decoderd = JwtService.verifyAccessToken(token);

    c.set("user", {
      id: decoderd.userId,
      email: decoderd.email,
      role: decoderd.role,
    });

    await next();
  } catch (error) {
    return c.json(
      {
        success: false,
        message: "Authentication failed",
      },
      401,
    );
  }
};
