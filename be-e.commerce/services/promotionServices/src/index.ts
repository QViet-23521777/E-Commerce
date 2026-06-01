import "dotenv/config";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import mongoose from "mongoose";
import promotionRoutes from "./routes/promotion.routes";

const app = new Hono();

app.use("*", async (c, next) => {
  console.log(`${c.req.method} ${c.req.url}`);
  await next();
});

app.route("/api/promotions", promotionRoutes);

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    service: "promotion-service",
    timestamp: new Date().toISOString(),
  });
});

const port = Number(process.env.PORT || 3006);
const mongoUri =
  process.env.MONGODB_URI || "mongodb://localhost:27017/promotion";

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log("Connected to MongoDB");
    console.log(`Promotion service is running on http://localhost:${port}`);
    serve({
      fetch: app.fetch.bind(app),
      port,
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });
