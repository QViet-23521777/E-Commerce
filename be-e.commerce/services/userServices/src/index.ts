// index.ts
import "dotenv/config";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import userRoutes from "./routes/userRoutes";
import { connectDatabase } from "./config/database";
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

connectDatabase().then(() => {
  console.log(`User service is running on http://localhost:${port}`);
  serve({ fetch: app.fetch.bind(app), port });
});
