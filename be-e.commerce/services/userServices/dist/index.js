"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const node_server_1 = require("@hono/node-server");
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const mongoose_1 = __importDefault(require("mongoose"));
const app = new hono_1.Hono();
app.use("*", async (c, next) => {
    console.log(`${c.req.method} ${c.req.url}`);
    await next();
});
app.route("/api/users", userRoutes_1.default);
app.get("/health", (c) => {
    return c.json({ status: "ok", timestamp: new Date().toISOString() });
});
const port = parseInt(process.env.PORT || "3001");
const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/ecommerce_users";
mongoose_1.default
    .connect(mongoUri)
    .then(() => {
    console.log("Connected to MongoDB");
    console.log(`User service is running on http://localhost:${port}`);
    (0, node_server_1.serve)({ fetch: app.fetch.bind(app), port });
})
    .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
});
