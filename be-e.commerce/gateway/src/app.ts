import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { compress } from "hono/compress";
import { bodyLimit } from "hono/body-limit";
import { timeout } from "hono/timeout";

import activityRoutes from "./routes/activity.route";
import healthRoute from "./routes/health.route";
import paymentRoutes from "./routes/payment.route";
import promotionRoutes from "./routes/promotion.route";
import permissionRoutes from "./routes/permission.route";
import productRoutes from "./routes/product.route";
import inventoryRoutes from "./routes/inventory.route";
import redisRoutes from "./routes/redis.route";
import userRoutes from "./routes/user.routes";
import walletRoutes from "./routes/wallet.route";
import sellerRoutes from "./routes/seller.route";
import chatRoutes from "./routes/chat.route";
import cartRoutes from "./routes/cart.route";
import supportRoutes from "./routes/support.route";
import { openapiSpec } from "./openapi";
import { swaggerHtml } from "./utils/swaggerHtml";
import adminRoutes from "./routes/admin.route";
import { stripIdentityHeaders } from "./middleware/stripIdentityHeaders";
import {
  generalLimiter,
  loginLimiter,
  otpLimiter,
  signupLimiter,
} from "./middleware/rateLimit";
export const createApp = () => {
  const app = new Hono();

  app.use("*", stripIdentityHeaders);
  app.use("*", secureHeaders());
  app.use("*", compress());

  const allowedOrigins = (
    process.env.ALLOWED_ORIGINS ?? "http://localhost:3100"
  )
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  app.use(
    "*",
    cors({
      origin: allowedOrigins,
      credentials: true,
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    }),
  );

  // 10 MB covers product image uploads (/api/products). Everything else is JSON
  // and far smaller — tighten per-route-group if upload traffic gets its own path.
  app.use("/api/*", bodyLimit({ maxSize: 10 * 1024 * 1024 }));
  app.use("/api/*", timeout(15_000));

  app.use("/api/users/login", loginLimiter);
  app.use("/api/admin/login", loginLimiter);
  app.use("/api/users/second-factor-auth", otpLimiter);
  app.use("/api/admin/second-factor-auth", otpLimiter);
  app.use("/api/users/verify-resetpassword", otpLimiter);
  app.use("/api/users/register", signupLimiter);
  app.use("/api/users/send-reset-password-email", signupLimiter);
  // Admin invites send email and accept ADMIN_CREATION_CODE — bound guessing.
  app.use("/api/admin/create", signupLimiter);

  app.use("/api/*", generalLimiter);

  app.get("/health", (c) => c.json({ status: "ok" }));
  app.route("/admin/health", healthRoute);

  app.route("/api/users", userRoutes);
  app.route("/api/products", productRoutes);
  app.route("/api/inventory", inventoryRoutes);
  app.route("/api/redis", redisRoutes);
  app.route("/api/payments", paymentRoutes);
  app.route("/api/promotions", promotionRoutes);
  app.route("/api/wallets", walletRoutes);
  app.route("/api/activities", activityRoutes);
  app.route("/api/admin", adminRoutes);
  app.route("/api/permissions", permissionRoutes);
  app.route("/api/sellers", sellerRoutes);
  app.route("/api/chat", chatRoutes);
  app.route("/api/cart", cartRoutes);
  app.route("/api/support", supportRoutes);

  app.get("/openapi.json", (c) => c.json(openapiSpec));
  app.get("/docs", (c) =>
    c.html(swaggerHtml("Gateway API Docs", "/openapi.json")),
  );

  return app;
};
