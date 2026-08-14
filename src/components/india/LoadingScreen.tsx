"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { AshokaChakra } from "./AshokaChakra";

interface LoadingScreenProps {
  onComplete: () => void;
}

/**
 * Cinematic opening loader.
 * Sequence: Ashoka Chakra spins in → "भारत" → "INDIA" → fade out.
 * ~3.5 seconds total.
 */
export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [stage, setStage] = useState<0 | 1 | 2 | 3>(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t1 = setTimeout(() => setStage(1), reduceMotion ? 200 : 800);
    const t2 = setTimeout(() => setStage(2), reduceMotion ? 400 : 1800);
    const t3 = setTimeout(() => setStage(3), reduceMotion ? 600 : 2800);
    const t4 = setTimeout(() => onComplete(), reduceMotion ? 800 : 3500);
    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {stage < 3 && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#060818]"
          exit={{ opacity: 0, transition: { duration: 0.8 } }}
        >
          {/* Background radial tricolor glow */}
          <div
            className="absolute inset-0 opacity-60"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, rgba(255,153,51,0.12), transparent 40%), radial-gradient(circle at 30% 70%, rgba(19,136,8,0.10), transparent 40%), radial-gradient(circle at 70% 30%, rgba(0,0,128,0.12), transparent 40%)",
            }}
          />

          {/* Chakra */}
          <motion.div
            className="relative text-chakra-blue-light"
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="absolute inset-0 blur-2xl opacity-50">
              <AshokaChakra size={200} spinDuration={8} glow />
            </div>
            <AshokaChakra size={200} spinDuration={8} glow />
          </motion.div>

          {/* Text */}
          <div className="mt-10 h-20 flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              {stage === 1 && (
                <motion.div
                  key="deva"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.6 }}
                  className="font-deva text-5xl text-white text-glow-saffron"
                >
                  भारत
                </motion.div>
              )}
              {stage === 2 && (
                <motion.div
                  key="eng"
                  initial={{ opacity: 0, y: 10, letterSpacing: "0.5em" }}
                  animate={{ opacity: 1, y: 0, letterSpacing: "0.3em" }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.6 }}
                  className="font-serif text-5xl font-bold gold-text"
                >
                  INDIA
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-20 w-48 h-[2px] bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-saffron via-white to-india-green"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 3.4, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
