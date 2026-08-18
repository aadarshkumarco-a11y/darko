import type { Server } from "socket.io";
import type { AuthenticatedSocket } from "../auth.js";
import type { RoomManager } from "../rooms/room-manager.js";
import type { AckResponse, ChatMessageBroadcast } from "../events.js";
import { chatMessageSchema, chatDeleteSchema, chatReactionSchema, typingSchema, validate } from "../validators/index.js";
import { checkRateLimit } from "../rate-limit.js";
import { hasPermission } from "../rooms/permissions.js";
import { prisma } from "../prisma.js";
import { randomUUID } from "crypto";

/**
 * Register chat event handlers.
 */
export function registerChatHandlers(
  io: Server,
  socket: AuthenticatedSocket,
  roomManager: RoomManager
): void {
  /**
   * chat:message — Send a chat message.
   */
  socket.on("chat:message", async (payload, ack) => {
    const roomId = socket.data.room?.id;
    if (!roomId) {
      return ack({ ok: false, error: "Not in a room", code: "NOT_IN_ROOM" });
    }

    const room = roomManager.getRoom(roomId);
    if (!room) {
      return ack({ ok: false, error: "Room not found", code: "ROOM_NOT_FOUND" });
    }

    const participant = roomManager.getParticipant(roomId, socket.data.user.id);
    if (!participant) {
      return ack({ ok: false, error: "Not a participant", code: "NOT_PARTICIPANT" });
    }

    // Check permission
    if (!hasPermission(participant, "chat:send", room.settings)) {
      return ack({ ok: false, error: "Chat is not allowed for you", code: "FORBIDDEN" });
    }

    // Rate limit
    const rl = checkRateLimit(socket.id, "chat:message");
    if (!rl.ok) {
      return ack({
        ok: false,
        error: "You're sending messages too fast. Wait a moment.",
        code: "RATE_LIMITED",
      });
    }

    // Validate
    const parsed = validate(chatMessageSchema, payload);
    if (!parsed.ok) {
      return ack({ ok: false, error: parsed.error, code: "VALIDATION" });
    }
    const input = parsed.data;

    // Find reply target if any
    let replyToSenderName: string | null = null;
    if (input.replyToId) {
      const replyTo = room.messages.find((m) => m.id === input.replyToId);
      if (replyTo && !replyTo.isDeleted) {
        replyToSenderName = replyTo.senderName;
      } else {
        return ack({ ok: false, error: "Reply target not found", code: "INVALID_REPLY" });
      }
    }

    const now = Date.now();
    const messageId = randomUUID();
    const senderId = socket.data.user.id;

    const broadcast: ChatMessageBroadcast = {
      id: messageId,
      roomId,
      senderId,
      senderName: participant.displayName,
      senderAvatar: participant.avatarUrl,
      senderRole: participant.role,
      content: input.content,
      replyToId: input.replyToId ?? null,
      replyToSenderName,
      createdAt: now,
      isDeleted: false,
    };

    // Add to in-memory ring buffer
    roomManager.addMessage(roomId, broadcast);

    // Persist to DB (only for authenticated users; guests get in-memory only)
    // For MVP: persist all messages but tie to a synthetic user ID for guests.
    // Actually, since guests don't have User rows, we can't create Message rows for them.
    // Solution: persist messages only if sender is not a guest. Guest messages stay in-memory.
    if (!socket.data.user.isGuest) {
      try {
        await prisma.message.create({
          data: {
            id: messageId,
            roomId,
            userId: senderId,
            content: input.content,
            replyToId: input.replyToId ?? null,
          },
        });
      } catch (err) {
        console.error("[chat:message] failed to persist:", err);
        // Don't fail the message — it's already in memory
      }
    }

    // Broadcast to the room
    io.to(`room:${roomId}`).emit("chat:message", broadcast);

    ack({ ok: true, data: { messageId } } as AckResponse<{ messageId: string }>);

    // Clear typing indicator for this user
    roomManager.setTyping(socket, false);
  });

  /**
   * chat:delete — Delete a message (own or any if moderator+).
   */
  socket.on("chat:delete", async (payload, ack) => {
    const roomId = socket.data.room?.id;
    if (!roomId) {
      return ack({ ok: false, error: "Not in a room", code: "NOT_IN_ROOM" });
    }

    const room = roomManager.getRoom(roomId);
    if (!room) {
      return ack({ ok: false, error: "Room not found", code: "ROOM_NOT_FOUND" });
    }

    const participant = roomManager.getParticipant(roomId, socket.data.user.id);
    if (!participant) {
      return ack({ ok: false, error: "Not a participant", code: "NOT_PARTICIPANT" });
    }

    const parsed = validate(chatDeleteSchema, payload);
    if (!parsed.ok) {
      return ack({ ok: false, error: parsed.error, code: "VALIDATION" });
    }

    const message = room.messages.find((m) => m.id === parsed.data.messageId);
    if (!message) {
      return ack({ ok: false, error: "Message not found", code: "NOT_FOUND" });
    }

    // Permission: own message OR moderator+
    const isOwn = message.senderId === socket.data.user.id;
    const canDeleteAny = hasPermission(participant, "chat:delete:any", room.settings);
    if (!isOwn && !canDeleteAny) {
      return ack({ ok: false, error: "You can only delete your own messages", code: "FORBIDDEN" });
    }

    // Soft-delete in memory
    roomManager.deleteMessage(roomId, parsed.data.messageId);

    // Soft-delete in DB (if it was persisted)
    if (!socket.data.user.isGuest || canDeleteAny) {
      try {
        await prisma.message.updateMany({
          where: { id: parsed.data.messageId },
          data: { isDeleted: true, deletedBy: socket.data.user.id },
        });
      } catch (err) {
        console.error("[chat:delete] failed to persist:", err);
      }
    }

    // Broadcast deletion
    io.to(`room:${roomId}`).emit("chat:delete", {
      messageId: parsed.data.messageId,
      deletedBy: socket.data.user.id,
    });

    ack({ ok: true });
  });

  /**
   * chat:reaction — Add/remove a reaction.
   */
  socket.on("chat:reaction", async (payload, ack) => {
    const roomId = socket.data.room?.id;
    if (!roomId) {
      return ack({ ok: false, error: "Not in a room", code: "NOT_IN_ROOM" });
    }

    const room = roomManager.getRoom(roomId);
    if (!room) {
      return ack({ ok: false, error: "Room not found", code: "ROOM_NOT_FOUND" });
    }

    const participant = roomManager.getParticipant(roomId, socket.data.user.id);
    if (!participant) {
      return ack({ ok: false, error: "Not a participant", code: "NOT_PARTICIPANT" });
    }

    if (!hasPermission(participant, "chat:send", room.settings)) {
      return ack({ ok: false, error: "Reactions are not allowed", code: "FORBIDDEN" });
    }

    const rl = checkRateLimit(socket.id, "chat:reaction");
    if (!rl.ok) {
      return ack({ ok: false, error: "Too many reactions", code: "RATE_LIMITED" });
    }

    const parsed = validate(chatReactionSchema, payload);
    if (!parsed.ok) {
      return ack({ ok: false, error: parsed.error, code: "VALIDATION" });
    }

    const message = room.messages.find((m) => m.id === parsed.data.messageId);
    if (!message) {
      return ack({ ok: false, error: "Message not found", code: "NOT_FOUND" });
    }

    // Toggle reaction in DB (only for authenticated users)
    let action: "add" | "remove" = "add";
    if (!socket.data.user.isGuest) {
      try {
        const existing = await prisma.messageReaction.findUnique({
          where: {
            messageId_userId_emoji: {
              messageId: parsed.data.messageId,
              userId: socket.data.user.id,
              emoji: parsed.data.emoji,
            },
          },
        });
        if (existing) {
          await prisma.messageReaction.delete({ where: { id: existing.id } });
          action = "remove";
        } else {
          await prisma.messageReaction.create({
            data: {
              messageId: parsed.data.messageId,
              userId: socket.data.user.id,
              emoji: parsed.data.emoji,
            },
          });
          action = "add";
        }
      } catch (err) {
        console.error("[chat:reaction] failed to persist:", err);
      }
    }

    io.to(`room:${roomId}`).emit("chat:reaction", {
      messageId: parsed.data.messageId,
      userId: socket.data.user.id,
      emoji: parsed.data.emoji,
      action,
    });

    ack({ ok: true });
  });

  /**
   * chat:typing — Start/stop typing indicator.
   */
  socket.on("chat:typing", (payload, ack) => {
    const roomId = socket.data.room?.id;
    if (!roomId) {
      return ack({ ok: false, error: "Not in a room", code: "NOT_IN_ROOM" });
    }

    const room = roomManager.getRoom(roomId);
    if (!room) {
      return ack({ ok: false, error: "Room not found", code: "ROOM_NOT_FOUND" });
    }

    const participant = roomManager.getParticipant(roomId, socket.data.user.id);
    if (!participant) {
      return ack({ ok: false, error: "Not a participant", code: "NOT_PARTICIPANT" });
    }

    if (!hasPermission(participant, "chat:send", room.settings)) {
      return ack({ ok: false, error: "Chat not allowed", code: "FORBIDDEN" });
    }

    const rl = checkRateLimit(socket.id, "chat:typing");
    if (!rl.ok) {
      return ack({ ok: false, error: "Too many typing events", code: "RATE_LIMITED" });
    }

    const parsed = validate(typingSchema, payload);
    if (!parsed.ok) {
      return ack({ ok: false, error: parsed.error, code: "VALIDATION" });
    }

    const typingInfo = roomManager.setTyping(socket, parsed.data.isTyping);
    if (typingInfo) {
      // Broadcast to others in the room
      socket.to(`room:${roomId}`).emit("chat:typing", {
        userId: typingInfo.userId,
        displayName: typingInfo.displayName,
        isTyping: typingInfo.isTyping,
      });
    }

    ack({ ok: true });
  });
}
