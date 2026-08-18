import type { Server } from "socket.io";
import type { AuthenticatedSocket } from "../auth.js";
import type { RoomManager } from "../rooms/room-manager.js";
import { roleUpdateSchema, roleTransferSchema, kickSchema, muteSchema, settingsUpdateSchema, validate } from "../validators/index.js";
import { hasPermission, canKick, canMute, canManageRole, roleRank } from "../rooms/permissions.js";
import { prisma } from "../prisma.js";
import { toRoomSettingsState } from "../mappers.js";

/**
 * Register role + settings event handlers.
 */
export function registerRoleHandlers(
  io: Server,
  socket: AuthenticatedSocket,
  roomManager: RoomManager
): void {
  /**
   * role:update — Promote/demote a participant.
   */
  socket.on("role:update", async (payload, ack) => {
    const roomId = socket.data.room?.id;
    if (!roomId) {
      return ack({ ok: false, error: "Not in a room", code: "NOT_IN_ROOM" });
    }

    const room = roomManager.getRoom(roomId);
    if (!room) {
      return ack({ ok: false, error: "Room not found", code: "ROOM_NOT_FOUND" });
    }

    const actor = roomManager.getParticipant(roomId, socket.data.user.id);
    if (!actor) {
      return ack({ ok: false, error: "Not a participant", code: "NOT_PARTICIPANT" });
    }

    const parsed = validate(roleUpdateSchema, payload);
    if (!parsed.ok) {
      return ack({ ok: false, error: parsed.error, code: "VALIDATION" });
    }

    const target = roomManager.getParticipant(roomId, parsed.data.targetUserId);
    if (!target) {
      return ack({ ok: false, error: "Target user not in room", code: "TARGET_NOT_FOUND" });
    }

    if (!canManageRole(actor.role, target.role, parsed.data.newRole)) {
      return ack({ ok: false, error: "Insufficient permissions", code: "FORBIDDEN" });
    }

    const oldRole = target.role;
    target.role = parsed.data.newRole;

    // Persist for authenticated users
    if (!target.isGuest) {
      try {
        await prisma.roomMember.update({
          where: { roomId_userId: { roomId, userId: target.id } },
          data: { role: parsed.data.newRole },
        });
      } catch (err) {
        console.error("[role:update] failed to persist:", err);
      }
    }

    io.to(`room:${roomId}`).emit("role:update", {
      targetUserId: target.id,
      oldRole,
      newRole: parsed.data.newRole,
      changedBy: socket.data.user.id,
    });

    ack({ ok: true });
  });

  /**
   * role:transfer — Transfer ownership to another participant.
   */
  socket.on("role:transfer", async (payload, ack) => {
    const roomId = socket.data.room?.id;
    if (!roomId) {
      return ack({ ok: false, error: "Not in a room", code: "NOT_IN_ROOM" });
    }

    const room = roomManager.getRoom(roomId);
    if (!room) {
      return ack({ ok: false, error: "Room not found", code: "ROOM_NOT_FOUND" });
    }

    const actor = roomManager.getParticipant(roomId, socket.data.user.id);
    if (!actor || actor.role !== "OWNER") {
      return ack({ ok: false, error: "Only the owner can transfer ownership", code: "FORBIDDEN" });
    }

    const parsed = validate(roleTransferSchema, payload);
    if (!parsed.ok) {
      return ack({ ok: false, error: parsed.error, code: "VALIDATION" });
    }

    const target = roomManager.getParticipant(roomId, parsed.data.targetUserId);
    if (!target) {
      return ack({ ok: false, error: "Target user not in room", code: "TARGET_NOT_FOUND" });
    }

    if (target.id === actor.id) {
      return ack({ ok: false, error: "You already own this room", code: "ALREADY_OWNER" });
    }

    // Swap roles
    const oldActorRole = actor.role;
    const oldTargetRole = target.role;
    actor.role = "MEMBER";
    target.role = "OWNER";

    // Persist
    try {
      await prisma.$transaction([
        prisma.room.update({
          where: { id: roomId },
          data: { ownerId: target.id },
        }),
        prisma.roomMember.update({
          where: { roomId_userId: { roomId, userId: actor.id } },
          data: { role: "MEMBER" },
        }),
        prisma.roomMember.update({
          where: { roomId_userId: { roomId, userId: target.id } },
          data: { role: "OWNER" },
        }),
      ]);
    } catch (err) {
      console.error("[role:transfer] failed to persist:", err);
      // Rollback in-memory
      actor.role = oldActorRole;
      target.role = oldTargetRole;
      return ack({ ok: false, error: "Failed to transfer ownership", code: "PERSIST_FAILED" });
    }

    io.to(`room:${roomId}`).emit("role:update", {
      targetUserId: actor.id,
      oldRole: oldActorRole,
      newRole: "MEMBER",
      changedBy: target.id,
    });
    io.to(`room:${roomId}`).emit("role:update", {
      targetUserId: target.id,
      oldRole: oldTargetRole,
      newRole: "OWNER",
      changedBy: actor.id,
    });

    ack({ ok: true });
  });

  /**
   * role:kick — Kick a participant from the room.
   */
  socket.on("role:kick", (payload, ack) => {
    const roomId = socket.data.room?.id;
    if (!roomId) {
      return ack({ ok: false, error: "Not in a room", code: "NOT_IN_ROOM" });
    }

    const room = roomManager.getRoom(roomId);
    if (!room) {
      return ack({ ok: false, error: "Room not found", code: "ROOM_NOT_FOUND" });
    }

    const actor = roomManager.getParticipant(roomId, socket.data.user.id);
    if (!actor) {
      return ack({ ok: false, error: "Not a participant", code: "NOT_PARTICIPANT" });
    }

    const parsed = validate(kickSchema, payload);
    if (!parsed.ok) {
      return ack({ ok: false, error: parsed.error, code: "VALIDATION" });
    }

    const target = roomManager.getParticipant(roomId, parsed.data.targetUserId);
    if (!target) {
      return ack({ ok: false, error: "Target not in room", code: "TARGET_NOT_FOUND" });
    }

    if (!canKick(actor, target, room.settings)) {
      return ack({ ok: false, error: "Insufficient permissions", code: "FORBIDDEN" });
    }

    // Force-disconnect the target's socket
    io.sockets.sockets.get(target.socketId)?.disconnect(true);
    console.log(`[room:${room.slug}] ${target.displayName} kicked by ${actor.displayName}`);

    ack({ ok: true });
  });

  /**
   * role:mute — Force mute/unmute a participant (server-side flag).
   * Note: This sets a flag. The actual audio mute happens client-side via WebRTC.
   */
  socket.on("role:mute", (payload, ack) => {
    const roomId = socket.data.room?.id;
    if (!roomId) {
      return ack({ ok: false, error: "Not in a room", code: "NOT_IN_ROOM" });
    }

    const room = roomManager.getRoom(roomId);
    if (!room) {
      return ack({ ok: false, error: "Room not found", code: "ROOM_NOT_FOUND" });
    }

    const actor = roomManager.getParticipant(roomId, socket.data.user.id);
    if (!actor) {
      return ack({ ok: false, error: "Not a participant", code: "NOT_PARTICIPANT" });
    }

    const parsed = validate(muteSchema, payload);
    if (!parsed.ok) {
      return ack({ ok: false, error: parsed.error, code: "VALIDATION" });
    }

    const target = roomManager.getParticipant(roomId, parsed.data.targetUserId);
    if (!target) {
      return ack({ ok: false, error: "Target not in room", code: "TARGET_NOT_FOUND" });
    }

    if (!canMute(actor, target, room.settings)) {
      return ack({ ok: false, error: "Insufficient permissions", code: "FORBIDDEN" });
    }

    // Send mute command to the target's socket
    io.to(target.socketId).emit("system:reconnect", {
      reason: parsed.data.audio ? "force_muted_audio" : "force_unmuted_audio",
    });

    ack({ ok: true });
  });
}

