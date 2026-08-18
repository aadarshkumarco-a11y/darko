import { z } from "zod";

export const guestSignupSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Display name must be at least 2 characters")
    .max(24, "Display name must be 24 characters or less")
    .refine((v) => !/[<>]/.test(v), "Display name cannot contain < or >"),
});
export type GuestSignupInput = z.infer<typeof guestSignupSchema>;

export const sendMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(2000, "Message must be 2000 characters or less")
    .refine((v) => !/<script|on\w+=/i.test(v), "Message contains disallowed content"),
  replyToId: z.string().optional(),
});
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const urlMetadataSchema = z.object({
  url: z
    .string()
    .url("Invalid URL")
    .refine((u) => u.startsWith("https://"), "Only HTTPS URLs are allowed"),
});
export type UrlMetadataInput = z.infer<typeof urlMetadataSchema>;

export const reportSchema = z.object({
  reportedUserId: z.string().optional(),
  reportedRoomId: z.string().optional(),
  reason: z
    .string()
    .trim()
    .min(3, "Reason must be at least 3 characters")
    .max(500, "Reason must be 500 characters or less"),
  details: z.string().trim().max(2000).optional().or(z.literal("")),
});
export type ReportInput = z.infer<typeof reportSchema>;
