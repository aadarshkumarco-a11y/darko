"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Users } from "lucide-react";
import { ParticipantTile } from "./ParticipantTile";
import { useRoomStore } from "@/stores/room-store";

interface ParticipantStripProps {
  className?: string;
  compact?: boolean;
}

export function ParticipantStrip({ className, compact }: ParticipantStripProps) {
  const participants = useRoomStore((s) => s.participants);
  const self = useRoomStore((s) => s.self);

  // Sort: self first, then by role rank, then by joinedAt
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.id === self?.id) return -1;
    if (b.id === self?.id) return 1;
    const rank = { OWNER: 0, HOST: 1, MODERATOR: 2, MEMBER: 3, GUEST: 4 } as const;
    return (rank[a.role as keyof typeof rank] ?? 5) - (rank[b.role as keyof typeof rank] ?? 5);
  });

  return (
    <div className={`flex flex-col ${className ?? ""}`}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border-subtle">
        <Users className="h-4 w-4 text-primary" />
        <h3 className="font-display text-sm font-semibold text-white">Participants</h3>
        <span className="ml-auto text-xs text-muted">
          {participants.length} {participants.length === 1 ? "person" : "people"}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {sortedParticipants.map((p) => (
              <ParticipantTile
                key={p.id}
                participant={p}
                isSelf={p.id === self?.id}
                size={compact ? "sm" : "md"}
              />
            ))}
          </AnimatePresence>
        </div>
        {participants.length === 0 && (
          <div className="text-center py-8 text-muted text-sm">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No one else here yet.</p>
            <p className="text-xs mt-1">Share the invite link!</p>
          </div>
        )}
      </div>
    </div>
  );
}
