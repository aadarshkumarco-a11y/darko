"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, Settings, ChevronUp, Phone } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { cn } from "@/lib/utils";

interface MediaControlsProps {
  audioEnabled: boolean;
  videoEnabled: boolean;
  isScreenSharing: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onLeaveRoom: () => void;
  audioDevices: { deviceId: string; label: string }[];
  videoDevices: { deviceId: string; label: string }[];
  selectedAudioInputId: string | null;
  selectedVideoInputId: string | null;
  onAudioInputChange: (deviceId: string) => void;
  onVideoInputChange: (deviceId: string) => void;
  className?: string;
}

export function MediaControls({
  audioEnabled,
  videoEnabled,
  isScreenSharing,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onLeaveRoom,
  audioDevices,
  videoDevices,
  selectedAudioInputId,
  selectedVideoInputId,
  onAudioInputChange,
  onVideoInputChange,
  className,
}: MediaControlsProps) {
  const [showAudioPicker, setShowAudioPicker] = useState(false);
  const [showVideoPicker, setShowVideoPicker] = useState(false);

  // Close pickers on outside click
  useEffect(() => {
    const handler = () => {
      setShowAudioPicker(false);
      setShowVideoPicker(false);
    };
    if (showAudioPicker || showVideoPicker) {
      window.addEventListener("click", handler);
      return () => window.removeEventListener("click", handler);
    }
  }, [showAudioPicker, showVideoPicker]);

  return (
    <div className={cn("flex items-center justify-center gap-2 p-3 surface-floating rounded-2xl", className)}>
      {/* Audio control */}
      <div className="relative">
        <div className="flex">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleAudio();
            }}
            className={cn(
              "h-11 w-11 rounded-l-lg flex items-center justify-center transition-colors",
              audioEnabled
                ? "bg-elevated text-white hover:bg-overlay"
                : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
            )}
            aria-label={audioEnabled ? "Mute microphone" : "Unmute microphone"}
            title={audioEnabled ? "Mute" : "Unmute"}
          >
            {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </button>
          {audioDevices.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAudioPicker(!showAudioPicker);
                setShowVideoPicker(false);
              }}
              className="h-11 w-6 rounded-r-lg bg-elevated text-white hover:bg-overlay flex items-center justify-center border-l border-border-subtle"
              aria-label="Audio device picker"
              title="Choose microphone"
            >
              <ChevronUp className="h-3 w-3" />
            </button>
          )}
        </div>

        <AnimatePresence>
          {showAudioPicker && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full mb-2 left-0 w-56 surface-floating rounded-lg p-2 shadow-xl z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-[10px] uppercase tracking-widest text-muted px-2 py-1">Microphone</p>
              {audioDevices.map((d) => (
                <button
                  key={d.deviceId}
                  onClick={() => {
                    onAudioInputChange(d.deviceId);
                    setShowAudioPicker(false);
                  }}
                  className={cn(
                    "w-full text-left px-2 py-1.5 rounded text-xs transition-colors",
                    selectedAudioInputId === d.deviceId
                      ? "bg-primary/20 text-white"
                      : "text-secondary hover:bg-hover"
                  )}
                >
                  {d.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Video control */}
      <div className="relative">
        <div className="flex">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleVideo();
            }}
            className={cn(
              "h-11 w-11 rounded-l-lg flex items-center justify-center transition-colors",
              videoEnabled
                ? "bg-elevated text-white hover:bg-overlay"
                : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
            )}
            aria-label={videoEnabled ? "Turn off camera" : "Turn on camera"}
            title={videoEnabled ? "Camera off" : "Camera on"}
          >
            {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </button>
          {videoDevices.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowVideoPicker(!showVideoPicker);
                setShowAudioPicker(false);
              }}
              className="h-11 w-6 rounded-r-lg bg-elevated text-white hover:bg-overlay flex items-center justify-center border-l border-border-subtle"
              aria-label="Video device picker"
              title="Choose camera"
            >
              <ChevronUp className="h-3 w-3" />
            </button>
          )}
        </div>

        <AnimatePresence>
          {showVideoPicker && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full mb-2 left-0 w-56 surface-floating rounded-lg p-2 shadow-xl z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-[10px] uppercase tracking-widest text-muted px-2 py-1">Camera</p>
              {videoDevices.map((d) => (
                <button
                  key={d.deviceId}
                  onClick={() => {
                    onVideoInputChange(d.deviceId);
                    setShowVideoPicker(false);
                  }}
                  className={cn(
                    "w-full text-left px-2 py-1.5 rounded text-xs transition-colors",
                    selectedVideoInputId === d.deviceId
                      ? "bg-primary/20 text-white"
                      : "text-secondary hover:bg-hover"
                  )}
                >
                  {d.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Screen share */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleScreenShare();
        }}
        className={cn(
          "h-11 px-4 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium",
          isScreenSharing
            ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
            : "bg-elevated text-white hover:bg-overlay"
        )}
        aria-label={isScreenSharing ? "Stop screen share" : "Share screen"}
        title={isScreenSharing ? "Stop sharing" : "Share screen"}
      >
        {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
        <span className="hidden sm:inline">
          {isScreenSharing ? "Stop" : "Share"}
        </span>
      </button>

      {/* Leave room */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onLeaveRoom();
        }}
        className="h-11 px-4 rounded-lg bg-red-500 text-white hover:bg-red-600 flex items-center gap-2 transition-colors text-sm font-medium"
        aria-label="Leave room"
        title="Leave room"
      >
        <Phone className="h-5 w-5 rotate-[135deg]" />
        <span className="hidden sm:inline">Leave</span>
      </button>
    </div>
  );
}
