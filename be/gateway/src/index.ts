import path from "path";
import dotenv from "dotenv";
import { serve } from "@hono/node-server";
import { createProxyMiddleware } from "http-proxy-middleware";
import type { Server as HttpServer } from "http";
import { JwtUtils } from "./utils/jwt.utils";
import {
  startHealthMonitor,
  stopHealthMonitor,
} from "./services/health.monitor.service";

dotenv.config({ path: path.resolve(path.dirname(__filename), "../.env") });

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createApp } = require("./app") as typeof import("./app");

const app = createApp();
const port = Number(process.env.PORT) || 3000;
const chatServiceUrl = process.env.CHAT_SERVICE_URL || "http://localhost:3007";

const wsProxy = createProxyMiddleware({
  target: chatServiceUrl,
  changeOrigin: true,
  ws: true,
});

const httpServer = serve({ fetch: app.fetch, port }) as HttpServer;

httpServer.on("upgrade", (req, socket, head) => {
  if (!req.url?.startsWith("/socket.io")) return;

  const url = new URL(req.url, "http://localhost");
  const token = url.searchParams.get("token");

  if (!token) {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    return;
  }

  try {
    const decoded = JwtUtils.verifyToken(token, process.env.JWT_SECRET!);
    req.headers["x-user-id"] = decoded.userId;
    req.headers["x-user-email"] = decoded.email;
    (wsProxy as any).upgrade(req, socket, head);
  } catch {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
  }
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
