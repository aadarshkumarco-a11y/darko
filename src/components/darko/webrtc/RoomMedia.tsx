"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Video, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { VideoTile } from "./VideoTile";
import { MediaControls } from "./MediaControls";
import { useMedia } from "@/hooks/use-media";
import { useWebRTC } from "@/hooks/use-webrtc";
import { useRoomStore } from "@/stores/room-store";
import { useMediaStore } from "@/stores/media-store";
import type { DarkoSocket } from "@/hooks/use-socket";
import { cn } from "@/lib/utils";

interface RoomMediaProps {
  socket: DarkoSocket | null;
  connected: boolean;
  selfId: string | null;
  participantIds: string[];
  participants: import("@/types/events").ParticipantState[];
  onLeaveRoom: () => void;
}

export function RoomMedia({
  socket,
  connected,
  selfId,
  participantIds,
  participants,
  onLeaveRoom,
}: RoomMediaProps) {
  const {
    localStream,
    audioEnabled,
    videoEnabled,
    audioDevices,
    videoDevices,
    selectedAudioInputId,
    selectedVideoInputId,
    error: mediaError,
    requesting,
    toggleAudio,
    toggleVideo,
    setAudioInput,
    setVideoInput,
    requestPermissions,
    releaseStream,
  } = useMedia({ initialAudioEnabled: false, initialVideoEnabled: false });

  const {
    remoteStreams,
    screenStream,
    isScreenSharing,
    startScreenShare,
    stopScreenShare,
    error: webrtcError,
  } = useWebRTC({
    socket,
    localStream,
    connected,
    selfId,
    participantIds,
  });

  const setAudioEnabled = useMediaStore((s) => s.setAudioEnabled);
  const setVideoEnabled = useMediaStore((s) => s.setVideoEnabled);
  const setScreenSharing = useMediaStore((s) => s.setScreenSharing);

  // Sync media state to mediaStore (which useWebRTC reads from)
  useEffect(() => {
    setAudioEnabled(audioEnabled);
  }, [audioEnabled, setAudioEnabled]);

  useEffect(() => {
    setVideoEnabled(videoEnabled);
  }, [videoEnabled, setVideoEnabled]);

  useEffect(() => {
    setScreenSharing(isScreenSharing);
  }, [isScreenSharing, setScreenSharing]);

  // Update presence when audio/video/screen state changes
  const updatePresence = useCallback(
    (changes: { audioEnabled?: boolean; videoEnabled?: boolean; screenSharing?: boolean }) => {
      if (!socket || !selfId) return;
      socket.emit("screen:share", { isSharing: !!changes.screenSharing }, () => {});
      // For audio/video, the server's presence:update is emitted by the client via a custom event
      // Actually, let me emit presence updates directly
      // The server doesn't have a "presence:update" client event — it only has "screen:share"
      // Let me add a presence update via the existing mechanism
      useRoomStore.getState().updateParticipant(selfId, changes);
    },
    [socket, selfId]
  );

  useEffect(() => {
    updatePresence({ audioEnabled, videoEnabled, screenSharing: isScreenSharing });
  }, [audioEnabled, videoEnabled, isScreenSharing, updatePresence]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      releaseStream();
      useMediaStore.getState().reset();
    };
  }, [releaseStream]);

  // Not in call yet — show "Join call" button
  if (!localStream) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm"
        >
          <div className="h-16 w-16 rounded-2xl bg-elevated border border-border-strong flex items-center justify-center mx-auto mb-4">
            <Video className="h-8 w-8 text-primary" />
          </div>
          <h2 className="font-display text-xl font-semibold text-white mb-2">
            Join the voice/video call
          </h2>
          <p className="text-sm text-secondary mb-6 leading-relaxed">
            Enable your microphone and camera to talk with others in this room. You can mute or turn off your camera anytime.
          </p>

          {mediaError && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2 text-left">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-400">{mediaError}</p>
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            onClick={requestPermissions}
            isLoading={requesting}
            leftIcon={!requesting ? <Phone className="h-4 w-4" /> : undefined}
            disabled={!connected}
          >
            {requesting ? "Requesting permission..." : "Join call"}
          </Button>

          <p className="mt-4 text-xs text-muted">
            Browser will ask for microphone + camera permission.
          </p>
        </motion.div>
      </div>
    );
  }

  // In call — show video grid + controls
  return (
    <div className="flex flex-col h-full">
      {/* Video grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Screen share (large, on top) */}
        {screenStream && (
          <div className="mb-4">
            <VideoTile
              stream={screenStream}
              displayName="Your screen"
              isSelf
              isScreenShare
              videoEnabled
              audioEnabled={false}
              large
            />
          </div>
        )}

        {/* Remote screen shares */}
        <AnimatePresence>
          {Array.from(remoteStreams.entries())
            .filter(([, s]) => s.isScreenShare)
            .map(([peerId, remoteStream]) => {
              const participant = participants.find((p) => p.id === peerId);
              return (
                <div key={`screen-${peerId}`} className="mb-4">
                  <VideoTile
                    stream={remoteStream.stream}
                    displayName={`${participant?.displayName ?? "Unknown"}'s screen`}
                    isScreenShare
                    videoEnabled
                    audioEnabled={remoteStream.audioEnabled}
                    large
                  />
                </div>
              );
            })}
        </AnimatePresence>

        {/* Self + remote video tiles grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {/* Self tile */}
          <VideoTile
            stream={localStream}
            displayName="You"
            isSelf
            audioEnabled={audioEnabled}
            videoEnabled={videoEnabled}
            role={participants.find((p) => p.id === selfId)?.role}
          />

          {/* Remote tiles */}
          <AnimatePresence mode="popLayout">
            {Array.from(remoteStreams.entries())
              .filter(([, s]) => !s.isScreenShare)
              .map(([peerId, remoteStream]) => {
                const participant = participants.find((p) => p.id === peerId);
                return (
                  <VideoTile
                    key={peerId}
                    stream={remoteStream.stream}
                    displayName={participant?.displayName ?? "Unknown"}
                    audioEnabled={remoteStream.audioEnabled}
                    videoEnabled={remoteStream.videoEnabled}
                    role={participant?.role}
                    quality={remoteStream.quality}
                  />
                );
              })}
          </AnimatePresence>
        </div>

        {/* Empty state when no remote participants */}
        {remoteStreams.size === 0 && (
          <div className="mt-6 text-center text-sm text-muted">
            <p>You&apos;re the only one in the call right now.</p>
            <p className="text-xs mt-1">Others will appear here when they join the call.</p>
          </div>
        )}
      </div>

      {/* Error banner */}
      {(mediaError || webrtcError) && (
        <div className="mx-4 mb-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
          <p className="text-xs text-amber-400">{mediaError ?? webrtcError}</p>
        </div>
      )}

      {/* Media controls */}
      <div className="p-4 safe-bottom">
        <MediaControls
          audioEnabled={audioEnabled}
          videoEnabled={videoEnabled}
          isScreenSharing={isScreenSharing}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
          onToggleScreenShare={() => {
            if (isScreenSharing) stopScreenShare();
            else startScreenShare();
          }}
          onLeaveRoom={() => {
            releaseStream();
            onLeaveRoom();
          }}
          audioDevices={audioDevices}
          videoDevices={videoDevices}
          selectedAudioInputId={selectedAudioInputId}
          selectedVideoInputId={selectedVideoInputId}
          onAudioInputChange={setAudioInput}
          onVideoInputChange={setVideoInput}
          className="max-w-md mx-auto"
        />
      </div>
    </div>
  );
}
