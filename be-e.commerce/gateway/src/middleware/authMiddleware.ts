import { Context, Next } from "hono";
import { except } from "hono/combine";
import { timingSafeEqual } from "crypto";
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

    c.req.raw.headers.set("x-user-id", decoded.userId);
    c.req.raw.headers.set("x-user-email", decoded.email);
    c.req.raw.headers.set("x-user-role", decoded.role ?? "user");
    c.req.raw.headers.set("x-internal-secret", process.env.INTERNAL_SECRET!);

    await next();
  } catch (error) {
    console.error(
      "[auth] token verification failed:",
      error instanceof Error ? error.message : "unknown error",
    );
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

export const checkAdminAuthorization = async (c: Context, next: Next) => {
  const role =
    (c.get("userRole") as string | undefined) ?? c.req.header("x-user-role");

  // A superadmin is strictly more privileged than an admin and must pass any
  // admin gate. The admin auth service (admin.services.ts) already treats both
  // roles as valid admins and stamps the JWT role accordingly, so the seeded
  // superadmin would otherwise be locked out of every admin-only route here.
  if (role !== "admin" && role !== "superadmin") {
    return c.json(
      {
        success: false,
        message: "Forbidden: Admin access required",
      },
      403,
    );
  }
  await next();
};

const secretMatches = (received: string, expected: string | undefined) => {
  if (!expected) return false;
  const a = Buffer.from(received, "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
};

// Admin invites come from two places: a logged-in admin, or the public
// /admin/register page, which collects ADMIN_CREATION_CODE. The code is checked
// here and not only in Next.js, so calling the gateway directly can't skip it.
// Unset ADMIN_CREATION_CODE = no code is ever accepted.
const creationCode = async (c: Context, next: Next) => {
  const code = c.req.header("x-admin-creation-code");
  if (code === undefined) return next();

  if (!secretMatches(code, process.env.ADMIN_CREATION_CODE)) {
    return c.json({ success: false, message: "INVALID_SECRET" }, 403);
  }
  // Minimal identity so the user service's requireAdmin accepts the call.
  c.set("viaCreationCode", true);
  c.req.raw.headers.set("x-user-id", "admin-creation-code");
  c.req.raw.headers.set("x-user-role", "admin");
  await next();
};

export const adminCreateAuth = [
  creationCode,
  except(
    (c) => c.get("viaCreationCode") === true,
    authenticate,
    checkAdminAuthorization,
  ),
] as const;
