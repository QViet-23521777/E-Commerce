import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { authenticate } from "./middleware/authMiddleware";
import "dotenv/config";
import userRoutes from "./routes/user.routes";

const app = new Hono();

app.use("*", cors());

app.get("/health", (c) => c.json({ status: "ok" }));

app.route("/api/users", userRoutes);

const port = Number(process.env.PORT) || 3000;

serve({
  fetch: app.fetch,
  port,
});

console.log(`Gateway running on port ${port}`);
