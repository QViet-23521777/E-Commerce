// index.ts
import "dotenv/config";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { swaggerUI } from "@hono/swagger-ui";
import userRoutes from "./routes/userRoutes";
import { connectDatabase } from "./config/database";
import adminRoutes from "./routes/admin.routes";
import sellerRoutes from "./routes/seller.routes";
import actionPermission from "./routes/action.permission.routes";
import { openapiSpec } from "./openapi";
const app = new Hono();

app.use("*", async (c, next) => {
  console.log(`${c.req.method} ${c.req.url}`);
  await next();
});

app.route("/api/users", userRoutes);
app.route("/api/admin", adminRoutes);
app.route("/api/sellers", sellerRoutes);
app.route("/api/permissions", actionPermission);

app.get("/openapi.json", (c) => c.json(openapiSpec));
app.get("/docs", swaggerUI({ url: "/openapi.json" }));
app.get("/health", (c) => {
  return c.json({
    service: "User Service",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

const port = parseInt(process.env.PORT || "3001");

connectDatabase().then(() => {
  console.log(`User service is running on http://localhost:${port}`);
  serve({ fetch: app.fetch.bind(app), port });
});
