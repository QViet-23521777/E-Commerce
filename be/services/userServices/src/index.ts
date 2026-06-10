// index.ts
import "dotenv/config";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import userRoutes from "./routes/user.route";
import { connectDatabase } from "./config/database";
import adminRoutes from "./routes/admin.route";
import sellerRoutes from "./routes/seller.route";
import actionPermission from "./routes/action.permission.route";
const app = new Hono();

app.use("*", async (c, next) => {
  console.log(`${c.req.method} ${c.req.url}`);
  await next();
});

app.route("/api/users", userRoutes);
app.route("/api/admin", adminRoutes);
app.route("/api/sellers", sellerRoutes);
app.route("/api/permissions", actionPermission);

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
