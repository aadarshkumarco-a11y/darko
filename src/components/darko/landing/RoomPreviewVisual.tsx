"use client";

import { motion } from "framer-motion";
import { Play, Pause, Volume2, Mic, MicOff, Video, VideoOff, Send, Users } from "lucide-react";

/**
 * Decorative animated preview of a DARKO room.
 * Used on the landing hero — this is NOT a real room, just a visual.
 * Real room UI lives at /room/[roomId].
 */
export function RoomPreviewVisual() {
  return (
    <div className="relative">
      {/* Glow behind the card */}
      <div
        className="absolute -inset-8 rounded-3xl opacity-60 blur-3xl pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 30% 20%, rgba(99,102,241,0.4), transparent 60%), radial-gradient(circle at 70% 80%, rgba(139,92,246,0.3), transparent 60%)",
        }}
      />

      {/* The room shell */}
      <div className="relative surface-floating rounded-2xl overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
            </div>
            <div className="ml-3 text-xs text-muted font-mono">darko.app/room/x7k2m9</div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Users className="h-3.5 w-3.5" />
            <span>4</span>
          </div>
        </div>

        {/* Activity stage — watch party */}
        <div className="relative aspect-video bg-black">
          {/* Faux video thumbnail */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4338ca 60%, #6366f1 100%)",
            }}
          />
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle at 30% 50%, rgba(255,255,255,0.3), transparent 40%), radial-gradient(circle at 70% 30%, rgba(255,255,255,0.2), transparent 40%)",
            }}
          />

          {/* Center play indicator */}
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
              <Play className="h-6 w-6 text-white fill-white ml-0.5" />
            </div>
          </motion.div>

          {/* Sync indicator — top right */}
          <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm flex items-center gap-1.5">
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="h-1.5 w-1.5 rounded-full bg-green-400"
            />
            <span className="text-[10px] text-white font-mono">in sync</span>
          </div>

          {/* Video controls — bottom */}
          <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/80 to-transparent flex items-center gap-2">
            <Play className="h-3.5 w-3.5 text-white" />
            <div className="flex-1 h-1 rounded-full bg-white/20 overflow-hidden">
              <motion.div
                animate={{ width: ["32%", "48%", "32%"] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="h-full bg-primary"
              />
            </div>
            <Volume2 className="h-3.5 w-3.5 text-white" />
            <span className="text-[10px] text-white/70 font-mono">12:34</span>
          </div>
        </div>

        {/* Participant strip */}
        <div className="px-3 py-3 border-t border-border-subtle">
          <div className="flex items-center gap-2">
            {[
              { initial: "A", color: "#6366F1", mic: true, cam: true, active: true },
              { initial: "K", color: "#EC4899", mic: true, cam: true },
              { initial: "M", color: "#10B981", mic: false, cam: true },
              { initial: "R", color: "#F59E0B", mic: true, cam: false },
            ].map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + i * 0.1 }}
                className={`relative h-12 w-16 rounded-lg flex items-center justify-center text-xs font-bold text-white border ${
                  p.active ? "border-primary glow-primary" : "border-border-subtle"
                }`}
                style={{ background: `linear-gradient(135deg, ${p.color}40, ${p.color}20)` }}
              >
                {p.cam ? (
                  <span>{p.initial}</span>
                ) : (
                  <VideoOff className="h-3.5 w-3.5 opacity-70" />
                )}
                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-elevated border border-border-strong flex items-center justify-center">
                  {p.mic ? (
                    <Mic className="h-2.5 w-2.5 text-green-400" />
                  ) : (
                    <MicOff className="h-2.5 w-2.5 text-muted" />
                  )}
                </div>
              </motion.div>
            ))}
            <div className="ml-auto flex items-center gap-1.5">
              <div className="h-8 w-8 rounded-lg bg-elevated flex items-center justify-center">
                <Mic className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="h-8 w-8 rounded-lg bg-elevated flex items-center justify-center">
                <Video className="h-3.5 w-3.5 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Chat strip — animated message appearing */}
        <div className="px-3 py-2 border-t border-border-subtle bg-input/50">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2 }}
            className="flex items-center gap-2 text-[11px]"
          >
            <div className="h-5 w-5 rounded-full bg-primary/30 flex items-center justify-center text-[9px] font-bold text-white">
              K
            </div>
            <span className="text-secondary">this scene is unreal 🔥</span>
            <Send className="ml-auto h-3 w-3 text-muted" />
          </motion.div>
        </div>
      </div>

      {/* Floating "live" badge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="absolute -top-3 -right-3 px-2.5 py-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center gap-1.5 shadow-lg"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
        LIVE
      </motion.div>
    </div>
  );
}
