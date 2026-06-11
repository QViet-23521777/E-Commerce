import { Context, Next } from "hono";
import jwt from "jsonwebtoken";
import { JwtUtils } from "../utils/jwt.utils";

let cachedPrivateKey: string | null = null;
const getPrivateKey = () => {
  if (!cachedPrivateKey) {
    cachedPrivateKey = Buffer.from(process.env.PRIVATE_KEY_B64!, "base64").toString();
  }
  return cachedPrivateKey;
};

export const authenticate = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header("Authorization");
    console.log("Auth header:", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ Missing or malformed auth header");
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
    console.log("✅ Token decoded:", decoded);

    c.set("userId", decoded.userId);
    c.set("userEmail", decoded.email);
    c.set("userRole", decoded.role ?? "user");

    const serviceToken = jwt.sign(
      { caller: "gateway" },
      getPrivateKey(),
      { algorithm: "RS256", expiresIn: "60s" },
    );
    c.req.raw.headers.set("x-user-id", decoded.userId);
    c.req.raw.headers.set("x-user-email", decoded.email);
    c.req.raw.headers.set("x-user-role", decoded.role ?? "user");
    c.req.raw.headers.set("x-internal-token", serviceToken);

    console.log("✅ User authenticated:", decoded.email);
    await next();
  } catch (error) {
    console.error("❌ Auth error:", error);
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
  const serviceToken = jwt.sign(
    { caller: "gateway" },
    getPrivateKey(),
    { algorithm: "RS256", expiresIn: "60s" },
  );
  c.req.raw.headers.set("x-internal-token", serviceToken);
  await next();
};

export const checkAdminAuthorization = async (c: Context, next: Next) => {
  console.log("Checking admin authorization...");
  const role =
    (c.get("userRole") as string | undefined) ?? c.req.header("x-user-role");
  console.log("Role value:", role);
  console.log("Role type:", typeof role);
  console.log("Role length:", role?.length);

  if (role !== "admin") {
    return c.json(
      {
        success: false,
        message: "Forbidden: Admin access required",
      },
      403,
    );
  }
  console.log("✅ User authorized as admin");
  await next();
};
