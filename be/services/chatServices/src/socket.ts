import { Server } from "socket.io";
import type { Server as HttpServer } from "http";

let io: Server;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    const userId = socket.handshake.headers["x-user-id"] as string | undefined;

    if (!userId) {
      socket.disconnect(true);
      return;
    }
    socket.join(userId);
    console.log(`[WS] connected: ${userId}`);

    socket.on("join_conversation", (conversationId: string) => {
      socket.join(conversationId);
      console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
    });

    socket.on("leave_conversation", (conversationId: string) => {
      socket.leave(conversationId);
      console.log(`Socket ${socket.id} left conversation ${conversationId}`);
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
