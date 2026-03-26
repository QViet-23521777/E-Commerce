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
(0, database_1.connectDatabase)().then(() => {
    console.log(`🚀 Inventory service running on http://localhost:${config_1.config.port}`);
    (0, node_server_1.serve)({
        fetch: app.fetch.bind(app),
        port: Number(config_1.config.port),
    });
});
//# sourceMappingURL=index.js.map