import { createServer } from "http";
import { Server } from "socket.io";
import { config as loadEnv } from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env from the parent project's .env (so DATABASE_URL and JWT_SECRET are shared)
// Path: mini-services/realtime/src/ -> ../../../.env = /home/z/my-project/.env
loadEnv({ path: resolve(__dirname, "../../../.env") });

import { setupAuth, type AuthenticatedSocket } from "./auth.js";
import { RoomManager } from "./rooms/room-manager.js";
import { registerRoomHandlers } from "./events/room.js";
import { registerChatHandlers } from "./events/chat.js";
import { registerRoleHandlers, registerSettingsHandlers } from "./events/roles.js";
import { registerWebRTCHandlers } from "./events/webrtc.js";
import type { ClientToServerEvents, ServerToClientEvents } from "./events.js";

const PORT = Number(process.env.REALTIME_PORT ?? 3003);
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const httpServer = createServer();
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  path: "/",
  cors: {
    origin: CORS_ORIGIN.split(",").map((s) => s.trim()),
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60_000,
  pingInterval: 25_000,
  maxHttpBufferSize: 1e6, // 1MB max per message (prevents abuse)
});

// Auth middleware
setupAuth(io);

const roomManager = new RoomManager(io);

// Connection handler
io.on("connection", (socket: AuthenticatedSocket) => {
  console.log(`[socket] connected: ${socket.id} (${socket.data.user.displayName})`);

  // Register all event handlers
  registerRoomHandlers(io, socket, roomManager);
  registerChatHandlers(io, socket, roomManager);
  registerRoleHandlers(io, socket, roomManager);
  registerSettingsHandlers(io, socket, roomManager);
  registerWebRTCHandlers(io, socket, roomManager);

  // Disconnect handler
  socket.on("disconnect", (reason) => {
    console.log(`[socket] disconnected: ${socket.id} (${reason})`);

    const result = roomManager.leave(socket);
    if (result) {
      // Broadcast to the room
      io.to(`room:${result.roomId}`).emit("presence:user_left", {
        participantId: result.participantId,
        reason: "disconnected",
      });

      // If ownership was transferred, broadcast that too
      if (result.newOwnerId) {
        io.to(`room:${result.roomId}`).emit("role:update", {
          targetUserId: result.newOwnerId,
          oldRole: "MEMBER",
          newRole: "OWNER",
          changedBy: "system",
        });
      }
    }
  });

  // Error handler
  socket.on("error", (err) => {
    console.error(`[socket] error (${socket.id}):`, err);
  });
});

httpServer.listen(PORT, () => {
  console.log(`\n┌─────────────────────────────────────────────┐`);
  console.log(`│  DARKO Realtime Server                      │`);
  console.log(`│  Port: ${PORT}                                │`);
  console.log(`│  CORS: ${CORS_ORIGIN.padEnd(31)}│`);
  console.log(`│  Ready.                                     │`);
  console.log(`└─────────────────────────────────────────────┘\n`);
});

// Graceful shutdown
const shutdown = (signal: string) => {
  console.log(`\n[${signal}] shutting down...`);
  io.disconnectSockets(true);
  httpServer.close(() => {
    console.log("[realtime] server closed");
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
