"use client";

import { motion } from "framer-motion";
import { Link2, Users, Sparkle } from "lucide-react";

const STEPS = [
  {
    icon: Link2,
    step: "01",
    title: "Create a room",
    description:
      "Pick a name, pick a theme, hit create. You get a shareable link instantly — no account required if you just want to hang out.",
  },
  {
    icon: Users,
    step: "02",
    title: "Share the link",
    description:
      "Drop the link in any chat. Friends click, pick a display name, and they're in. Guests are first-class — not second-class.",
  },
  {
    icon: Sparkle,
    step: "03",
    title: "Hang out together",
    description:
      "Watch a video. Voice chat. Play a game. Share a file. Draw on a whiteboard. Switch activities without ever leaving the room.",
  },
];

export function HowItWorks() {
  return (
    <section className="relative py-24 sm:py-32 border-y border-border-subtle">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs font-medium text-secondary mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            How it works
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-white">
            Three steps.
            <br />
            <span className="text-gradient-accent">Zero friction.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative"
            >
              {/* Connector line on desktop */}
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] right-[-40%] h-px bg-gradient-to-r from-border-strong to-transparent" />
              )}

              <div className="relative">
                <div className="relative h-14 w-14 rounded-2xl bg-elevated border border-border-strong flex items-center justify-center mb-5">
                  <step.icon className="h-6 w-6 text-primary" />
                  <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                    {step.step}
                  </span>
                </div>
                <h3 className="font-display text-xl font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-secondary leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
