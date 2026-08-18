import type { Server } from "socket.io";
import type { AuthenticatedSocket } from "../auth.js";
import type { RoomManager } from "../rooms/room-manager.js";
import { z } from "zod";

/**
 * WebRTC signaling schemas.
 * SDP offers/answers and ICE candidates are relayed between peers
 * via the server (never stored).
 */

const webrtcOfferSchema = z.object({
  targetUserId: z.string().min(1),
  sdp: z.string().min(10),
});

const webrtcAnswerSchema = z.object({
  targetUserId: z.string().min(1),
  sdp: z.string().min(10),
});

const webrtcIceSchema = z.object({
  targetUserId: z.string().min(1),
  candidate: z.string(),
});

const screenShareSchema = z.object({
  isSharing: z.boolean(),
});

/**
 * Register WebRTC signaling event handlers.
 * These are pure relay — server validates sender/target are in the same room,
 * then forwards the message. No SDP inspection or modification.
 */
export function registerWebRTCHandlers(
  io: Server,
  socket: AuthenticatedSocket,
  roomManager: RoomManager
): void {
  /**
   * webrtc:offer — Send an SDP offer to a specific peer.
   */
  socket.on("webrtc:offer", (payload, ack) => {
    const roomId = socket.data.room?.id;
    if (!roomId) {
      return ack({ ok: false, error: "Not in a room", code: "NOT_IN_ROOM" });
    }

    const room = roomManager.getRoom(roomId);
    if (!room) {
      return ack({ ok: false, error: "Room not found", code: "ROOM_NOT_FOUND" });
    }

    const parsed = webrtcOfferSchema.safeParse(payload);
    if (!parsed.success) {
      return ack({ ok: false, error: "Invalid offer payload", code: "VALIDATION" });
    }

    const target = roomManager.getParticipant(roomId, parsed.data.targetUserId);
    if (!target) {
      return ack({ ok: false, error: "Target not in room", code: "TARGET_NOT_FOUND" });
    }


    // Relay the offer to the target's socket directly
    const targetSocket = io.sockets.sockets.get(target.socketId);
    if (targetSocket) {
      targetSocket.emit("webrtc:offer", {
        fromUserId: socket.data.user.id,
        sdp: parsed.data.sdp,
      });
    } else {
    }

    ack({ ok: true });
  });

  /**
   * webrtc:answer — Send an SDP answer back to the offerer.
   */
  socket.on("webrtc:answer", (payload, ack) => {
    const roomId = socket.data.room?.id;
    if (!roomId) {
      return ack({ ok: false, error: "Not in a room", code: "NOT_IN_ROOM" });
    }

    const room = roomManager.getRoom(roomId);
    if (!room) {
      return ack({ ok: false, error: "Room not found", code: "ROOM_NOT_FOUND" });
    }

    const parsed = webrtcAnswerSchema.safeParse(payload);
    if (!parsed.success) {
      return ack({ ok: false, error: "Invalid answer payload", code: "VALIDATION" });
    }

    const target = roomManager.getParticipant(roomId, parsed.data.targetUserId);
    if (!target) {
      return ack({ ok: false, error: "Target not in room", code: "TARGET_NOT_FOUND" });
    }

    io.to(target.socketId).emit("webrtc:answer", {
      fromUserId: socket.data.user.id,
      sdp: parsed.data.sdp,
    });

    ack({ ok: true });
  });

  /**
   * webrtc:ice — Relay an ICE candidate to a specific peer.
   * High rate limit (100/min) — trickle ICE can be chatty.
   */
  socket.on("webrtc:ice", (payload, ack) => {
    const roomId = socket.data.room?.id;
    if (!roomId) {
      return ack({ ok: false, error: "Not in a room", code: "NOT_IN_ROOM" });
    }

    const parsed = webrtcIceSchema.safeParse(payload);
    if (!parsed.success) {
      return ack({ ok: false, error: "Invalid ICE payload", code: "VALIDATION" });
    }

    const target = roomManager.getParticipant(roomId, parsed.data.targetUserId);
    if (!target) {
      return ack({ ok: false, error: "Target not in room", code: "TARGET_NOT_FOUND" });
    }

    io.to(target.socketId).emit("webrtc:ice", {
      fromUserId: socket.data.user.id,
      candidate: parsed.data.candidate,
    });

    ack({ ok: true });
  });

  /**
   * screen:share — Notify the room that this user is (or stopped) sharing their screen.
   */
  socket.on("screen:share", (payload, ack) => {
    const roomId = socket.data.room?.id;
    if (!roomId) {
      return ack({ ok: false, error: "Not in a room", code: "NOT_IN_ROOM" });
    }

    const parsed = screenShareSchema.safeParse(payload);
    if (!parsed.success) {
      return ack({ ok: false, error: "Invalid payload", code: "VALIDATION" });
    }

    // Update presence
    roomManager.updatePresence(socket, { screenSharing: parsed.data.isSharing });

    // Broadcast presence update to the room
    io.to(`room:${roomId}`).emit("presence:update", {
      participantId: socket.data.user.id,
      changes: { screenSharing: parsed.data.isSharing },
    });

    // Also emit a dedicated screen share event so other peers know to request the stream
    io.to(`room:${roomId}`).emit("screen:share", {
      userId: socket.data.user.id,
      isSharing: parsed.data.isSharing,
    });

    ack({ ok: true });
  });
}
