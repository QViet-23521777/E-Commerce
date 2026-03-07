import "dotenv/config";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import userRoutes from "./routes/userRoutes";
import mongoose from "mongoose";

const app = new Hono();

app.use("*", async (c, next) => {
  console.log(`${c.req.method} ${c.req.url}`);
  await next();
});

app.route("/api/users", userRoutes);

app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

const port = parseInt(process.env.PORT || "3001");
const mongoUri =
  process.env.MONGODB_URI || "mongodb://localhost:27017/ecommerce_users";

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log("Connected to MongoDB");
    console.log(`User service is running on http://localhost:${port}`);
    serve({ fetch: app.fetch.bind(app), port });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });
