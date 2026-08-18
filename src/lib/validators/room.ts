import { z } from "zod";

export const ROOM_MODES = [
  "WATCH",
  "SCREEN_SHARE",
  "BROWSE",
  "GAMES",
  "FILES",
  "WHITEBOARD",
  "CHAT_LOUNGE",
] as const;
export type RoomMode = (typeof ROOM_MODES)[number];

export const ROOM_ROLES = ["OWNER", "HOST", "MODERATOR", "MEMBER", "GUEST"] as const;
export type RoomRole = (typeof ROOM_ROLES)[number];

export const MEDIA_CONTROL = ["HOST_ONLY", "MODERATORS", "ANYONE"] as const;
export type MediaControl = (typeof MEDIA_CONTROL)[number];

export const INVITE_PERMISSION = ["HOST_ONLY", "MODERATORS", "MEMBERS"] as const;
export type InvitePermission = (typeof INVITE_PERMISSION)[number];

export const KICK_PERMISSION = ["HOST_ONLY", "MODERATORS"] as const;
export type KickPermission = (typeof KICK_PERMISSION)[number];

export const createRoomSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Title must be at least 2 characters")
    .max(80, "Title must be 80 characters or less"),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  theme: z.string().min(1).max(40).default("midnight-lounge"),
  isPublic: z.boolean().default(false),
  password: z
    .string()
    .min(4, "Password must be at least 4 characters")
    .max(100)
    .optional()
    .or(z.literal("")),
  maxParticipants: z.number().int().min(2).max(8).default(8),
});
export type CreateRoomInput = z.infer<typeof createRoomSchema>;

export const joinRoomSchema = z.object({
  password: z.string().max(100).optional().or(z.literal("")),
  displayName: z
    .string()
    .trim()
    .min(2, "Display name must be at least 2 characters")
    .max(24, "Display name must be 24 characters or less"),
});
export type JoinRoomInput = z.infer<typeof joinRoomSchema>;

export const updateRoomSchema = z.object({
  title: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  theme: z.string().min(1).max(40).optional(),
  isPublic: z.boolean().optional(),
  maxParticipants: z.number().int().min(2).max(8).optional(),
});
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;

export const updateRoomSettingsSchema = z.object({
  allowGuests: z.boolean().optional(),
  allowChat: z.boolean().optional(),
  allowVoice: z.boolean().optional(),
  allowVideo: z.boolean().optional(),
  allowScreenShare: z.boolean().optional(),
  allowFileShare: z.boolean().optional(),
  allowGames: z.boolean().optional(),
  allowWhiteboard: z.boolean().optional(),
  mediaControl: z.enum(MEDIA_CONTROL).optional(),
  invitePermission: z.enum(INVITE_PERMISSION).optional(),
  kickPermission: z.enum(KICK_PERMISSION).optional(),
  chatRateLimitPerMin: z.number().int().min(5).max(120).optional(),
});
export type UpdateRoomSettingsInput = z.infer<typeof updateRoomSettingsSchema>;

export const transferOwnershipSchema = z.object({
  newOwnerId: z.string().min(1),
});
export type TransferOwnershipInput = z.infer<typeof transferOwnershipSchema>;
