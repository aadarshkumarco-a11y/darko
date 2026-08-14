"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { AshokaChakra } from "./AshokaChakra";
import { WavingFlag } from "./WavingFlag";
import { ParticleCanvas } from "./ParticleCanvas";

interface HeroSectionProps {
  onBegin: () => void;
}

export function HeroSection({ onBegin }: HeroSectionProps) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stages = reduceMotion
      ? [0, 200, 400, 600, 800]
      : [0, 1200, 2400, 3600, 4800];

    const timers = stages.map((t, i) =>
      setTimeout(() => setStage(i), t)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <section
      id="home"
      className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#040614] via-[#060818] to-[#0a0e27]" />

      {/* Tricolor radial lighting */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(255,153,51,0.15), transparent 50%), radial-gradient(circle at 20% 80%, rgba(19,136,8,0.10), transparent 50%), radial-gradient(circle at 80% 20%, rgba(0,0,128,0.15), transparent 50%)",
        }}
      />

      <ParticleCanvas density={0.9} />

      {/* Big rotating Ashoka Chakra behind content */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{
          opacity: stage >= 1 ? 0.18 : 0,
          scale: stage >= 1 ? 1 : 0.6,
        }}
        transition={{ duration: 2, ease: "easeOut" }}
      >
        <div className="text-chakra-blue-light">
          <AshokaChakra size={Math.min(900, typeof window !== "undefined" ? window.innerWidth * 0.9 : 900)} spinDuration={80} glow />
        </div>
      </motion.div>

      {/* Waving flag */}
      <motion.div
        className="absolute top-[14%] z-10"
        initial={{ opacity: 0, y: -30, scale: 0.85 }}
        animate={{
          opacity: stage >= 1 ? 1 : 0,
          y: stage >= 1 ? 0 : -30,
          scale: stage >= 1 ? 1 : 0.85,
        }}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <WavingFlag height={140} wind="medium" className="w-[200px] sm:w-[260px] md:w-[300px]" />
      </motion.div>

      {/* Main content */}
      <div className="relative z-20 flex flex-col items-center text-center px-6 mt-32 sm:mt-40">
        <AnimatePresence mode="wait">
          {stage >= 2 && (
            <motion.div
              key="date"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="mb-6"
            >
              <div className="text-saffron font-serif tracking-[0.4em] text-sm sm:text-base md:text-lg font-semibold">
                15 · AUGUST · 2026
              </div>
              <div className="divider-ornament w-48 mx-auto mt-3" />
            </motion.div>
          )}
        </AnimatePresence>

        {stage >= 3 && (
          <motion.h1
            initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight"
          >
            <span className="text-saffron text-glow-saffron">Happy</span>{" "}
            <span className="text-white text-glow-white">Independence</span>{" "}
            <span className="text-india-green text-glow-green">Day</span>
            <br />
            <span className="shimmer-text">India</span>{" "}
            <span className="text-2xl sm:text-3xl md:text-4xl">🇮🇳</span>
          </motion.h1>
        )}

        {stage >= 4 && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="mt-8 max-w-xl text-base sm:text-lg md:text-xl text-white/80 italic font-light"
          >
            &ldquo;A journey from sacrifice to freedom, from freedom to progress.&rdquo;
          </motion.p>
        )}

        {stage >= 4 && (
          <motion.button
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={onBegin}
            className="group relative mt-12 px-8 py-4 sm:px-10 sm:py-5 rounded-full overflow-hidden cursor-pointer"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-saffron via-white to-india-green opacity-90" />
            <span className="absolute inset-0 bg-gradient-to-r from-saffron via-white to-india-green blur-md opacity-60 group-hover:opacity-100 transition-opacity" />
            <span className="relative text-[#060818] font-serif font-bold text-base sm:text-lg tracking-wide flex items-center gap-2">
              Begin the Journey
              <span className="text-xl">🇮🇳</span>
            </span>
          </motion.button>
        )}

        {/* Scroll hint */}
        {stage >= 4 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.5 }}
            className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-white/40 text-xs tracking-widest uppercase animate-pulse"
          >
            <div className="flex flex-col items-center gap-2">
              <span>Scroll</span>
              <svg width="14" height="20" viewBox="0 0 14 20" fill="none">
                <path d="M7 1V18M7 18L1 12M7 18L13 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          </motion.div>
        )}
      </div>

      {/* Decorative corner ornaments */}
      <div className="absolute top-6 left-6 text-gold/30 pointer-events-none">
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
          <path d="M5 5 L5 25 M5 5 L25 5 M5 5 L20 20" stroke="currentColor" strokeWidth="1" />
          <circle cx="5" cy="5" r="2" fill="currentColor" />
        </svg>
      </div>
      <div className="absolute top-6 right-6 text-gold/30 pointer-events-none scale-x-[-1]">
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
          <path d="M5 5 L5 25 M5 5 L25 5 M5 5 L20 20" stroke="currentColor" strokeWidth="1" />
          <circle cx="5" cy="5" r="2" fill="currentColor" />
        </svg>
      </div>
    </section>
  );
}
