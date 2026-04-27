import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import "dotenv/config";
import userRoutes from "./routes/user.routes";
import productRoutes from "./routes/inventory.route";
import paymentRoutes from "./routes/payment.route";
import activityRoutes from "./routes/activity.route";
import {
  startHealthMonitor,
  stopHealthMonitor,
} from "./services/health-monitor.service";
import healthRoute from "./routes/health.route";
const app = new Hono();

app.use("*", cors());

app.get("/health", (c) => c.json({ status: "ok" }));
app.route("/admin/health", healthRoute);
startHealthMonitor();

app.route("/api/users", userRoutes);
app.route("/api/products", productRoutes);
app.route("/api/payments", paymentRoutes);
app.route("/api/activities", activityRoutes);
const port = Number(process.env.PORT) || 3000;

serve({
  fetch: app.fetch,
  port,
});

console.log(`Gateway running on port ${port}`);

process.on("SIGTERM", () => {
  stopHealthMonitor();
  process.exit(0);
});

process.on("SIGINT", () => {
  stopHealthMonitor();
  process.exit(0);
});
