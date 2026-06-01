import { Hono } from "hono";
import "dotenv/config";
import { serve } from "@hono/node-server";
import mongoose from "mongoose";
import chatRoutes from "./routes/chat.routes";
import { config } from "./config";

const app = new Hono();

app.use("*", async (c, next) => {
  console.log(`${c.req.method} ${c.req.url}`);
  await next();
});

app.route("/api/chat", chatRoutes);

app.get("/health", (c) =>
  c.json({
    service: "Chat Service",
    status: mongoose.connection.readyState === 1 ? "ok" : "error",
    timestamp: new Date().toISOString(),
  }),
);

const port = parseInt(String(config.port), 10);

mongoose
  .connect(config.mongoUri)
  .then(() => {
    console.log("Connected to MongoDB");
    console.log(`Chat service is running on http://localhost:${port}`);
    serve({ fetch: app.fetch.bind(app), port });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });
