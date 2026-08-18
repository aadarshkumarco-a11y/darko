import { db } from "@/lib/db";
import type { Room, RoomSettings, RoomMember, User } from "@prisma/client";
import type { RoomDTO, RoomSettingsDTO, RoomMemberDTO } from "@/types/api";
import type { MediaControl, InvitePermission, KickPermission, RoomMode, RoomRole } from "@/lib/validators/room";

export function toRoomSettingsDTO(s: RoomSettings): RoomSettingsDTO {
  return {
    allowGuests: s.allowGuests,
    allowChat: s.allowChat,
    allowVoice: s.allowVoice,
    allowVideo: s.allowVideo,
    allowScreenShare: s.allowScreenShare,
    allowFileShare: s.allowFileShare,
    allowGames: s.allowGames,
    allowWhiteboard: s.allowWhiteboard,
    mediaControl: s.mediaControl as MediaControl,
    invitePermission: s.invitePermission as InvitePermission,
    kickPermission: s.kickPermission as KickPermission,
    chatRateLimitPerMin: s.chatRateLimitPerMin,
  };
}

export async function toRoomDTO(room: Room, includeSettings = true): Promise<RoomDTO> {
  const [memberCount, onlineCount, settings] = await Promise.all([
    db.roomMember.count({ where: { roomId: room.id } }),
    db.roomMember.count({ where: { roomId: room.id, isOnline: true } }),
    includeSettings
      ? db.roomSettings.findUnique({ where: { roomId: room.id } })
      : Promise.resolve(null),
  ]);

  return {
    id: room.id,
    slug: room.slug,
    title: room.title,
    description: room.description,
    ownerId: room.ownerId,
    isPublic: room.isPublic,
    hasPassword: !!room.passwordHash,
    maxParticipants: room.maxParticipants,
    theme: room.theme,
    currentMode: room.currentMode as RoomMode,
    createdAt: room.createdAt.toISOString(),
    memberCount,
    onlineCount,
    settings: settings ? toRoomSettingsDTO(settings) : null,
  };
}

export function toRoomMemberDTO(m: RoomMember & { user: User | null }): RoomMemberDTO {
  // For guests, user is null — we use the displayName stored on the member row
  // (For now, guests don't have RoomMember rows; only authenticated users do.
  // This function is used for the authenticated member list.)
  return {
    id: m.id,
    userId: m.userId,
    displayName: m.user?.name ?? "Unknown",
    avatarUrl: m.user?.image ?? null,
    role: m.role as RoomRole,
    isOnline: m.isOnline,
    joinedAt: m.joinedAt.toISOString(),
  };
}
