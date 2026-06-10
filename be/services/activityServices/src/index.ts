import { Hono } from "hono";
import "dotenv/config";
import { serve } from "@hono/node-server";
import mongoose from "mongoose";
import activityRoutes from "./routes/activity.route";
import {
  checkDatabaseHealth,
  checkRedisHealth,
  checkKafkaHealth,
} from "./controllers/health";
import { openapiSpec } from "./openapi";
import { swaggerHtml } from "./utils/swagger.html";
import { kafkaService } from "./services/kafka.service";
import { addActivity, flushActivity } from "./services/activity.service";
import { redisService } from "./services/redis.service";

const app = new Hono();

app.use("*", async (c, next) => {
  console.log(`${c.req.method} ${c.req.url}`);
  await next();
});

app.route("/api/activities", activityRoutes);
app.get("/openapi.json", (c) => c.json(openapiSpec));
app.get("/docs", (c) =>
  c.html(swaggerHtml("Activity Service API Docs", "/openapi.json")),
);

app.get("/health", async (c) => {
  const [isDatabaseHealthy, isRedisHealthy, isKafkaHealthy] = await Promise.all(
    [checkDatabaseHealth(), checkRedisHealth(), checkKafkaHealth()],
  );

  const status =
    isDatabaseHealthy && isRedisHealthy && isKafkaHealthy ? "ok" : "error";

  return c.json({
    service: "Activity Service",
    status,
    timestamp: new Date().toISOString(),
    checks: {
      database: isDatabaseHealthy,
      redis: isRedisHealthy,
      kafka: isKafkaHealthy,
    },
  });
});

const port = parseInt(process.env.PORT || "3004");

const mongoUri = process.env.MONGODB_URI || "mongodb://mongodb:27017/activity";

mongoose
  .connect(mongoUri)
  .then(async () => {
    console.log("Connected to MongoDB");
    await kafkaService.startActivityCosumer(async (data) => {
      await addActivity({
        userId: data.userId,
        activity: data.activity as "buy",
        productId: data.productId,
      });
    });
    const FLUSH_THRESHOLD_MS = 2 * 60 * 1000;
    setInterval(async () => {
      const staleUsers = redisService.getStaleUserIds(FLUSH_THRESHOLD_MS);
      for (const userId of staleUsers) {
        await flushActivity(userId);
        console.log(`⏱️ Auto-flush queue cho user ${userId}`);
      }
    }, 60_000);

    console.log(`Activity service is running on http://localhost:${port}`);
    serve({ fetch: app.fetch.bind(app), port });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });
