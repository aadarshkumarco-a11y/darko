import type { Server } from "socket.io";
import type { AuthenticatedSocket } from "./auth.js";
import type {
  ParticipantState,
  RoomStatePayload,
  RoomSettingsState,
  ChatMessageBroadcast,
} from "./events.js";

/**
 * In-memory room state manager.
 *
 * Trade-off: state is lost on server restart. This is acceptable for MVP —
 * the server rehydrates from the database (room settings, playlist, last 200
 * messages) on first join, and presence rebuilds from heartbeats.
 *
 * For multi-instance production, swap with Redis pub/sub.
 */

interface RoomParticipant extends ParticipantState {
  socketId: string;
  lastHeartbeat: number;
}

interface RoomState {
  id: string;
  slug: string;
  title: string;
  theme: string;
  currentMode: string;
  settings: RoomSettingsState;
  participants: Map<string, RoomParticipant>; // participantId -> participant
  messages: ChatMessageBroadcast[]; // ring buffer, capped at 200
  typingUsers: Map<string, { displayName: string; expiresAt: number }>;
}

const rooms = new Map<string, RoomState>(); // roomId -> state
const socketToRoom = new Map<string, { roomId: string; participantId: string }>();

const MESSAGE_HISTORY_LIMIT = 200;
const HEARTBEAT_TIMEOUT_MS = 60_000; // 60s without heartbeat = disconnected
const TYPING_TIMEOUT_MS = 5_000; // typing indicator expires after 5s of no update
const OWNER_DISCONNECT_GRACE_MS = 5 * 60_000; // 5min grace before transferring ownership

// Periodic cleanup of stale participants
setInterval(() => {
  const now = Date.now();
  for (const room of rooms.values()) {
    for (const [pid, p] of room.participants.entries()) {
      if (now - p.lastHeartbeat > HEARTBEAT_TIMEOUT_MS) {
        // Mark as timed out — actual cleanup happens in the socket disconnect handler
        // But if the socket is gone, we need to remove them here
        room.participants.delete(pid);
        socketToRoom.delete(p.socketId);
        console.log(`[room:${room.slug}] participant ${pid} timed out`);
      }
    }
    // Clean up expired typing indicators
    for (const [uid, t] of room.typingUsers.entries()) {
      if (now > t.expiresAt) {
        room.typingUsers.delete(uid);
      }
    }
  }
}, 15_000).unref?.();

export class RoomManager {
  constructor(private io: Server) {}

  /**
   * Join a room. Returns the initial state to send back to the client.
   */
  async join(
    socket: AuthenticatedSocket,
    roomId: string,
    slug: string,
    settings: RoomSettingsState,
    title: string,
    theme: string,
    currentMode: string
  ): Promise<RoomStatePayload> {
    let room = rooms.get(roomId);
    if (!room) {
      room = {
        id: roomId,
        slug,
        title,
        theme,
        currentMode,
        settings,
        participants: new Map(),
        messages: [],
        typingUsers: new Map(),
      };
      rooms.set(roomId, room);
    } else {
      // Update title/theme/settings in case they changed since last load
      room.title = title;
      room.theme = theme;
      room.currentMode = currentMode;
      room.settings = settings;
    }

    const participantId = socket.data.user.id;
    const now = Date.now();

    const participant: RoomParticipant = {
      id: participantId,
      displayName: socket.data.user.displayName,
      avatarUrl: null, // TODO: fetch from DB for Google users
      role: socket.data.user.role,
      isGuest: socket.data.user.isGuest,
      isOnline: true,
      audioEnabled: false,
      videoEnabled: false,
      screenSharing: false,
      isIdle: false,
      joinedAt: now,
      socketId: socket.id,
      lastHeartbeat: now,
    };

    // If already in the room (reconnect), replace the old entry
    const existing = room.participants.get(participantId);
    if (existing) {
      // Reconnect: preserve media state from before
      participant.audioEnabled = existing.audioEnabled;
      participant.videoEnabled = existing.videoEnabled;
      participant.screenSharing = existing.screenSharing;
    }

    room.participants.set(participantId, participant);
    socketToRoom.set(socket.id, { roomId, participantId });

    // Join the socket.io room
    await socket.join(`room:${roomId}`);

    const state: RoomStatePayload = {
      room: {
        id: room.id,
        slug: room.slug,
        title: room.title,
        theme: room.theme,
        currentMode: room.currentMode,
        settings: room.settings,
      },
      participants: Array.from(room.participants.values()).map(toParticipantState),
      lastMessages: room.messages.slice(-50), // Last 50 messages for initial load
      self: toParticipantState(participant),
    };

    return state;
  }

  /**
   * Remove a socket from its room. Returns broadcast info if applicable.
   */
  leave(socket: AuthenticatedSocket): {
    roomId: string;
    participantId: string;
    newOwnerId?: string;
  } | null {
    const mapping = socketToRoom.get(socket.id);
    if (!mapping) return null;

    const { roomId, participantId } = mapping;
    const room = rooms.get(roomId);
    if (!room) {
      socketToRoom.delete(socket.id);
      return { roomId, participantId };
    }

    const participant = room.participants.get(participantId);
    room.participants.delete(participantId);
    socketToRoom.delete(socket.id);

    // If the owner left, transfer ownership
    let newOwnerId: string | undefined;
    if (participant?.role === "OWNER" && room.participants.size > 0) {
      const newOwner = this.electNewOwner(room);
      if (newOwner) {
        newOwner.role = "OWNER";
        newOwnerId = newOwner.id;
        console.log(`[room:${room.slug}] ownership transferred to ${newOwner.displayName}`);
      }
    }

    // If room is now empty, schedule cleanup (don't delete immediately — allows quick rejoin)
    if (room.participants.size === 0) {
      // Keep the room in memory for 5 minutes to allow quick rejoin
      setTimeout(() => {
        const r = rooms.get(roomId);
        if (r && r.participants.size === 0) {
          rooms.delete(roomId);
          console.log(`[room:${room.slug}] evicted from memory (empty)`);
        }
      }, 5 * 60_000).unref?.();
    }

    return { roomId, participantId, newOwnerId };
  }

