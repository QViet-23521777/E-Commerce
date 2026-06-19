import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { config } from "./config";

let io: Server;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Verify JWT before allowing connection — prevents userId spoofing
  io.use((socket, next) => {
    const raw =
      (socket.handshake.auth?.token as string | undefined) ||
      (socket.handshake.headers["authorization"] as string | undefined);

    if (!raw) return next(new Error("Authentication required"));

    const token = raw.startsWith("Bearer ") ? raw.slice(7) : raw;

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
      socket.data.userId = decoded.userId;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;
    socket.join(userId);
    console.log(`[WS] connected: ${userId}`);

    socket.on("join_conversation", (conversationId: string) => {
      socket.join(conversationId);
    });

    socket.on("leave_conversation", (conversationId: string) => {
      socket.leave(conversationId);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
}

export function getIo(): Server {
  if (!io) {
    throw new Error("Socket.io not initialized. Call initSocket first.");
  }
  return io;
}
