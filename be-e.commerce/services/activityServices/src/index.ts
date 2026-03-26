import { Hono } from "hono";
import "dotenv/config";
import { serve } from "@hono/node-server";
import mongoose from "mongoose";
import activityRoutes from "./routes/activity.routes";

const app = new Hono();

app.use("*", async (c, next) => {
  console.log(`${c.req.method} ${c.req.url}`);
  await next();
});

app.route("/api/activities", activityRoutes);

app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

const port = parseInt(process.env.PORT || "3004");

const mongoUri = process.env.MONGODB_URI || "mongodb://mongodb:27017/activity";

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
