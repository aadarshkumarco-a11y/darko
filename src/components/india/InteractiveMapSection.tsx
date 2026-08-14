"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { SectionHeader } from "./FreedomFightersSection";

interface Region {
  id: string;
  name: string;
  devaName: string;
  // SVG path for the region (simplified stylized India shape divided into regions)
  path: string;
  info: string;
  highlight: string;
  accentColor: "saffron" | "green" | "blue" | "gold";
}

const ACCENT_MAP = {
  saffron: "#FF9933",
  green: "#138808",
  blue: "#1E3A8A",
  gold: "#D4AF37",
};

// Simplified stylized India map divided into 6 cultural regions
const REGIONS: Region[] = [
  {
    id: "north",
    name: "North India",
    devaName: "उत्तर भारत",
    path: "M 200 70 L 270 65 L 320 90 L 340 130 L 320 170 L 280 190 L 230 175 L 200 140 Z",
    info: "The cradle of Indian civilization. Home to the Ganges plain, the Taj Mahal, the Golden Temple, and Varanasi — the world's oldest continuously inhabited city. Hindi, Urdu, and Punjabi dominate.",
    highlight: "Birthplace of Buddhism, Sikhism, and the Sufi tradition.",
    accentColor: "saffron",
  },
  {
    id: "south",
    name: "South India",
    devaName: "दक्षिण भारत",
    path: "M 220 280 L 270 270 L 290 310 L 270 360 L 240 380 L 210 360 L 195 320 Z",
    info: "Dravidian heartland with 5,000-year-old literary tradition. Home to classical dance (Bharatanatyam), Carnatic music, towering temple gopurams, and the backwaters of Kerala. Tamil, Telugu, Kannada, Malayalam.",
    highlight: "The Silicon Valley of India (Bengaluru) meets 1,000-year-old temples.",
    accentColor: "green",
  },
  {
    id: "east",
    name: "East India",
    devaName: "पूर्वी भारत",
    path: "M 340 170 L 390 180 L 420 220 L 410 270 L 380 290 L 340 270 L 320 220 Z",
    info: "Bengal's intellectual renaissance, Odisha's ancient temples (Konark), and the tea gardens of Assam. Kolkata was India's capital under British rule. The Sundarbans host the Royal Bengal Tiger.",
    highlight: "Birthplace of Rabindranath Tagore, India's first Nobel laureate.",
    accentColor: "gold",
  },
  {
    id: "west",
    name: "West India",
    devaName: "पश्चिमी भारत",
    path: "M 130 170 L 200 175 L 220 220 L 200 270 L 150 280 L 120 240 L 110 200 Z",
    info: "Home to Mumbai — India's financial capital — and Bollywood. Gujarat, the birthplace of Gandhi and Patel, leads India's industrial growth. Rajasthan's Thar Desert hosts the world's most colorful royal palaces.",
    highlight: "Mumbai alone contributes 6% of India's GDP.",
    accentColor: "blue",
  },
  {
    id: "central",
    name: "Central India",
    devaName: "मध्य भारत",
    path: "M 200 190 L 270 195 L 320 220 L 300 270 L 240 280 L 200 250 Z",
    info: "The heart of India. Madhya Pradesh hosts the Khajuraho temples, Sanchi Stupa, and Kanha tiger reserve. Chhattisgarh's tribal heritage and Jharkhand's mineral wealth fuel the nation's industries.",
    highlight: "Home to the Stone Age rock paintings of Bhimbetka — over 30,000 years old.",
    accentColor: "saffron",
  },
  {
    id: "northeast",
    name: "Northeast India",
    devaName: "पूर्वोत्तर भारत",
    path: "M 420 130 L 470 140 L 490 180 L 470 220 L 440 230 L 410 200 Z",
    info: "The 'Seven Sisters' — Assam, Arunachal, Manipur, Meghalaya, Mizoram, Nagaland, Tripura — plus Sikkim. A mosaic of 220+ ethnic groups speaking 220+ languages. Home to the world's wettest place (Mawsynram) and Asia's cleanest village (Mawlynnong).",
    highlight: "The world's largest river island — Majuli — is in Assam.",
    accentColor: "green",
  },
];

