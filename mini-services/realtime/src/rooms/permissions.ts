import type { RoomSettingsState, ParticipantState } from "../events.js";

/**
 * Permission checking utilities.
 *
 * Rules are server-authoritative. Client role is NEVER trusted.
 */

export type Permission =
  | "media:control" // Can play/pause/seek
  | "media:source" // Can change video source
  | "playlist:manage" // Can add/remove/reorder playlist
  | "chat:send" // Can send chat messages
  | "chat:delete:any" // Can delete anyone's message
  | "voice:join" // Can join voice
  | "video:join" // Can join video
  | "screen:share" // Can share screen
  | "file:share" // Can share files
  | "games:play" // Can play games
  | "whiteboard:draw" // Can draw on whiteboard
  | "room:invite" // Can invite others
  | "room:kick" // Can kick others
  | "room:mute" // Can mute others
  | "room:settings" // Can change room settings
  | "room:transfer" // Can transfer ownership
  | "room:promote" // Can promote/demote roles
  | "room:delete"; // Can delete the room

const ROLE_HIERARCHY: Record<string, number> = {
  OWNER: 100,
  HOST: 80,
  MODERATOR: 60,
  MEMBER: 40,
  GUEST: 20,
};

export function roleRank(role: string): number {
  return ROLE_HIERARCHY[role] ?? 0;
}

export function canManageRole(actorRole: string, targetRole: string, newRole: string): boolean {
  // Can't touch someone of equal or higher rank
  if (roleRank(actorRole) <= roleRank(targetRole)) return false;
  // Can't promote to or above own rank
  if (roleRank(newRole) >= roleRank(actorRole)) return false;
  // Only owner can promote to HOST or above
  if (newRole === "OWNER") return false; // Ownership transfers are separate
  if (newRole === "HOST" && actorRole !== "OWNER") return false;
  return true;
}

/**
 * Check if a participant has a specific permission.
 * Combines role + room settings.
 */
export function hasPermission(
  participant: ParticipantState,
  permission: Permission,
  settings: RoomSettingsState
): boolean {
  // Owner and Host have all permissions
  if (participant.role === "OWNER" || participant.role === "HOST") {
    return true;
  }

  switch (permission) {
    // Chat
    case "chat:send":
      return settings.allowChat;
    case "chat:delete:any":
      return participant.role === "MODERATOR";

    // Media
    case "media:control":
      if (settings.mediaControl === "ANYONE") return true;
      if (settings.mediaControl === "MODERATORS") return participant.role === "MODERATOR";
      return false; // HOST_ONLY
    case "media:source":
    case "playlist:manage":
      return participant.role === "MODERATOR" || settings.mediaControl === "ANYONE";

    // Voice/video/screen
    case "voice:join":
      return settings.allowVoice;
    case "video:join":
      return settings.allowVideo;
    case "screen:share":
      return settings.allowScreenShare;
    case "file:share":
      return settings.allowFileShare;
    case "games:play":
      return settings.allowGames;
    case "whiteboard:draw":
      return settings.allowWhiteboard;

    // Room management
    case "room:invite":
      if (settings.invitePermission === "MEMBERS") return true;
      if (settings.invitePermission === "MODERATORS") return participant.role === "MODERATOR";
      return false; // HOST_ONLY
    case "room:kick":
    case "room:mute":
      if (settings.kickPermission === "MODERATORS") return participant.role === "MODERATOR";
      return false; // HOST_ONLY
    case "room:settings":
      return false; // Owner/Host only (already returned true above)
    case "room:transfer":
    case "room:delete":
    case "room:promote":
      return false; // Owner only

    default:
      return false;
  }
}

/**
 * Check if actor can kick target.
 */
export function canKick(actor: ParticipantState, target: ParticipantState, settings: RoomSettingsState): boolean {
  // Can't kick someone of equal or higher rank
  if (roleRank(actor.role) <= roleRank(target.role)) return false;
  return hasPermission(actor, "room:kick", settings);
}

/**
 * Check if actor can mute target.
 */
export function canMute(actor: ParticipantState, target: ParticipantState, settings: RoomSettingsState): boolean {
  if (roleRank(actor.role) <= roleRank(target.role)) return false;
  return hasPermission(actor, "room:mute", settings);
}
