import { Hono } from "hono";
import "dotenv/config";
import { serve } from "@hono/node-server";
import mongoose from "mongoose";
import feedbackRoutes from "./routes/feedback.routes";
import categoryRoutes from "./routes/category.routes";
import sellerBankRoutes from "./routes/sellerBank.routes";
import { seedCategories } from "./services/category.services";
import { config } from "./config";

const app = new Hono();

app.use("*", async (c, next) => {
  console.log(`${c.req.method} ${c.req.url}`);
  await next();
});

app.route("/api/support/feedback", feedbackRoutes);
app.route("/api/support/categories", categoryRoutes);
app.route("/api/support/seller", sellerBankRoutes);

app.get("/health", (c) =>
  c.json({
    service: "Support Service",
    status: mongoose.connection.readyState === 1 ? "ok" : "error",
    timestamp: new Date().toISOString(),
  }),
);

const port = parseInt(String(config.port), 10);

mongoose
  .connect(config.mongoUri)
  .then(async () => {
    console.log("Connected to MongoDB");
    await seedCategories();
    console.log(`Support service is running on http://localhost:${port}`);
    serve({ fetch: app.fetch.bind(app), port });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });
