"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { TIMELINE_EVENTS } from "./data/timeline";
import { SectionHeader } from "./FreedomFightersSection";

const ACCENT_MAP = {
  saffron: { color: "#FF9933", bg: "from-saffron/20 to-transparent", border: "border-saffron/40" },
  white: { color: "#FFFFFF", bg: "from-white/20 to-transparent", border: "border-white/40" },
  green: { color: "#138808", bg: "from-india-green/20 to-transparent", border: "border-india-green/40" },
  gold: { color: "#D4AF37", bg: "from-gold/20 to-transparent", border: "border-gold/40" },
  blue: { color: "#1E3A8A", bg: "from-chakra-blue-light/20 to-transparent", border: "border-chakra-blue-light/40" },
};

/**
 * Cinematic vertical timeline with progress line that fills as user scrolls.
 * On large screens, alternating left/right; on mobile, single column.
 */
export function TimelineSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 60%", "end 60%"],
  });

  const lineScaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section id="timeline" ref={sectionRef} className="relative py-24 sm:py-32 px-4 sm:px-6 overflow-hidden">
      {/* Section-specific bg */}
      <div className="absolute inset-0 mandala-bg opacity-50" />

      <div className="max-w-6xl mx-auto relative">
        <SectionHeader
          eyebrow="The Long Walk · 1857 — 1947"
          deva="स्वतंत्रता यात्रा"
          title="India Through Time"
          subtitle="Ninety years of sacrifice, struggle, and unbreakable will — scroll to walk through the milestones that shaped a free nation."
        />

        <div className="relative mt-20">
          {/* Center progress line (desktop) */}
          <div className="hidden md:block absolute left-1/2 top-0 -translate-x-1/2 w-[3px] h-full bg-white/10 rounded-full overflow-hidden">
            <motion.div
              style={{ scaleY: lineScaleY, transformOrigin: "top" }}
              className="w-full h-full bg-gradient-to-b from-saffron via-white to-india-green rounded-full"
            />
          </div>

          {/* Left progress line (mobile) */}
          <div className="md:hidden absolute left-4 top-0 w-[3px] h-full bg-white/10 rounded-full overflow-hidden">
            <motion.div
              style={{ scaleY: lineScaleY, transformOrigin: "top" }}
              className="w-full h-full bg-gradient-to-b from-saffron via-white to-india-green rounded-full"
            />
          </div>

          <div className="space-y-12 md:space-y-16">
            {TIMELINE_EVENTS.map((event, i) => (
              <TimelineItem key={event.year} event={event} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TimelineItem({ event, index }: { event: typeof TIMELINE_EVENTS[number]; index: number }) {
  const accent = ACCENT_MAP[event.accentColor];
  const isRight = index % 2 === 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={`relative flex flex-col md:flex-row md:items-center ${
        isRight ? "md:flex-row-reverse" : ""
      } pl-12 md:pl-0`}
    >
      {/* Dot on the timeline */}
      <div className="absolute left-4 md:left-1/2 top-6 md:top-1/2 -translate-x-1/2 md:-translate-y-1/2 z-10">
        <motion.div
          whileHover={{ scale: 1.2 }}
          className="relative w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center"
          style={{ background: accent.color, boxShadow: `0 0 20px ${accent.color}` }}
        >
          <span className="absolute inset-0 rounded-full animate-ping opacity-40" style={{ background: accent.color }} />
        </motion.div>
      </div>

      {/* Empty spacer for desktop alternating layout */}
      <div className="hidden md:block md:w-1/2" />

      {/* Content card */}
      <div className="md:w-1/2 md:px-8 mt-4 md:mt-0">
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={`relative glass-strong rounded-2xl p-5 sm:p-6 border ${accent.border} hover:shadow-2xl transition-shadow`}
        >
          {/* Year */}
          <div className="flex items-center gap-3 mb-3">
            <span
              className="font-serif text-3xl sm:text-4xl font-bold"
              style={{ color: accent.color, textShadow: `0 0 18px ${accent.color}80` }}
            >
              {event.year}
            </span>
            <span className="text-2xl opacity-70" style={{ color: accent.color }}>
              {event.icon}
            </span>
          </div>

          {event.date && (
            <div className="text-xs text-white/40 font-mono mb-2">{event.date}</div>
          )}

          <h3 className="font-serif text-lg sm:text-xl font-bold text-white mb-2">
            {event.title}
          </h3>
          <p className="text-sm text-white/70 mb-3 leading-relaxed italic">
            {event.description}
          </p>
          <p className="text-sm text-white/60 leading-relaxed">
            {event.detail}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
