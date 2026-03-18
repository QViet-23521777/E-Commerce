import "dotenv/config";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { connectDatabase } from "./config/database";
import productRoutes from "./routes/product.route";
import { config } from "./config";

const app = new Hono();

app.use("*", async (c, next) => {
  console.log(`${c.req.method} ${c.req.url}`);
  await next();
});

app.route("/api/products", productRoutes);

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    service: "inventory-service",
    timestamp: new Date().toISOString(),
  });
});

connectDatabase().then(() => {
  console.log(
    `🚀 Inventory service running on http://localhost:${config.port}`,
  );
  serve({
    fetch: app.fetch.bind(app),
    port: Number(config.port),
  });
});
