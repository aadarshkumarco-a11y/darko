/**
 * DARKO Realtime Event Protocol — shared types.
 * Mirrored in the frontend at src/types/events.ts.
 *
 * Every event follows the same envelope shape.
 * All payloads are validated with Zod on the server side.
 */

export const PROTOCOL_VERSION = 1 as const;

// ============ Envelope ============

export interface EventEnvelope<T = unknown> {
  id: string;
  room: string;
  sender: string;
  ts: number;
  v: typeof PROTOCOL_VERSION;
  type: EventType;
  payload: T;
}

// ============ Event types (typed union) ============

export type EventType =
  // Room lifecycle
  | "ROOM_JOIN"
  | "ROOM_LEAVE"
  | "ROOM_STATE_SNAPSHOT"
  // Presence
  | "PRESENCE_UPDATE"
  | "PRESENCE_HEARTBEAT"
  // Roles
  | "ROLE_UPDATE"
  // Settings
  | "ROOM_SETTINGS_UPDATE"
  // Chat
  | "CHAT_MESSAGE"
  | "CHAT_DELETE"
  | "CHAT_REACTION"
  | "TYPING_START"
  | "TYPING_STOP"
  // Media (Phase 4)
  | "MEDIA_PLAY"
  | "MEDIA_PAUSE"
  | "MEDIA_SEEK"
  | "MEDIA_RATE_CHANGE"
  | "MEDIA_SOURCE_CHANGE"
  | "MEDIA_SYNC_REQUEST"
  | "MEDIA_SYNC_RESPONSE"
  | "PLAYLIST_ADD"
  | "PLAYLIST_REMOVE"
  | "PLAYLIST_REORDER"
  | "PLAYLIST_NEXT"
  | "PLAYLIST_PREVIOUS"
  // WebRTC signaling (Phase 3)
  | "WEBRTC_OFFER"
  | "WEBRTC_ANSWER"
  | "WEBRTC_ICE"
  | "WEBRTC_PEER_LEAVE"
  // Screen share (Phase 3)
  | "SCREEN_SHARE_START"
  | "SCREEN_SHARE_STOP"
  // Games (Phase 5)
  | "GAME_START"
  | "GAME_ACTION"
  | "GAME_STATE"
  | "GAME_END"
  // Whiteboard (Phase 6)
  | "WHITEBOARD_OPERATION"
  | "WHITEBOARD_UNDO"
  | "WHITEBOARD_CLEAR"
  // File transfer (Phase 6)
  | "FILE_OFFER"
  | "FILE_ACCEPT"
  | "FILE_REJECT"
  | "FILE_PROGRESS"
  | "FILE_COMPLETE"
  | "FILE_CANCEL";

// ============ Client → Server events ============

export interface ClientToServerEvents {
  // Room lifecycle
  "room:join": (payload: RoomJoinPayload, ack: (res: AckResponse) => void) => void;
  "room:leave": (ack: (res: AckResponse) => void) => void;
  "room:heartbeat": (ack: (res: AckResponse) => void) => void;

  // Chat
  "chat:message": (payload: ChatMessagePayload, ack: (res: AckResponse<{ messageId: string }>) => void) => void;
  "chat:delete": (payload: ChatDeletePayload, ack: (res: AckResponse) => void) => void;
  "chat:reaction": (payload: ChatReactionPayload, ack: (res: AckResponse) => void) => void;
  "chat:typing": (payload: TypingPayload, ack: (res: AckResponse) => void) => void;

  // Roles
  "role:update": (payload: RoleUpdatePayload, ack: (res: AckResponse) => void) => void;
  "role:transfer": (payload: RoleTransferPayload, ack: (res: AckResponse) => void) => void;
  "role:kick": (payload: KickPayload, ack: (res: AckResponse) => void) => void;
  "role:mute": (payload: MutePayload, ack: (res: AckResponse) => void) => void;

  // Settings
  "settings:update": (payload: SettingsUpdatePayload, ack: (res: AckResponse) => void) => void;

  // Media (Phase 4 — stubs for now)
  "media:play": (payload: unknown, ack: (res: AckResponse) => void) => void;
  "media:pause": (payload: unknown, ack: (res: AckResponse) => void) => void;
  "media:seek": (payload: unknown, ack: (res: AckResponse) => void) => void;
  "media:source": (payload: unknown, ack: (res: AckResponse) => void) => void;
  "media:sync_request": (payload: unknown, ack: (res: AckResponse) => void) => void;

  // WebRTC signaling (Phase 3)
  "webrtc:offer": (payload: WebRTCOfferPayload, ack: (res: AckResponse) => void) => void;
  "webrtc:answer": (payload: WebRTCAnswerPayload, ack: (res: AckResponse) => void) => void;
  "webrtc:ice": (payload: WebRTCIcePayload, ack: (res: AckResponse) => void) => void;
  "screen:share": (payload: ScreenSharePayload, ack: (res: AckResponse) => void) => void;
}

// ============ Server → Client events ============

