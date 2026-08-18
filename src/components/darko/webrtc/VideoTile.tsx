"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Video, VideoOff, Monitor, Wifi, WifiOff, AlertCircle, Crown } from "lucide-react";
import type { ConnectionQuality } from "@/types/media";
import { cn } from "@/lib/utils";

interface VideoTileProps {
  stream: MediaStream | null;
  displayName: string;
  isSelf?: boolean;
  audioEnabled?: boolean;
  videoEnabled?: boolean;
  isScreenShare?: boolean;
  role?: string;
  quality?: ConnectionQuality;
  className?: string;
  large?: boolean;
}

export function VideoTile({
  stream,
  displayName,
  isSelf,
  audioEnabled = true,
  videoEnabled = true,
  isScreenShare = false,
  role,
  quality = "good",
  className,
  large = false,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Attach stream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      // Play (catch autoplay blocking)
      videoRef.current.play().catch(() => {
        // Autoplay blocked — video will play once user interacts
      });
    }
    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [stream]);

  // Generate initials for fallback
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("") || "?";

  // Deterministic avatar color
  const hue = displayName.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  const avatarBg = `hsl(${hue}, 50%, 35%)`;

  const qualityConfig: Record<ConnectionQuality, { color: string; icon: typeof Wifi; label: string }> = {
    good: { color: "text-emerald-400", icon: Wifi, label: "Good" },
    poor: { color: "text-amber-400", icon: Wifi, label: "Poor" },
    failed: { color: "text-red-400", icon: WifiOff, label: "Disconnected" },
  };
  const qConfig = qualityConfig[quality];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "relative rounded-lg overflow-hidden bg-black border border-border-subtle group",
        large ? "aspect-video" : "aspect-video",
        className
      )}
    >
      {/* Video element (always rendered, toggled via opacity) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isSelf} // Mute own video to prevent echo
        className={cn(
          "absolute inset-0 w-full h-full object-cover transition-opacity",
          videoEnabled && stream ? "opacity-100" : "opacity-0"
        )}
        style={{ transform: isSelf && !isScreenShare ? "scaleX(-1)" : undefined }}
      />

      {/* Avatar fallback (when video is off or no stream) */}
      {(!videoEnabled || !stream) && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: avatarBg }}>
          <span className={cn("font-semibold text-white", large ? "text-4xl" : "text-2xl")}>
            {initials}
          </span>
        </div>
      )}

      {/* Top bar: role + screen share indicator */}
      <div className="absolute top-0 left-0 right-0 p-2 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-1">
          {role === "OWNER" && (
            <div className="h-5 w-5 rounded-full bg-amber-500/90 flex items-center justify-center">
              <Crown className="h-3 w-3 text-white" />
            </div>
          )}
          {isScreenShare && (
            <div className="px-1.5 py-0.5 rounded bg-emerald-500/90 text-[9px] font-bold text-white uppercase flex items-center gap-1">
              <Monitor className="h-2.5 w-2.5" />
              Screen
            </div>
          )}
        </div>
        {!isSelf && quality !== "good" && (
          <div className={cn("flex items-center gap-0.5 text-[9px]", qConfig.color)}>
            <qConfig.icon className="h-2.5 w-2.5" />
            {qConfig.label}
          </div>
        )}
      </div>

      {/* Bottom bar: name + media status */}
      <div className="absolute bottom-0 left-0 right-0 p-2 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs text-white font-medium truncate">
            {displayName}
            {isSelf && <span className="text-white/60 ml-1">(you)</span>}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {audioEnabled ? (
            <Mic className="h-3 w-3 text-white/80" />
          ) : (
            <MicOff className="h-3 w-3 text-red-400" />
          )}
          {videoEnabled ? (
            <Video className="h-3 w-3 text-white/80" />
          ) : (
            <VideoOff className="h-3 w-3 text-white/40" />
          )}
        </div>
      </div>

      {/* Failed overlay */}
      {quality === "failed" && !isSelf && (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2">
          <AlertCircle className="h-6 w-6 text-red-400" />
          <span className="text-[10px] text-white/60">Reconnecting...</span>
        </div>
      )}
    </motion.div>
  );
}
