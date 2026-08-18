import type { RoomSettings } from "@prisma/client";
import type { RoomSettingsState } from "./events.js";

export function toRoomSettingsState(s: RoomSettings): RoomSettingsState {
  return {
    allowGuests: s.allowGuests,
    allowChat: s.allowChat,
    allowVoice: s.allowVoice,
    allowVideo: s.allowVideo,
    allowScreenShare: s.allowScreenShare,
    allowFileShare: s.allowFileShare,
    allowGames: s.allowGames,
    allowWhiteboard: s.allowWhiteboard,
    mediaControl: s.mediaControl,
    invitePermission: s.invitePermission,
    kickPermission: s.kickPermission,
    chatRateLimitPerMin: s.chatRateLimitPerMin,
  };
}