/**
 * Register settings event handlers.
 */
export function registerSettingsHandlers(
  io: Server,
  socket: AuthenticatedSocket,
  roomManager: RoomManager
): void {
  /**
   * settings:update — Update room settings.
   * Owner or Host only.
   */
  socket.on("settings:update", async (payload, ack) => {
    const roomId = socket.data.room?.id;
    if (!roomId) {
      return ack({ ok: false, error: "Not in a room", code: "NOT_IN_ROOM" });
    }

    const room = roomManager.getRoom(roomId);
    if (!room) {
      return ack({ ok: false, error: "Room not found", code: "ROOM_NOT_FOUND" });
    }

    const actor = roomManager.getParticipant(roomId, socket.data.user.id);
    if (!actor) {
      return ack({ ok: false, error: "Not a participant", code: "NOT_PARTICIPANT" });
    }

    if (!hasPermission(actor, "room:settings", room.settings)) {
      return ack({ ok: false, error: "Only host or owner can change settings", code: "FORBIDDEN" });
    }

    const parsed = validate(settingsUpdateSchema, payload);
    if (!parsed.ok) {
      return ack({ ok: false, error: parsed.error, code: "VALIDATION" });
    }

    const changes = parsed.data.changes;

    // Update in-memory
    Object.assign(room.settings, changes);

    // Persist to DB
    try {
      await prisma.roomSettings.update({
        where: { roomId },
        data: changes,
      });
    } catch (err) {
      console.error("[settings:update] failed to persist:", err);
      // Don't fail — in-memory is already updated
    }

    // Broadcast to room
    io.to(`room:${roomId}`).emit("settings:update", {
      changes,
      changedBy: socket.data.user.id,
    });

    ack({ ok: true });
  });
}