  /**
   * Update a participant's presence state.
   */
  updatePresence(
    socket: AuthenticatedSocket,
    changes: Partial<Pick<RoomParticipant, "audioEnabled" | "videoEnabled" | "screenSharing" | "isIdle">>
  ): { participantId: string; changes: typeof changes } | null {
    const mapping = socketToRoom.get(socket.id);
    if (!mapping) return null;

    const room = rooms.get(mapping.roomId);
    if (!room) return null;

    const participant = room.participants.get(mapping.participantId);
    if (!participant) return null;

    participant.lastHeartbeat = Date.now();
    Object.assign(participant, changes);

    return { participantId: mapping.participantId, changes };
  }

  /**
   * Record a heartbeat (just updates the lastHeartbeat timestamp).
   */
  heartbeat(socket: AuthenticatedSocket): boolean {
    const mapping = socketToRoom.get(socket.id);
    if (!mapping) return false;

    const room = rooms.get(mapping.roomId);
    if (!room) return false;

    const participant = room.participants.get(mapping.participantId);
    if (!participant) return false;

    participant.lastHeartbeat = Date.now();
    participant.isIdle = false;
    return true;
  }

  /**
   * Append a chat message to the room's ring buffer.
   */
  addMessage(roomId: string, message: ChatMessageBroadcast): void {
    const room = rooms.get(roomId);
    if (!room) return;
    room.messages.push(message);
    if (room.messages.length > MESSAGE_HISTORY_LIMIT) {
      room.messages.shift();
    }
  }

  /**
   * Mark a message as deleted (soft delete — keeps it in history but flags it).
   */
  deleteMessage(roomId: string, messageId: string): boolean {
    const room = rooms.get(roomId);
    if (!room) return false;
    const msg = room.messages.find((m) => m.id === messageId);
    if (!msg) return false;
    msg.isDeleted = true;
    msg.content = ""; // Don't keep the content after deletion
    return true;
  }

  /**
   * Set/remove typing indicator for a user.
   */
  setTyping(socket: AuthenticatedSocket, isTyping: boolean): { userId: string; displayName: string; isTyping: boolean } | null {
    const mapping = socketToRoom.get(socket.id);
    if (!mapping) return null;

    const room = rooms.get(mapping.roomId);
    if (!room) return null;

    const userId = mapping.participantId;
    const participant = room.participants.get(userId);
    if (!participant) return null;

    if (isTyping) {
      room.typingUsers.set(userId, {
        displayName: participant.displayName,
        expiresAt: Date.now() + TYPING_TIMEOUT_MS,
      });
    } else {
      room.typingUsers.delete(userId);
    }

    return { userId, displayName: participant.displayName, isTyping };
  }

  /**
   * Get all currently-typing users in a room.
   */
  getTypingUsers(roomId: string): { userId: string; displayName: string }[] {
    const room = rooms.get(roomId);
    if (!room) return [];
    const now = Date.now();
    const result: { userId: string; displayName: string }[] = [];
    for (const [userId, t] of room.typingUsers.entries()) {
      if (now <= t.expiresAt) {
        result.push({ userId, displayName: t.displayName });
      } else {
        room.typingUsers.delete(userId);
      }
    }
    return result;
  }

  /**
   * Get the room ID for a given socket.
   */
  getRoomIdForSocket(socketId: string): string | null {
    return socketToRoom.get(socketId)?.roomId ?? null;
  }

  /**
   * Get the room state (for broadcast).
   */
  getRoom(roomId: string): RoomState | undefined {
    return rooms.get(roomId);
  }

  /**
   * Get a participant by ID.
   */
  getParticipant(roomId: string, participantId: string): RoomParticipant | undefined {
    return rooms.get(roomId)?.participants.get(participantId);
  }

  /**
   * Elect the next owner based on role priority.
   * Order: HOST → MODERATOR → earliest MEMBER (by joinedAt).
   */
  private electNewOwner(room: RoomState): RoomParticipant | null {
    const participants = Array.from(room.participants.values());
    if (participants.length === 0) return null;

    // Priority: HOST > MODERATOR > MEMBER (earliest joined)
    const host = participants.find((p) => p.role === "HOST");
    if (host) return host;

    const mod = participants.find((p) => p.role === "MODERATOR");
    if (mod) return mod;

    const members = participants
      .filter((p) => p.role === "MEMBER")
      .sort((a, b) => a.joinedAt - b.joinedAt);
    if (members.length > 0) return members[0];

    // Last resort: any participant
    return participants.sort((a, b) => a.joinedAt - b.joinedAt)[0];
  }
}

function toParticipantState(p: RoomParticipant): ParticipantState {
  return {
    id: p.id,
    displayName: p.displayName,
    avatarUrl: p.avatarUrl,
    role: p.role,
    isGuest: p.isGuest,
    isOnline: p.isOnline,
    audioEnabled: p.audioEnabled,
    videoEnabled: p.videoEnabled,
    screenSharing: p.screenSharing,
    isIdle: p.isIdle,
    joinedAt: p.joinedAt,
  };
}
