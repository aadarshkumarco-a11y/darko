"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { X, Quote, MapPin } from "lucide-react";
import { AshokaChakra } from "./AshokaChakra";
import { FREEDOM_FIGHTERS, type FreedomFighter } from "./data/freedomFighters";

const ACCENT_COLORS: Record<FreedomFighter["accentColor"], { bg: string; text: string; border: string; glow: string }> = {
  saffron: { bg: "from-saffron/30 to-saffron/5", text: "text-saffron", border: "border-saffron/50", glow: "shadow-[0_0_30px_rgba(255,153,51,0.4)]" },
  green: { bg: "from-india-green/30 to-india-green/5", text: "text-india-green", border: "border-india-green/50", glow: "shadow-[0_0_30px_rgba(19,136,8,0.4)]" },
  blue: { bg: "from-chakra-blue-light/40 to-chakra-blue-light/5", text: "text-chakra-blue-light", border: "border-chakra-blue-light/50", glow: "shadow-[0_0_30px_rgba(30,58,138,0.5)]" },
  gold: { bg: "from-gold/30 to-gold/5", text: "text-gold", border: "border-gold/50", glow: "shadow-[0_0_30px_rgba(212,175,55,0.4)]" },
};

export function FreedomFightersSection() {
  const [selected, setSelected] = useState<FreedomFighter | null>(null);

  return (
    <section id="fighters" className="relative py-24 sm:py-32 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          eyebrow="Their Sacrifice · Our Freedom"
          deva="स्वतंत्रता सेनानी"
          title="Freedom Fighters"
          subtitle="The souls who turned a colony into a nation. Click any card to walk with them through history."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 sm:gap-6 mt-16">
          {FREEDOM_FIGHTERS.map((fighter, i) => (
            <FighterCard key={fighter.id} fighter={fighter} index={i} onClick={() => setSelected(fighter)} />
          ))}
        </div>
      </div>

      <FighterModal fighter={selected} onClose={() => setSelected(null)} />
    </section>
  );
}

function FighterCard({ fighter, index, onClick }: { fighter: FreedomFighter; index: number; onClick: () => void }) {
  const accent = ACCENT_COLORS[fighter.accentColor];
  return (
    <motion.button
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: (index % 5) * 0.08 }}
      onClick={onClick}
      whileHover={{ y: -8 }}
      className={`group relative text-left rounded-2xl overflow-hidden glass-strong border ${accent.border} hover:${accent.glow} transition-all duration-500`}
      aria-label={`Learn about ${fighter.name}`}
    >
      {/* Top: stylized portrait area with initials */}
      <div className={`relative h-48 sm:h-52 bg-gradient-to-br ${accent.bg} flex items-center justify-center overflow-hidden`}>
        {/* Background chakra that appears on hover */}
        <div className={`absolute inset-0 flex items-center justify-center ${accent.text} opacity-0 group-hover:opacity-30 transition-opacity duration-700`}>
          <AshokaChakra size={180} spinDuration={12} glow />
        </div>

        {/* Initials portrait */}
        <div className={`relative font-serif text-6xl font-bold ${accent.text} transition-transform duration-700 group-hover:scale-110`}>
          {fighter.initials}
        </div>

        {/* Tricolor stripe at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1 tiranga-bar" />

        {/* Years badge */}
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-[10px] tracking-wide text-white/80 font-mono">
          {fighter.years}
        </div>
      </div>

      {/* Bottom: name + role */}
      <div className="p-4 sm:p-5">
        <h3 className="font-serif text-lg font-bold text-white leading-tight">
          {fighter.name}
        </h3>
        {fighter.devaName && (
          <p className="font-deva text-xs text-white/50 mt-1">{fighter.devaName}</p>
        )}
        <p className={`text-xs mt-2 ${accent.text} font-medium tracking-wide`}>
          {fighter.role}
        </p>

        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-white/40">
            View Story
          </span>
          <span className={`text-xs ${accent.text} transition-transform group-hover:translate-x-1`}>
            →
          </span>
        </div>
      </div>
    </motion.button>
  );
}

function FighterModal({ fighter, onClose }: { fighter: FreedomFighter | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {fighter && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 10, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto glass-strong rounded-3xl border border-gold/30"
          >
            <FighterModalContent fighter={fighter} onClose={onClose} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function FighterModalContent({ fighter, onClose }: { fighter: FreedomFighter; onClose: () => void }) {
  const accent = ACCENT_COLORS[fighter.accentColor];
  return (
    <div>
      {/* Header */}
      <div className={`relative p-6 sm:p-8 bg-gradient-to-br ${accent.bg} border-b border-white/10`}>
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
          <AshokaChakra size={400} spinDuration={80} className={accent.text} />
        </div>

        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
        >
          <X size={18} />
        </button>

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className={`flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br ${accent.bg} border ${accent.border} flex items-center justify-center font-serif text-3xl sm:text-4xl font-bold ${accent.text}`}>
            {fighter.initials}
          </div>
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">{fighter.name}</h2>
            {fighter.devaName && (
              <p className="font-deva text-base text-white/60 mt-1">{fighter.devaName}</p>
            )}
            <p className={`text-sm mt-1 ${accent.text} font-medium`}>{fighter.role}</p>
            <p className="text-xs text-white/50 mt-2 font-mono">{fighter.years}</p>
            {fighter.born && (
              <p className="text-xs text-white/40 mt-1 flex items-center gap-1">
                <MapPin size={10} /> Born: {fighter.born}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 sm:p-8 space-y-6">
        {/* Quote */}
        <blockquote className={`relative pl-5 py-2 ${accent.text}`}>
          <Quote size={20} className="absolute left-0 top-0 opacity-60" />
          <p className="font-serif italic text-lg sm:text-xl leading-relaxed text-white/90">
            {fighter.quote}
          </p>
        </blockquote>

        {/* Bio */}
        <div>
          <h4 className="text-xs uppercase tracking-widest text-gold mb-2 font-semibold">Biography</h4>
          <p className="text-sm sm:text-base text-white/80 leading-relaxed">{fighter.bio}</p>
        </div>

        {/* Contribution */}
        <div>
          <h4 className="text-xs uppercase tracking-widest text-gold mb-2 font-semibold">Major Contribution</h4>
          <p className="text-sm sm:text-base text-white/80 leading-relaxed">{fighter.contribution}</p>
        </div>

        {/* Significance */}
        <div className={`p-4 sm:p-5 rounded-xl bg-gradient-to-br ${accent.bg} border ${accent.border}`}>
          <h4 className="text-xs uppercase tracking-widest text-gold mb-2 font-semibold">Historical Significance</h4>
          <p className="text-sm sm:text-base text-white/90 leading-relaxed italic">{fighter.significance}</p>
        </div>

        <div className="pt-2 text-center">
          <p className="font-deva text-sm text-white/50">वन्दे मातरम्</p>
          <p className="font-serif text-xs gold-text tracking-widest mt-1"> VANDE MATARAM </p>
        </div>
      </div>
    </div>
  );
}

export function SectionHeader({ eyebrow, deva, title, subtitle }: { eyebrow: string; deva?: string; title: string; subtitle?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8 }}
      className="text-center"
    >
      <div className="flex items-center justify-center gap-3 mb-3">
        <div className="h-px w-12 bg-gradient-to-r from-transparent to-gold/50" />
        <span className="text-xs sm:text-sm uppercase tracking-[0.3em] text-gold/80 font-medium">
          {eyebrow}
        </span>
        <div className="h-px w-12 bg-gradient-to-l from-transparent to-gold/50" />
      </div>
      {deva && (
        <p className="font-deva text-base sm:text-lg text-saffron/80 mb-2">{deva}</p>
      )}
      <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white text-glow-white">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-sm sm:text-base text-white/60 max-w-2xl mx-auto leading-relaxed">
          {subtitle}
        </p>
      )}
      <div className="divider-ornament w-32 mx-auto mt-6" />
    </motion.div>
  );
}
