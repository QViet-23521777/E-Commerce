"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const node_server_1 = require("@hono/node-server");
const health_monitor_service_1 = require("./services/health-monitor.service");
const app_1 = require("./app");
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, "../.env") });
const app = (0, app_1.createApp)();
//startHealthMonitor();
const port = Number(process.env.PORT) || 3000;
(0, node_server_1.serve)({
    fetch: app.fetch,
    port,
});
console.log(`Gateway running on port ${port}`);
process.on("SIGTERM", () => {
    (0, health_monitor_service_1.stopHealthMonitor)();
    process.exit(0);
});
process.on("SIGINT", () => {
    (0, health_monitor_service_1.stopHealthMonitor)();
    process.exit(0);
});
