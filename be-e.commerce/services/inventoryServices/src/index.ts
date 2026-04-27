import "dotenv/config";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { connectDatabase } from "./config/database";
import productRoutes from "./routes/product.route";
import { config } from "./config";
import { kafkaConsumerService } from "./services/kafkaConsumer.service";
import {
  checkRedisHealth,
  checkDatabaseHealth,
  checkKafkaHealth,
} from "./controllers/health";

const app = new Hono();

app.use("*", async (c, next) => {
  console.log(`${c.req.method} ${c.req.url}`);
  await next();
});

app.route("/api/products", productRoutes);

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

async function startKafkaConsumerWithRetry(): Promise<void> {
  let attempt = 0;

  // Keep the service alive even if Kafka is temporarily unavailable.
  // This matters especially in docker-compose where Kafka may start later.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await kafkaConsumerService.connect();
      return;
    } catch (error) {
      attempt += 1;
      const delayMs = Math.min(30_000, 1_000 * 2 ** Math.min(attempt, 5));
      console.error(
        `Kafka connect failed (attempt ${attempt}). Retrying in ${delayMs}ms...`,
        error,
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

function setupGracefulShutdown(): void {
  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}. Shutting down...`);
    try {
      await kafkaConsumerService.disconnect();
    } catch (error) {
      console.error("Kafka disconnect error:", error);
    } finally {
      process.exit(0);
    }
  };

  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
}

connectDatabase().then(() => {
  console.log(
    `🚀 Inventory service running on http://localhost:${config.port}`,
  );
  serve({
    fetch: app.fetch.bind(app),
    port: Number(config.port),
  });

  setupGracefulShutdown();
  void startKafkaConsumerWithRetry();
});
