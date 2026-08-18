import { z } from "zod";

// ============ Chat validators ============

export const chatMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(2000, "Message must be 2000 characters or less")
    .refine((v) => !/<script|on\w+=|javascript:/i.test(v), "Disallowed content"),
  replyToId: z.string().min(1).optional(),
});

export const chatDeleteSchema = z.object({
  messageId: z.string().min(1),
});

export const chatReactionSchema = z.object({
  messageId: z.string().min(1),
  emoji: z
    .string()
    .min(1)
    .max(16, "Emoji too long")
    .refine((v) => !/[<>]/.test(v), "Invalid emoji"),
});

export const typingSchema = z.object({
  isTyping: z.boolean(),
});

// ============ Role validators ============

export const VALID_ROLES = ["OWNER", "HOST", "MODERATOR", "MEMBER", "GUEST"] as const;

export const roleUpdateSchema = z.object({
  targetUserId: z.string().min(1),
  newRole: z.enum(VALID_ROLES),
});

export const roleTransferSchema = z.object({
  targetUserId: z.string().min(1),
});

export const kickSchema = z.object({
  targetUserId: z.string().min(1),
  reason: z.string().max(200).optional(),
});

export const muteSchema = z.object({
  targetUserId: z.string().min(1),
  audio: z.boolean(),
  video: z.boolean(),
});

// ============ Settings validators ============

export const VALID_MEDIA_CONTROL = ["HOST_ONLY", "MODERATORS", "ANYONE"] as const;
export const VALID_INVITE_PERM = ["HOST_ONLY", "MODERATORS", "MEMBERS"] as const;
export const VALID_KICK_PERM = ["HOST_ONLY", "MODERATORS"] as const;

export const settingsUpdateSchema = z.object({
  changes: z
    .object({
      allowGuests: z.boolean().optional(),
      allowChat: z.boolean().optional(),
      allowVoice: z.boolean().optional(),
      allowVideo: z.boolean().optional(),
      allowScreenShare: z.boolean().optional(),
      allowFileShare: z.boolean().optional(),
      allowGames: z.boolean().optional(),
      allowWhiteboard: z.boolean().optional(),
      mediaControl: z.enum(VALID_MEDIA_CONTROL).optional(),
      invitePermission: z.enum(VALID_INVITE_PERM).optional(),
      kickPermission: z.enum(VALID_KICK_PERM).optional(),
      chatRateLimitPerMin: z.number().int().min(5).max(120).optional(),
    })
    .refine((v) => Object.keys(v).length > 0, "No changes provided"),
});

// ============ Room join validator ============

export const roomJoinSchema = z.object({
  roomToken: z.string().min(10, "Invalid room token"),
});

// ============ Presence validator ============

export const presenceUpdateSchema = z.object({
  audioEnabled: z.boolean().optional(),
  videoEnabled: z.boolean().optional(),
  screenSharing: z.boolean().optional(),
  isIdle: z.boolean().optional(),
});

// ============ Helpers ============

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { ok: true; data: T } | { ok: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, error: result.error.issues[0]?.message ?? "Validation failed" };
}
