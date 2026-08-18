"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Video, VideoOff, Crown, Shield, Monitor, MoreVertical } from "lucide-react";
import type { ParticipantState } from "@/types/events";
import { cn } from "@/lib/utils";

interface ParticipantTileProps {
  participant: ParticipantState;
  isSelf?: boolean;
  onContextMenu?: (e: React.MouseEvent) => void;
  size?: "sm" | "md" | "lg";
}

const ROLE_BADGES: Record<string, { icon: typeof Crown; color: string; label: string }> = {
  OWNER: { icon: Crown, color: "text-amber-400", label: "Owner" },
  HOST: { icon: Shield, color: "text-indigo-400", label: "Host" },
  MODERATOR: { icon: Shield, color: "text-emerald-400", label: "Mod" },
};

export function ParticipantTile({ participant, isSelf, onContextMenu, size = "md" }: ParticipantTileProps) {
  const roleBadge = ROLE_BADGES[participant.role];

  const sizes = {
    sm: { tile: "h-12 w-12", text: "text-xs", icon: "h-3 w-3" },
    md: { tile: "h-16 w-16", text: "text-sm", icon: "h-3.5 w-3.5" },
    lg: { tile: "h-24 w-24", text: "text-base", icon: "h-4 w-4" },
  }[size];

  // Generate initials from display name
  const initials = participant.displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("") || "?";

  // Generate a deterministic color from the user ID
  const hue = participant.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  const bgColor = `hsl(${hue}, 50%, 35%)`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      onContextMenu={onContextMenu}
      className={cn(
        "relative group flex flex-col items-center gap-2 cursor-default",
        isSelf && "ring-2 ring-primary rounded-lg p-1 -m-1"
      )}
    >
      {/* Avatar / Video tile */}
      <div className={cn("relative rounded-lg overflow-hidden flex items-center justify-center", sizes.tile)} style={{ background: bgColor }}>
        {/* Initials (Phase 3 will replace with actual video) */}
        <span className={cn("font-semibold text-white", sizes.text)}>{initials}</span>

        {/* Role badge */}
        {roleBadge && (
          <div className={cn("absolute top-1 left-1", size === "sm" && "top-0.5 left-0.5")}>
            <roleBadge.icon className={cn(roleBadge.color, sizes.icon)} />
          </div>
        )}

        {/* Screen share indicator */}
        {participant.screenSharing && (
          <div className="absolute top-1 right-1">
            <Monitor className={cn("text-emerald-400", sizes.icon)} />
          </div>
        )}

        {/* Media status indicators (bottom) */}
        <div className="absolute bottom-1 right-1 flex gap-0.5">
          {participant.audioEnabled ? (
            <Mic className={cn("text-white/80", sizes.icon)} />
          ) : (
            <MicOff className={cn("text-red-400", sizes.icon)} />
          )}
          {participant.videoEnabled ? (
            <Video className={cn("text-white/80", sizes.icon)} />
          ) : (
            <VideoOff className={cn("text-white/40", sizes.icon)} />
          )}
        </div>

        {/* Idle indicator */}
        {participant.isIdle && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-[10px] text-white/60">idle</span>
          </div>
        )}
      </div>

      {/* Name */}
      <div className="flex items-center gap-1 max-w-full">
        <span className={cn("text-secondary truncate", size === "sm" ? "text-[10px]" : "text-xs")}>
          {participant.displayName}
          {isSelf && <span className="text-muted ml-1">(you)</span>}
        </span>
      </div>
    </motion.div>
  );
}