export function InteractiveMapSection() {
  const [activeRegion, setActiveRegion] = useState<Region | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  return (
    <section id="today" className="relative py-24 sm:py-32 px-4 sm:px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto relative">
        <SectionHeader
          eyebrow="From Kashmir · To Kanyakumari"
          deva="भारत का भूगोल"
          title="Explore India"
          subtitle="Hover over each region to discover the cultural and historical tapestry that weaves this vast nation together."
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-16 items-center">
          {/* Map */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="relative aspect-square max-w-xl mx-auto w-full"
          >
            <svg
              viewBox="0 0 600 500"
              className="w-full h-full"
              style={{ filter: "drop-shadow(0 0 40px rgba(255,153,51,0.2))" }}
            >
              <defs>
                <radialGradient id="mapBg" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(212,175,55,0.06)" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
                <filter id="regionGlow">
                  <feGaussianBlur stdDeviation="4" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <rect width="600" height="500" fill="url(#mapBg)" />

              {/* Decorative chakra watermark */}
              <g transform="translate(300, 250)" opacity="0.05">
                {Array.from({ length: 24 }).map((_, i) => {
                  const angle = (i * 360) / 24;
                  return (
                    <line
                      key={i}
                      x1="0"
                      y1="0"
                      x2={Math.cos((angle * Math.PI) / 180) * 200}
                      y2={Math.sin((angle * Math.PI) / 180) * 200}
                      stroke="#D4AF37"
                      strokeWidth="1"
                    />
                  );
                })}
                <circle cx="0" cy="0" r="200" fill="none" stroke="#D4AF37" strokeWidth="1" />
              </g>

              {REGIONS.map((region) => {
                const isActive = activeRegion?.id === region.id;
                const isHovered = hoveredRegion === region.id;
                const color = ACCENT_MAP[region.accentColor];
                return (
                  <path
                    key={region.id}
                    d={region.path}
                    fill={color}
                    fillOpacity={isActive ? 0.7 : isHovered ? 0.5 : 0.18}
                    stroke={color}
                    strokeWidth={isActive || isHovered ? 2.5 : 1.2}
                    style={{
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      filter: isActive || isHovered ? `drop-shadow(0 0 16px ${color})` : "none",
                    }}
                    onMouseEnter={() => setHoveredRegion(region.id)}
                    onMouseLeave={() => setHoveredRegion(null)}
                    onClick={() => setActiveRegion(region)}
                    aria-label={`Region: ${region.name}`}
                  />
                );
              })}

              {/* Region labels */}
              {REGIONS.map((region) => {
                const [cx, cy] = getRegionCenter(region.path);
                return (
                  <text
                    key={`label-${region.id}`}
                    x={cx}
                    y={cy}
                    textAnchor="middle"
                    className="pointer-events-none select-none"
                    fill={hoveredRegion === region.id || activeRegion?.id === region.id ? "#FFFFFF" : "rgba(255,255,255,0.6)"}
                    style={{
                      fontSize: hoveredRegion === region.id || activeRegion?.id === region.id ? "14" : "11",
                      fontWeight: 600,
                      fontFamily: "var(--font-serif)",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {region.name.split(" ")[0]}
                  </text>
                );
              })}
            </svg>
          </motion.div>

          {/* Info panel */}
          <div className="relative min-h-[400px]">
            <AnimatePresence mode="wait">
              {activeRegion ? (
                <motion.div
                  key={activeRegion.id}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.4 }}
                  className="glass-strong rounded-2xl p-6 sm:p-8 border-2"
                  style={{ borderColor: ACCENT_MAP[activeRegion.accentColor] + "60" }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-deva text-sm" style={{ color: ACCENT_MAP[activeRegion.accentColor] }}>
                        {activeRegion.devaName}
                      </p>
                      <h3 className="font-serif text-2xl font-bold text-white">
                        {activeRegion.name}
                      </h3>
                    </div>
                    <div
                      className="w-10 h-10 rounded-full"
                      style={{ background: ACCENT_MAP[activeRegion.accentColor], boxShadow: `0 0 20px ${ACCENT_MAP[activeRegion.accentColor]}` }}
                    />
                  </div>

                  <p className="text-sm text-white/80 leading-relaxed mb-4">
                    {activeRegion.info}
                  </p>

                  <div
                    className="p-4 rounded-xl"
                    style={{
                      background: ACCENT_MAP[activeRegion.accentColor] + "15",
                      border: `1px solid ${ACCENT_MAP[activeRegion.accentColor]}40`,
                    }}
                  >
                    <p className="text-xs uppercase tracking-widest text-white/50 mb-1">Did you know?</p>
                    <p className="text-sm text-white/90 italic">{activeRegion.highlight}</p>
                  </div>

                  <button
                    onClick={() => setActiveRegion(null)}
                    className="mt-6 text-xs text-white/50 hover:text-white transition-colors"
                  >
                    ← Click another region to explore
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass rounded-2xl p-8 sm:p-12 border border-gold/20 text-center h-full flex flex-col items-center justify-center"
                >
                  <div className="text-5xl mb-4">🇮🇳</div>
                  <h3 className="font-serif text-xl text-white/80 mb-2">
                    Discover Incredible India
                  </h3>
                  <p className="text-sm text-white/50 max-w-sm">
                    Hover or tap any region on the map to learn about its culture, history, and unique contribution to the Indian story.
                  </p>
                  <div className="mt-6 flex gap-3">
                    {Object.values(ACCENT_MAP).map((c) => (
                      <div key={c} className="w-3 h-3 rounded-full" style={{ background: c, boxShadow: `0 0 12px ${c}` }} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

function getRegionCenter(path: string): [number, number] {
  const nums = path.match(/-?\d+\.?\d*/g)?.map(Number) || [];
  let sumX = 0, sumY = 0, count = 0;
  for (let i = 0; i < nums.length - 1; i += 2) {
    sumX += nums[i];
    sumY += nums[i + 1];
    count++;
  }
  return count ? [sumX / count, sumY / count] : [300, 250];
}
