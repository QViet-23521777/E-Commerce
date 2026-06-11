import { Context, Next } from "hono";
import jwt from "jsonwebtoken";

const publicKey = Buffer.from(process.env.PUBLIC_KEY_B64!, "base64").toString();

export const internalAuth = async (c: Context, next: Next) => {
  const token = c.req.header("x-internal-token");

  if (!token) {
    return c.json({ success: false, message: "Forbidden" }, 403);
  }

  try {
    const decoded = jwt.verify(token, publicKey, { algorithms: ["RS256"] }) as { caller: string };
    if (decoded.caller !== "gateway") {
      return c.json({ success: false, message: "Forbidden" }, 403);
    }
  } catch {
    return c.json({ success: false, message: "Forbidden" }, 403);
  }

  await next();
};
