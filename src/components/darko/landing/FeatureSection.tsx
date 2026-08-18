"use client";

import { motion } from "framer-motion";
import { Play, Mic, Gamepad2, Share2, Palette, Sparkles, Shield, Smartphone } from "lucide-react";

const FEATURES = [
  {
    icon: Play,
    title: "Watch together",
    description:
      "Sync YouTube and direct video URLs with sub-second drift correction. Add a playlist. Host controls playback, anyone can suggest.",
    accent: "from-indigo-500/20 to-indigo-500/0",
  },
  {
    icon: Mic,
    title: "Talk together",
    description:
      "Crystal-clear WebRTC voice and video. Mute, camera off, device switching, screen share — all native browser, no plugins.",
    accent: "from-pink-500/20 to-pink-500/0",
  },
  {
    icon: Gamepad2,
    title: "Play together",
    description:
      "Tic-Tac-Toe, Connect Four, Chess, drawing games — built right in. Spectator mode, rematch, state survives reconnects.",
    accent: "from-emerald-500/20 to-emerald-500/0",
  },
  {
    icon: Share2,
    title: "Share anything",
    description:
      "Drop a file and it streams P2P straight to your friends — no server middleman, no upload limits, no permanent storage.",
    accent: "from-amber-500/20 to-amber-500/0",
  },
  {
    icon: Palette,
    title: "Customize your room",
    description:
      "Seven original themes — Midnight Lounge, Neon Arcade, Cozy Cinema, and more. Pick a mood, the whole room transforms.",
    accent: "from-violet-500/20 to-violet-500/0",
  },
  {
    icon: Smartphone,
    title: "Works everywhere",
    description:
      "Mobile, tablet, desktop, PWA-installable. Bottom sheets on mobile, floating controls on desktop. Touch-first everywhere.",
    accent: "from-blue-500/20 to-blue-500/0",
  },
  {
    icon: Sparkles,
    title: "Guest-first access",
    description:
      "Friends join with one click — no account, no install, no friction. Google login is optional, for those who want persistence.",
    accent: "from-cyan-500/20 to-cyan-500/0",
  },
  {
    icon: Shield,
    title: "Private by default",
    description:
      "Rooms aren't indexed. Voice/video is P2P, not recorded. Files never touch our servers. You own the room, you control access.",
    accent: "from-rose-500/20 to-rose-500/0",
  },
];

export function FeatureSection() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs font-medium text-secondary mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Everything in one room
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-white">
            One link.
            <br />
            <span className="text-gradient-accent">A complete hangout.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-secondary leading-relaxed">
            Stop juggling Discord, Twitch, Google Drive, and three browser tabs. DARKO puts everything your group needs inside a single shared space.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.08 }}
              className="group relative surface-card p-6 hover:-translate-y-1"
            >
              <div
                className={`absolute inset-0 rounded-lg bg-gradient-to-b ${feature.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
              />
              <div className="relative">
                <div className="h-10 w-10 rounded-lg bg-elevated border border-border-subtle flex items-center justify-center mb-4 group-hover:border-primary/40 transition-colors">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-secondary leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