export interface ServerToClientEvents {
  // Room state
  "room:state": (payload: RoomStatePayload) => void;
  "room:error": (payload: { message: string; code?: string }) => void;

  // Presence
  "presence:update": (payload: PresenceUpdatePayload) => void;
  "presence:user_joined": (payload: PresenceUserJoinedPayload) => void;
  "presence:user_left": (payload: PresenceUserLeftPayload) => void;

  // Chat
  "chat:message": (payload: ChatMessageBroadcast) => void;
  "chat:delete": (payload: ChatDeleteBroadcast) => void;
  "chat:reaction": (payload: ChatReactionBroadcast) => void;
  "chat:typing": (payload: TypingBroadcast) => void;

  // Roles
  "role:update": (payload: RoleUpdateBroadcast) => void;

  // Settings
  "settings:update": (payload: SettingsUpdateBroadcast) => void;

  // WebRTC signaling (Phase 3)
  "webrtc:offer": (payload: WebRTCOfferBroadcast) => void;
  "webrtc:answer": (payload: WebRTCAnswerBroadcast) => void;
  "webrtc:ice": (payload: WebRTCIceBroadcast) => void;
  "screen:share": (payload: ScreenShareBroadcast) => void;

  // System
  "system:reconnect": (payload: { reason: string }) => void;
}

// ============ Payload types ============

export interface RoomJoinPayload {
  roomToken: string;
}

export interface AckResponse<T = unknown> {
  ok: boolean;
  error?: string;
  code?: string;
  data?: T;
}

export interface RoomStatePayload {
  room: {
    id: string;
    slug: string;
    title: string;
    theme: string;
    currentMode: string;
    settings: RoomSettingsState;
  };
  participants: ParticipantState[];
  lastMessages: ChatMessageBroadcast[];
  self: ParticipantState;
}

export interface RoomSettingsState {
  allowGuests: boolean;
  allowChat: boolean;
  allowVoice: boolean;
  allowVideo: boolean;
  allowScreenShare: boolean;
  allowFileShare: boolean;
  allowGames: boolean;
  allowWhiteboard: boolean;
  mediaControl: string;
  invitePermission: string;
  kickPermission: string;
  chatRateLimitPerMin: number;
}

export interface ParticipantState {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
  isGuest: boolean;
  isOnline: boolean;
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenSharing: boolean;
  isIdle: boolean;
  joinedAt: number;
}

export interface PresenceUpdatePayload {
  participantId: string;
  changes: Partial<Pick<ParticipantState, "audioEnabled" | "videoEnabled" | "screenSharing" | "isIdle">>;
}

export interface PresenceUserJoinedPayload {
  participant: ParticipantState;
}

export interface PresenceUserLeftPayload {
  participantId: string;
  reason: "left" | "disconnected" | "kicked" | "timeout";
}

export interface ChatMessagePayload {
  content: string;
  replyToId?: string;
}

export interface ChatMessageBroadcast {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  senderRole: string;
  content: string;
  replyToId: string | null;
  replyToSenderName?: string | null;
  createdAt: number;
  isDeleted: boolean;
}

export interface ChatDeletePayload {
  messageId: string;
}

export interface ChatDeleteBroadcast {
  messageId: string;
  deletedBy: string;
}

export interface ChatReactionPayload {
  messageId: string;
  emoji: string;
}

export interface ChatReactionBroadcast {
  messageId: string;
  userId: string;
  emoji: string;
  action: "add" | "remove";
}

export interface TypingPayload {
  isTyping: boolean;
}

export interface TypingBroadcast {
  userId: string;
  displayName: string;
  isTyping: boolean;
}

export interface RoleUpdatePayload {
  targetUserId: string;
  newRole: string;
}

export interface RoleUpdateBroadcast {
  targetUserId: string;
  oldRole: string;
  newRole: string;
  changedBy: string;
}

export interface RoleTransferPayload {
  targetUserId: string;
}

export interface KickPayload {
  targetUserId: string;
  reason?: string;
}

export interface MutePayload {
  targetUserId: string;
  audio: boolean;
  video: boolean;
}

export interface SettingsUpdatePayload {
  changes: Partial<RoomSettingsState>;
}

export interface SettingsUpdateBroadcast {
  changes: Partial<RoomSettingsState>;
  changedBy: string;
}

// ============ WebRTC payload types (Phase 3) ============

export interface WebRTCOfferPayload {
  targetUserId: string;
  sdp: string;
}

export interface WebRTCAnswerPayload {
  targetUserId: string;
  sdp: string;
}

export interface WebRTCIcePayload {
  targetUserId: string;
  candidate: string;
}

export interface WebRTCOfferBroadcast {
  fromUserId: string;
  sdp: string;
}

export interface WebRTCAnswerBroadcast {
  fromUserId: string;
  sdp: string;
}

export interface WebRTCIceBroadcast {
  fromUserId: string;
  candidate: string;
}

export interface ScreenSharePayload {
  isSharing: boolean;
}

export interface ScreenShareBroadcast {
  userId: string;
  isSharing: boolean;
}
