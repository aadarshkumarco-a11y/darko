import type { Server } from "socket.io";
import type { AuthenticatedSocket } from "../auth.js";
import type { RoomManager } from "../rooms/room-manager.js";
import type { AckResponse, RoomStatePayload } from "../events.js";
import { roomJoinSchema, validate } from "../validators/index.js";
import { prisma } from "../prisma.js";
import { toRoomSettingsState } from "../mappers.js";

/**
 * Register room lifecycle event handlers.
 */
export function registerRoomHandlers(
  io: Server,
  socket: AuthenticatedSocket,
  roomManager: RoomManager
): void {
  /**
   * room:join — Join a room by roomToken (from POST /api/rooms/[slug]/join).
   */
  socket.on("room:join", async (payload, ack) => {
    try {
      const parsed = validate(roomJoinSchema, payload);
      if (!parsed.ok) {
        return ack({ ok: false, error: parsed.error, code: "VALIDATION" });
      }

      // The token was already verified in the auth middleware — we trust socket.data.user here.
      // But we need the roomId from the token. Since auth.ts already verified it,
      // we re-decode to get the roomId (the token is in payload.roomToken).
      // Actually, the auth middleware already set socket.data.user, but not the room info.
      // Let's get room info from the token.
      const jwt = await import("jsonwebtoken");
      const secret = process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET!;
      const decoded = jwt.verify(payload.roomToken, secret) as {
        roomId: string;
        slug: string;
        userId: string;
        displayName: string;
        isGuest: boolean;
        role: string;
      };

      const roomId = decoded.roomId;
      const slug = decoded.slug;

      // Verify the room still exists in DB and fetch current settings
      const room = await prisma.room.findUnique({
        where: { id: roomId },
        include: { settings: true },
      });

      if (!room) {
        return ack({ ok: false, error: "Room not found", code: "ROOM_NOT_FOUND" });
      }

      // Check if room has expired
      if (room.expiresAt && room.expiresAt < new Date()) {
        return ack({ ok: false, error: "Room has expired", code: "ROOM_EXPIRED" });
      }

      // Check capacity
      const onlineCount = roomManager.getRoom(roomId)?.participants.size ?? 0;
      if (onlineCount >= room.maxParticipants) {
        return ack({ ok: false, error: "Room is full", code: "ROOM_FULL" });
      }

      // Load settings (create default if missing)
      let settings = room.settings;
      if (!settings) {
        settings = await prisma.roomSettings.create({
          data: { roomId: room.id },
        });
      }

      // Join the room
      const state = await roomManager.join(
        socket,
        roomId,
        slug,
        toRoomSettingsState(settings),
        room.title,
        room.theme,
        room.currentMode
      );

      socket.data.room = { id: roomId, slug };

      // Send state to the joining user
      ack({ ok: true, data: state } as AckResponse<RoomStatePayload>);

      // Broadcast to the room that a new user joined
      socket.to(`room:${roomId}`).emit("presence:user_joined", {
        participant: state.self,
      });

      console.log(`[room:${slug}] ${decoded.displayName} joined (${state.participants.length} online)`);
    } catch (err) {
      console.error("[room:join] error:", err);
      ack({ ok: false, error: "Failed to join room", code: "INTERNAL" });
    }
  });

  /**
   * room:leave — Leave the current room.
   */
  socket.on("room:leave", (ack) => {
    const result = roomManager.leave(socket);
    if (result) {
      socket.leave(`room:${result.roomId}`);
      // Broadcast to the room
      io.to(`room:${result.roomId}`).emit("presence:user_left", {
        participantId: result.participantId,
        reason: "left" as const,
      });
      if (result.newOwnerId) {
        io.to(`room:${result.roomId}`).emit("role:update", {
          targetUserId: result.newOwnerId,
          oldRole: "MEMBER",
          newRole: "OWNER",
          changedBy: "system",
        });
      }
      console.log(`[room] user left`);
    }
    ack({ ok: true });
  });

  /**
   * room:heartbeat — Keep participant alive.
   */
  socket.on("room:heartbeat", (ack) => {
    const ok = roomManager.heartbeat(socket);
    ack({ ok });
  });
}
