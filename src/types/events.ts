/**
 * DARKO Realtime Event Protocol — frontend mirror.
 * Mirrors mini-services/realtime/src/events.ts.
 *
 * Keep these in sync with the server.
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

// ============ Event types ============

export type EventType =
  | "ROOM_JOIN"
  | "ROOM_LEAVE"
  | "ROOM_STATE_SNAPSHOT"
  | "PRESENCE_UPDATE"
  | "PRESENCE_HEARTBEAT"
  | "ROLE_UPDATE"
  | "ROOM_SETTINGS_UPDATE"
  | "CHAT_MESSAGE"
  | "CHAT_DELETE"
  | "CHAT_REACTION"
  | "TYPING_START"
  | "TYPING_STOP"
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
  | "WEBRTC_OFFER"
  | "WEBRTC_ANSWER"
  | "WEBRTC_ICE"
  | "WEBRTC_PEER_LEAVE"
  | "SCREEN_SHARE_START"
  | "SCREEN_SHARE_STOP"
  | "GAME_START"
  | "GAME_ACTION"
  | "GAME_STATE"
  | "GAME_END"
  | "WHITEBOARD_OPERATION"
  | "WHITEBOARD_UNDO"
  | "WHITEBOARD_CLEAR"
  | "FILE_OFFER"
  | "FILE_ACCEPT"
  | "FILE_REJECT"
  | "FILE_PROGRESS"
  | "FILE_COMPLETE"
  | "FILE_CANCEL";

// ============ Client → Server events ============

export interface ClientToServerEvents {
  "room:join": (payload: RoomJoinPayload, ack: (res: AckResponse<RoomStatePayload>) => void) => void;
  "room:leave": (ack: (res: AckResponse) => void) => void;
  "room:heartbeat": (ack: (res: AckResponse) => void) => void;
  "chat:message": (payload: ChatMessagePayload, ack: (res: AckResponse<{ messageId: string }>) => void) => void;
  "chat:delete": (payload: ChatDeletePayload, ack: (res: AckResponse) => void) => void;
  "chat:reaction": (payload: ChatReactionPayload, ack: (res: AckResponse) => void) => void;
  "chat:typing": (payload: TypingPayload, ack: (res: AckResponse) => void) => void;
  "role:update": (payload: RoleUpdatePayload, ack: (res: AckResponse) => void) => void;
  "role:transfer": (payload: RoleTransferPayload, ack: (res: AckResponse) => void) => void;
  "role:kick": (payload: KickPayload, ack: (res: AckResponse) => void) => void;
  "role:mute": (payload: MutePayload, ack: (res: AckResponse) => void) => void;
  "settings:update": (payload: SettingsUpdatePayload, ack: (res: AckResponse) => void) => void;
  "media:play": (payload: unknown, ack: (res: AckResponse) => void) => void;
  "media:pause": (payload: unknown, ack: (res: AckResponse) => void) => void;
  "media:seek": (payload: unknown, ack: (res: AckResponse) => void) => void;
  "media:source": (payload: unknown, ack: (res: AckResponse) => void) => void;
  "media:sync_request": (payload: unknown, ack: (res: AckResponse) => void) => void;
  // WebRTC (Phase 3)
  "webrtc:offer": (payload: WebRTCOfferPayload, ack: (res: AckResponse) => void) => void;
  "webrtc:answer": (payload: WebRTCAnswerPayload, ack: (res: AckResponse) => void) => void;
  "webrtc:ice": (payload: WebRTCIcePayload, ack: (res: AckResponse) => void) => void;
  "screen:share": (payload: ScreenSharePayload, ack: (res: AckResponse) => void) => void;
}

// ============ Server → Client events ============

export interface ServerToClientEvents {
  "room:state": (payload: RoomStatePayload) => void;
  "room:error": (payload: { message: string; code?: string }) => void;
  "presence:update": (payload: PresenceUpdatePayload) => void;
  "presence:user_joined": (payload: PresenceUserJoinedPayload) => void;
  "presence:user_left": (payload: PresenceUserLeftPayload) => void;
  "chat:message": (payload: ChatMessageBroadcast) => void;
  "chat:delete": (payload: ChatDeleteBroadcast) => void;
  "chat:reaction": (payload: ChatReactionBroadcast) => void;
  "chat:typing": (payload: TypingBroadcast) => void;
  "role:update": (payload: RoleUpdateBroadcast) => void;
  "settings:update": (payload: SettingsUpdateBroadcast) => void;
  // WebRTC (Phase 3)
  "webrtc:offer": (payload: WebRTCOfferBroadcast) => void;
  "webrtc:answer": (payload: WebRTCAnswerBroadcast) => void;
  "webrtc:ice": (payload: WebRTCIceBroadcast) => void;
  "screen:share": (payload: ScreenShareBroadcast) => void;
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
