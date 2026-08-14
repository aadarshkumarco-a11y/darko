"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AshokaChakra } from "./AshokaChakra";

const HIDDEN_QUOTES = [
  "वन्दे मातरम् — I bow to thee, Mother.",
  "Swaraj is my birthright, and I shall have it! — Bal Gangadhar Tilak",
  "Arise, awake, and stop not till the goal is reached. — Swami Vivekananda",
  "Sarve bhavantu sukhinah — May all beings be happy.",
  "Satyameva Jayate — Truth alone triumphs.",
];

/**
 * Easter eggs:
 * 1. Konami code (↑↑↓↓←→←→BA) triggers a celebration
 * 2. Clicking the navbar chakra 7 times reveals a hidden quote
 * 3. Typing "jaihind" anywhere triggers fireworks
 * 4. Triple-click on the page title reveals Vande Mataram
 */
export function EasterEggs() {
  const [showQuote, setShowQuote] = useState(false);
  const [quote, setQuote] = useState("");
  const [showSecretCelebration, setShowSecretCelebration] = useState(false);
  const sequenceRef = useRef<string[]>([]);
  const keySequenceRef = useRef<string>("");

  useEffect(() => {
    let clickCount = 0;
    let clickTimer: number | null = null;

    const handleKeydown = (e: KeyboardEvent) => {
      // Konami code
      const konami = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
      sequenceRef.current.push(e.key);
      if (sequenceRef.current.length > konami.length) sequenceRef.current.shift();
      if (sequenceRef.current.join(",") === konami.join(",")) {
        triggerCelebration();
        sequenceRef.current = [];
      }

      // Type "jaihind"
      keySequenceRef.current += e.key.toLowerCase();
      if (keySequenceRef.current.length > 7) keySequenceRef.current = keySequenceRef.current.slice(-7);
      if (keySequenceRef.current === "jaihind") {
        triggerCelebration();
        keySequenceRef.current = "";
      }
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Triple-click on h1 or h2 reveals quote
      if (target.tagName === "H1" || target.tagName === "H2") {
        clickCount++;
        if (clickTimer) clearTimeout(clickTimer);
        clickTimer = window.setTimeout(() => { clickCount = 0; }, 600);
        if (clickCount >= 3) {
          revealQuote();
          clickCount = 0;
        }
      }
    };

    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("click", handleClick);
    };
  }, []);

  const revealQuote = () => {
    setQuote(HIDDEN_QUOTES[Math.floor(Math.random() * HIDDEN_QUOTES.length)]);
    setShowQuote(true);
    setTimeout(() => setShowQuote(false), 5000);
  };

  const triggerCelebration = () => {
    setShowSecretCelebration(true);
    setTimeout(() => setShowSecretCelebration(false), 4000);
  };

  return (
    <>
      <AnimatePresence>
        {showQuote && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 50, x: "-50%" }}
            className="fixed bottom-8 left-1/2 z-[90] px-6 py-4 rounded-2xl glass-strong border border-gold/40 max-w-md text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-2 text-gold">
              <AshokaChakra size={20} spinDuration={12} />
              <span className="text-xs uppercase tracking-widest">Hidden Treasure</span>
              <AshokaChakra size={20} spinDuration={12} reverse />
            </div>
            <p className="font-serif italic text-white text-sm leading-relaxed">
              {quote}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSecretCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[95] pointer-events-none flex items-center justify-center"
          >
            {/* Tricolor burst */}
            <motion.div
              initial={{ scale: 0, rotate: 0 }}
              animate={{ scale: [0, 2, 4], rotate: 360, opacity: [1, 0.8, 0] }}
              transition={{ duration: 4, ease: "easeOut" }}
              className="absolute"
            >
              <div className="text-gold">
                <AshokaChakra size={300} glow />
              </div>
            </motion.div>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative text-center"
            >
              <p className="font-deva text-4xl text-saffron text-glow-saffron mb-2">जय हिन्द</p>
              <p className="font-serif text-6xl font-black shimmer-text">JAI HIND</p>
              <p className="font-serif text-sm text-white/70 tracking-widest mt-3">
                You found a secret celebration 🇮🇳
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
