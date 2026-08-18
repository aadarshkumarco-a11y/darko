import type { RoomMode, RoomRole, MediaControl, InvitePermission, KickPermission } from "@/lib/validators/room";

export interface SafeUser {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  isGuest: boolean;
  displayName: string;
}

export interface RoomSettingsDTO {
  allowGuests: boolean;
  allowChat: boolean;
  allowVoice: boolean;
  allowVideo: boolean;
  allowScreenShare: boolean;
  allowFileShare: boolean;
  allowGames: boolean;
  allowWhiteboard: boolean;
  mediaControl: MediaControl;
  invitePermission: InvitePermission;
  kickPermission: KickPermission;
  chatRateLimitPerMin: number;
}

export interface RoomDTO {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  ownerId: string;
  isPublic: boolean;
  hasPassword: boolean;
  maxParticipants: number;
  theme: string;
  currentMode: RoomMode;
  createdAt: string;
  memberCount: number;
  onlineCount: number;
  settings: RoomSettingsDTO | null;
}

export interface RoomMemberDTO {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  role: RoomRole;
  isOnline: boolean;
  joinedAt: string;
}

export interface JoinRoomResponse {
  room: RoomDTO;
  roomToken: string;
  members: RoomMemberDTO[];
}

export interface ApiError {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface ApiSuccess<T> {
  data: T;
}
