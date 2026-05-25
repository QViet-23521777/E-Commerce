import path from "path";
import dotenv from "dotenv";
import { serve } from "@hono/node-server";
import {
  startHealthMonitor,
  stopHealthMonitor,
} from "./services/health-monitor.service";
import { createApp } from "./app";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = createApp();
//startHealthMonitor();
const port = Number(process.env.PORT) || 3000;

serve({
  fetch: app.fetch,
  port,
});

console.log(`Gateway running on port ${port}`);

process.on("SIGTERM", () => {
  stopHealthMonitor();
  process.exit(0);
});

process.on("SIGINT", () => {
  stopHealthMonitor();
  process.exit(0);
});
