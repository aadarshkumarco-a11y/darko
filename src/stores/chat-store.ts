"use client";

import { create } from "zustand";

interface TypingUser {
  userId: string;
  displayName: string;
  expiresAt: number;
}

interface ChatStore {
  typingUsers: TypingUser[];
  draftMessage: string;
  replyTo: { messageId: string; senderName: string } | null;

  setTyping: (userId: string, displayName: string, isTyping: boolean) => void;
  cleanupTyping: () => void;
  setDraft: (msg: string) => void;
  setReplyTo: (target: { messageId: string; senderName: string } | null) => void;
  reset: () => void;
}

const TYPING_TIMEOUT_MS = 5000;

export const useChatStore = create<ChatStore>((set) => ({
  typingUsers: [],
  draftMessage: "",
  replyTo: null,

  setTyping: (userId, displayName, isTyping) =>
    set((s) => {
      if (!isTyping) {
        return {
          typingUsers: s.typingUsers.filter((u) => u.userId !== userId),
        };
      }
      // Add or refresh
      const filtered = s.typingUsers.filter((u) => u.userId !== userId);
      return {
        typingUsers: [
          ...filtered,
          { userId, displayName, expiresAt: Date.now() + TYPING_TIMEOUT_MS },
        ],
      };
    }),

  cleanupTyping: () =>
    set((s) => ({
      typingUsers: s.typingUsers.filter((u) => u.expiresAt > Date.now()),
    })),

  setDraft: (msg) => set({ draftMessage: msg }),

  setReplyTo: (target) => set({ replyTo: target }),

  reset: () => set({ typingUsers: [], draftMessage: "", replyTo: null }),
}));
