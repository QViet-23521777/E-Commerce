import path from "path";
import dotenv from "dotenv";
import { serve } from "@hono/node-server";
import {
  startHealthMonitor,
  stopHealthMonitor,
} from "./services/health-monitor.service";

// dotenv must run before ./app is loaded — route files capture process.env
// at module load time, so the require() call for ./app must come after this.
dotenv.config({ path: path.resolve(path.dirname(__filename), "../.env") });

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createApp } = require("./app") as typeof import("./app");

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
