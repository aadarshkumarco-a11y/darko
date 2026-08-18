"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Play, Users, MessageSquare, Video, Gamepad2, Share2, Sparkles } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { RoomPreviewVisual } from "./RoomPreviewVisual";

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="ambient-glow animate-drift-slow"
          style={{
            top: "-10%",
            left: "20%",
            width: "500px",
            height: "500px",
            background: "rgba(99, 102, 241, 0.4)",
          }}
        />
        <div
          className="ambient-glow animate-drift-slower"
          style={{
            top: "30%",
            right: "0%",
            width: "400px",
            height: "400px",
            background: "rgba(139, 92, 246, 0.25)",
          }}
        />
        <div
          className="ambient-glow animate-drift-slow"
          style={{
            bottom: "-10%",
            left: "10%",
            width: "450px",
            height: "450px",
            background: "rgba(16, 185, 129, 0.15)",
          }}
        />
      </div>

      {/* Dot grid background */}
      <div className="absolute inset-0 bg-dots opacity-50 pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Copy */}
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-medium text-secondary mb-6"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              No app. No account. Just one link.
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]"
            >
              <span className="text-white">Hang out,</span>
              <br />
              <span className="text-gradient-accent">together.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 text-base sm:text-lg text-secondary max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              Create a room, share one link, and everything you need for a digital hangout is inside — watch together, voice/video chat, play games, share files. No installs, no mandatory accounts.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start"
            >
              <Button variant="primary" size="lg" asChild rightIcon={<ArrowRight className="h-4 w-4" />}>
                <Link href="/rooms/create">
                  Create a room
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild leftIcon={<Play className="h-4 w-4" />}>
                <Link href="/features">
                  See how it works
                </Link>
              </Button>
            </motion.div>

            {/* Trust line */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="mt-8 flex items-center gap-6 justify-center lg:justify-start text-xs text-muted"
            >
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> Guest-friendly
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Free forever
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Video className="h-3.5 w-3.5" /> WebRTC powered
              </span>
            </motion.div>
          </div>

          {/* Right: Animated room preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <RoomPreviewVisual />
          </motion.div>
        </div>

        {/* Feature pills below the fold */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {[
            { icon: Video, label: "Voice & video" },
            { icon: Play, label: "Watch party" },
            { icon: Gamepad2, label: "Multiplayer games" },
            { icon: Share2, label: "P2P file share" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl surface-card text-sm"
            >
              <Icon className="h-4 w-4 text-primary shrink-0" />
              <span className="text-secondary">{label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
