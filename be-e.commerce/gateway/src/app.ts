import { Hono } from "hono";
import { cors } from "hono/cors";

import activityRoutes from "./routes/activity.route";
import healthRoute from "./routes/health.route";
import paymentRoutes from "./routes/payment.route";
import permissionRoutes from "./routes/permission.route";
import productRoutes from "./routes/product.route";
import inventoryRoutes from "./routes/inventory.route";
import redisRoutes from "./routes/redis.route";
import userRoutes from "./routes/user.routes";
import walletRoutes from "./routes/wallet.route";
import sellerRoutes from "./routes/seller.route";
import { openapiSpec } from "./openapi";
import { swaggerHtml } from "./utils/swaggerHtml";
import adminRoutes from "./routes/admin.route";
export const createApp = () => {
  const app = new Hono();

  app.use("*", cors());

  app.get("/health", (c) => c.json({ status: "ok" }));
  app.route("/admin/health", healthRoute);

  app.route("/api/users", userRoutes);
  app.route("/api/products", productRoutes);
  app.route("/api/inventory", inventoryRoutes);
  app.route("/api/redis", redisRoutes);
  app.route("/api/payments", paymentRoutes);
  app.route("/api/wallets", walletRoutes);
  app.route("/api/activities", activityRoutes);
  app.route("/api/admin", adminRoutes);
  app.route("/api/permissions", permissionRoutes);
  app.route("/api/sellers", sellerRoutes);

  app.get("/openapi.json", (c) => c.json(openapiSpec));
  app.get("/docs", (c) =>
    c.html(swaggerHtml("Gateway API Docs", "/openapi.json")),
  );

  return app;
};
