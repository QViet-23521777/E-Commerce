import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import "dotenv/config";
import userRoutes from "./routes/user.routes";
import productRoutes from "./routes/inventory.route";
import paymentRoutes from "./routes/payment.route";
import promotionRoutes from "./routes/promotion.route";
const app = new Hono();

app.use("*", cors());

app.get("/health", (c) => c.json({ status: "ok" }));

app.route("/api/users", userRoutes);
app.route("/api/products", productRoutes);
app.route("/api/payments", paymentRoutes);
app.route("/api/promotions", promotionRoutes);
const port = Number(process.env.PORT) || 3000;

serve({
  fetch: app.fetch,
  port,
});

console.log(`Gateway running on port ${port}`);
