"use client";

import { create } from "zustand";
import type {
  RoomStatePayload,
  ParticipantState,
  ChatMessageBroadcast,
  RoomSettingsState,
} from "@/types/events";

interface RoomStore {
  // State
  room: RoomStatePayload["room"] | null;
  participants: ParticipantState[];
  messages: ChatMessageBroadcast[];
  settings: RoomSettingsState | null;
  self: ParticipantState | null;
  connected: boolean;

  // Actions
  setInitialState: (state: RoomStatePayload) => void;
  setConnected: (connected: boolean) => void;
  addParticipant: (participant: ParticipantState) => void;
  removeParticipant: (participantId: string) => void;
  updateParticipant: (participantId: string, changes: Partial<ParticipantState>) => void;
  updateRole: (targetUserId: string, newRole: string) => void;
  addMessage: (message: ChatMessageBroadcast) => void;
  deleteMessage: (messageId: string) => void;
  addReaction: (messageId: string, userId: string, emoji: string, action: "add" | "remove") => void;
  updateSettings: (changes: Partial<RoomSettingsState>) => void;
  reset: () => void;
}

export const useRoomStore = create<RoomStore>((set) => ({
  room: null,
  participants: [],
  messages: [],
  settings: null,
  self: null,
  connected: false,

  setInitialState: (state) =>
    set({
      room: state.room,
      participants: state.participants,
      messages: state.lastMessages,
      settings: state.room.settings,
      self: state.self,
      connected: true,
    }),

  setConnected: (connected) => set({ connected }),

  addParticipant: (participant) =>
    set((s) => {
      // Replace if already exists (reconnect case)
      const filtered = s.participants.filter((p) => p.id !== participant.id);
      return { participants: [...filtered, participant] };
    }),

  removeParticipant: (participantId) =>
    set((s) => ({
      participants: s.participants.filter((p) => p.id !== participantId),
    })),

  updateParticipant: (participantId, changes) =>
    set((s) => ({
      participants: s.participants.map((p) =>
        p.id === participantId ? { ...p, ...changes } : p
      ),
      self: s.self?.id === participantId ? { ...s.self, ...changes } : s.self,
    })),

  updateRole: (targetUserId, newRole) =>
    set((s) => ({
      participants: s.participants.map((p) =>
        p.id === targetUserId ? { ...p, role: newRole } : p
      ),
      self: s.self?.id === targetUserId ? { ...s.self, role: newRole } : s.self,
    })),

  addMessage: (message) =>
    set((s) => ({
      messages: [...s.messages.slice(-199), message], // cap at 200
    })),

  deleteMessage: (messageId) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === messageId ? { ...m, isDeleted: true, content: "" } : m
      ),
    })),

  addReaction: (messageId, userId, emoji, action) =>
    set((s) => {
      // For now, reactions are tracked in the message metadata
      // We'll expand this to a proper reaction map in Phase 6
      return s; // No-op for now — reactions just trigger a visual re-render
    }),

  updateSettings: (changes) =>
    set((s) => ({
      settings: s.settings ? { ...s.settings, ...changes } : s.settings,
      room: s.room ? { ...s.room, settings: s.room.settings } : s.room,
    })),

  reset: () =>
    set({
      room: null,
      participants: [],
      messages: [],
      settings: null,
      self: null,
      connected: false,
    }),
}));
