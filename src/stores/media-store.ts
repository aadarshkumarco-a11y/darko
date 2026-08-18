"use client";

import { create } from "zustand";

interface MediaStore {
  audioEnabled: boolean;
  videoEnabled: boolean;
  isScreenSharing: boolean;
  hasMediaPermission: boolean;
  mediaError: string | null;

  setAudioEnabled: (enabled: boolean) => void;
  setVideoEnabled: (enabled: boolean) => void;
  setScreenSharing: (sharing: boolean) => void;
  setMediaPermission: (granted: boolean) => void;
  setMediaError: (error: string | null) => void;
  reset: () => void;
}

export const useMediaStore = create<MediaStore>((set) => ({
  audioEnabled: false,
  videoEnabled: false,
  isScreenSharing: false,
  hasMediaPermission: false,
  mediaError: null,

  setAudioEnabled: (enabled) => set({ audioEnabled: enabled }),
  setVideoEnabled: (enabled) => set({ videoEnabled: enabled }),
  setScreenSharing: (sharing) => set({ isScreenSharing: sharing }),
  setMediaPermission: (granted) => set({ hasMediaPermission: granted }),
  setMediaError: (error) => set({ mediaError: error }),
  reset: () =>
    set({
      audioEnabled: false,
      videoEnabled: false,
      isScreenSharing: false,
      hasMediaPermission: false,
      mediaError: null,
    }),
}));
