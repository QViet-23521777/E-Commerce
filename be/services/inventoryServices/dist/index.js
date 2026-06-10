"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const hono_1 = require("hono");
const node_server_1 = require("@hono/node-server");
const database_1 = require("./config/database");
const product_route_1 = __importDefault(require("./routes/product.route"));
const config_1 = require("./config");
const kafkaConsumer_service_1 = require("./services/kafkaConsumer.service");
const app = new hono_1.Hono();
app.use("*", async (c, next) => {
    console.log(`${c.req.method} ${c.req.url}`);
    await next();
});
app.route("/api/products", product_route_1.default);
app.get("/health", (c) => {
    return c.json({
        status: "ok",
        service: "inventory-service",
        timestamp: new Date().toISOString(),
    });
});
async function startKafkaConsumerWithRetry() {
    let attempt = 0;
    // Keep the service alive even if Kafka is temporarily unavailable.
    // This matters especially in docker-compose where Kafka may start later.
    // eslint-disable-next-line no-constant-condition
    while (true) {
        try {
            await kafkaConsumer_service_1.kafkaConsumerService.connect();
            return;
        }
        catch (error) {
            attempt += 1;
            const delayMs = Math.min(30000, 1000 * 2 ** Math.min(attempt, 5));
            console.error(`Kafka connect failed (attempt ${attempt}). Retrying in ${delayMs}ms...`, error);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }
}
function setupGracefulShutdown() {
    const shutdown = async (signal) => {
        console.log(`Received ${signal}. Shutting down...`);
        try {
            await kafkaConsumer_service_1.kafkaConsumerService.disconnect();
        }
        catch (error) {
            console.error("Kafka disconnect error:", error);
        }
        finally {
            process.exit(0);
        }
    };
    process.once("SIGINT", () => void shutdown("SIGINT"));
    process.once("SIGTERM", () => void shutdown("SIGTERM"));
}
(0, database_1.connectDatabase)().then(() => {
    console.log(`🚀 Inventory service running on http://localhost:${config_1.config.port}`);
    (0, node_server_1.serve)({
        fetch: app.fetch.bind(app),
        port: Number(config_1.config.port),
    });
    setupGracefulShutdown();
    void startKafkaConsumerWithRetry();
});
//# sourceMappingURL=index.js.map