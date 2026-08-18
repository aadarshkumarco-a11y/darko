"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MeshMediaProvider } from "@/lib/webrtc/mesh-provider";
import type { RemoteStream, ConnectionQuality } from "@/types/media";
import type { DarkoSocket } from "@/hooks/use-socket";
import { useRoomStore } from "@/stores/room-store";

interface UseWebRTCOptions {
  socket: DarkoSocket | null;
  localStream: MediaStream | null;
  connected: boolean;
  selfId: string | null;
  participantIds: string[]; // All other participant IDs
}

interface UseWebRTCReturn {
  remoteStreams: Map<string, RemoteStream>;
  screenStream: MediaStream | null;
  connectionQualities: Map<string, ConnectionQuality>;
  isScreenSharing: boolean;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => void;
  error: string | null;
}

/**
 * Hook for managing WebRTC peer connections.
 *
 * - Creates a MeshMediaProvider on mount
 * - Connects to new participants automatically when they join
 * - Disconnects from participants when they leave
 * - Handles screen share via getDisplayMedia
 * - Monitors connection quality every 5s
 */
export function useWebRTC(options: UseWebRTCOptions): UseWebRTCReturn {
  const { socket, localStream, connected, selfId, participantIds } = options;

  const providerRef = useRef<MeshMediaProvider | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, RemoteStream>>(new Map());
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [connectionQualities, setConnectionQualities] = useState<Map<string, ConnectionQuality>>(new Map());
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providerReady, setProviderReady] = useState(false);

  // Initialize provider when socket + localStream are ready
  useEffect(() => {
    if (!socket || !localStream || !connected) return;
    if (providerRef.current) return;

    const provider = new MeshMediaProvider();
    provider.initialize(localStream, socket);
    if (selfId) provider.setSelfId(selfId);

    provider.onRemoteStream((stream) => {
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        next.set(stream.peerId, stream);
        return next;
      });
    });

    provider.onRemoteStreamRemoved((peerId) => {
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        next.delete(peerId);
        return next;
      });
    });

    provider.onConnectionQuality((peerId, quality) => {
      setConnectionQualities((prev) => {
        const next = new Map(prev);
        next.set(peerId, quality);
        return next;
      });
    });

    provider.onPeerDisconnected((peerId) => {
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        next.delete(peerId);
        return next;
      });
    });

    providerRef.current = provider;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProviderReady(true);

    return () => {
      provider.destroy();
      providerRef.current = null;
      setProviderReady(false);
      setRemoteStreams(new Map());
      setConnectionQualities(new Map());
    };
  }, [socket, localStream, connected, selfId]);

  // Update selfId when it changes
  useEffect(() => {
    if (providerRef.current && selfId) {
      providerRef.current.setSelfId(selfId);
    }
  }, [selfId]);

  // Connect to new participants, disconnect from gone ones
  // Use a ref to track which peers we've already initiated connection with
  const connectedPeersRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!providerReady || !providerRef.current || !selfId) return;

    const currentPeerIds = new Set(participantIds.filter((id) => id !== selfId));

    // Connect to new peers (not yet connected)
    for (const peerId of currentPeerIds) {
      if (!connectedPeersRef.current.has(peerId)) {
        connectedPeersRef.current.add(peerId);
        providerRef.current.connectToPeer(peerId).catch((err) => {
          console.error(`[useWebRTC] connectToPeer ${peerId} failed:`, err);
        });
      }
    }

    // Disconnect from gone peers
    for (const peerId of connectedPeersRef.current) {
      if (!currentPeerIds.has(peerId)) {
        connectedPeersRef.current.delete(peerId);
        providerRef.current.disconnectPeer(peerId);
      }
    }
  }, [participantIds, selfId, providerReady]);

  // Listen for screen share events from other participants
  useEffect(() => {
    if (!socket) return;

    const handleScreenShare = (payload: { userId: string; isSharing: boolean }) => {
      useRoomStore.getState().updateParticipant(payload.userId, {
        screenSharing: payload.isSharing,
      });
    };

    socket.on("screen:share", handleScreenShare);
    return () => {
      socket.off("screen:share", handleScreenShare);
    };
  }, [socket]);

  const startScreenShare = useCallback(async () => {
    if (!providerRef.current) return;
    try {
      const stream = await providerRef.current.startScreenShare();
      setScreenStream(stream);
      setIsScreenSharing(true);
      setError(null);
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setError("Screen share permission denied");
      } else {
        setError(err.message ?? "Failed to start screen share");
      }
    }
  }, []);

  const stopScreenShare = useCallback(() => {
    if (!providerRef.current) return;
    providerRef.current.stopScreenShare();
    setScreenStream(null);
    setIsScreenSharing(false);
  }, []);

  // Sync mute/camera state with the provider
  const audioEnabled = useRoomStore((s) => s.self?.audioEnabled ?? false);
  const videoEnabled = useRoomStore((s) => s.self?.videoEnabled ?? false);

  useEffect(() => {
    if (providerRef.current) {
      providerRef.current.toggleTrack("audio", audioEnabled);
    }
  }, [audioEnabled]);

  useEffect(() => {
    if (providerRef.current) {
      providerRef.current.toggleTrack("video", videoEnabled);
    }
  }, [videoEnabled]);

  return {
    remoteStreams,
    screenStream,
    connectionQualities,
    isScreenSharing,
    startScreenShare,
    stopScreenShare,
    error,
  };
}
