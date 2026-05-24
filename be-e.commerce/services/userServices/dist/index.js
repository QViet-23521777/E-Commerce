"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// index.ts
require("dotenv/config");
const hono_1 = require("hono");
const node_server_1 = require("@hono/node-server");
const swagger_ui_1 = require("@hono/swagger-ui");
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const database_1 = require("./config/database");
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const seller_routes_1 = __importDefault(require("./routes/seller.routes"));
const action_permission_routes_1 = __importDefault(require("./routes/action.permission.routes"));
const superadmin_routes_1 = __importDefault(require("./routes/superadmin.routes"));
const openapi_1 = require("./openapi");
const app = new hono_1.Hono();
app.use("*", async (c, next) => {
    console.log(`${c.req.method} ${c.req.url}`);
    await next();
});
app.route("/api/users", userRoutes_1.default);
app.route("/api/admin", admin_routes_1.default);
app.route("/api/superadmin", superadmin_routes_1.default);
app.route("/api/sellers", seller_routes_1.default);
app.route("/api/permissions", action_permission_routes_1.default);
app.get("/openapi.json", (c) => c.json(openapi_1.openapiSpec));
app.get("/docs", (0, swagger_ui_1.swaggerUI)({ url: "/openapi.json" }));
app.get("/health", (c) => {
    return c.json({
        service: "User Service",
        status: "ok",
        timestamp: new Date().toISOString(),
    });
});
const port = parseInt(process.env.PORT || "3001");
(0, database_1.connectDatabase)().then(() => {
    console.log(`User service is running on http://localhost:${port}`);
    (0, node_server_1.serve)({ fetch: app.fetch.bind(app), port });
});
