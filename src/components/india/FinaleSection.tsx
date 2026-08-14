"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { WavingFlag } from "./WavingFlag";
import { AshokaChakra } from "./AshokaChakra";
import { ParticleCanvas } from "./ParticleCanvas";

interface FireworkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

interface Firework {
  x: number;
  y: number;
  targetY: number;
  vy: number;
  color: string;
  exploded: boolean;
  particles: FireworkParticle[];
}

const TRICOLOR = ["#FF9933", "#FFFFFF", "#138808", "#D4AF37", "#1E3A8A"];

export function FinaleSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [showFinaleText, setShowFinaleText] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const fireworksRef = useRef<Firework[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastLaunchRef = useRef(0);

  // Trigger celebration when section enters view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !celebrate) {
          setCelebrate(true);
          setTimeout(() => setShowFinaleText(true), 1500);
        }
      },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [celebrate]);

  // Fireworks animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !celebrate) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      // Static celebratory canvas
      ctx.fillStyle = "rgba(212, 175, 55, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }

    let width = 0;
    let height = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const launchFirework = () => {
      const x = Math.random() * width * 0.8 + width * 0.1;
      const targetY = Math.random() * height * 0.4 + height * 0.1;
      fireworksRef.current.push({
        x,
        y: height,
        targetY,
        vy: -8 - Math.random() * 3,
        color: TRICOLOR[Math.floor(Math.random() * TRICOLOR.length)],
        exploded: false,
        particles: [],
      });
    };

    const explode = (fw: Firework) => {
      const count = 40 + Math.floor(Math.random() * 30);
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.2;
        const speed = 2 + Math.random() * 4;
        fw.particles.push({
          x: fw.x,
          y: fw.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: fw.color,
          life: 0,
          maxLife: 60 + Math.random() * 40,
          size: 1.5 + Math.random() * 2,
        });
      }
    };

    const draw = (timestamp: number) => {
      ctx.fillStyle = "rgba(6, 8, 24, 0.15)";
      ctx.fillRect(0, 0, width, height);

      // Launch new fireworks
      if (timestamp - lastLaunchRef.current > 600 + Math.random() * 800) {
        launchFirework();
        lastLaunchRef.current = timestamp;
      }

      // Update fireworks
      fireworksRef.current = fireworksRef.current.filter((fw) => {
        if (!fw.exploded) {
          fw.y += fw.vy;
          fw.vy += 0.15; // gravity
          if (fw.y <= fw.targetY || fw.vy >= 0) {
            fw.exploded = true;
            explode(fw);
          }
          // draw rocket trail
          ctx.fillStyle = fw.color;
          ctx.globalAlpha = 0.8;
          ctx.beginPath();
          ctx.arc(fw.x, fw.y, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
          return true;
        } else {
          // update particles
          fw.particles = fw.particles.filter((p) => {
            p.life++;
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.06; // gravity
            p.vx *= 0.99;
            p.vy *= 0.99;

            const lifeRatio = p.life / p.maxLife;
            if (lifeRatio >= 1) return false;

            ctx.globalAlpha = 1 - lifeRatio;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (1 - lifeRatio * 0.5), 0, Math.PI * 2);
            ctx.fill();

            // glow
            ctx.globalAlpha = (1 - lifeRatio) * 0.4;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
            ctx.fill();

            return true;
          });
          ctx.globalAlpha = 1;
          return fw.particles.length > 0;
        }
      });

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [celebrate]);

  const replayCelebration = () => {
    setShowFinaleText(false);
    setTimeout(() => setShowFinaleText(true), 800);
    // Trigger an extra burst
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const fake = { current: performance.now() - 10000 };
        lastLaunchRef.current = fake.current;
      }, i * 200);
    }
  };

  return (
    <section
      id="finale"
      ref={sectionRef}
      className="relative min-h-screen flex flex-col items-center justify-center py-24 px-4 sm:px-6 overflow-hidden"
    >
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 30%, rgba(212,175,55,0.2), transparent 50%), radial-gradient(circle at 20% 80%, rgba(19,136,8,0.15), transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,153,51,0.15), transparent 50%)",
        }}
      />

      {/* Fireworks canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-10"
        aria-hidden="true"
      />

      {/* Confetti particles */}
      <ParticleCanvas density={1.4} enabled={celebrate} />

      {/* Large rotating chakras background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
        <div className="text-gold">
          <AshokaChakra size={Math.min(800, typeof window !== "undefined" ? window.innerWidth : 800)} spinDuration={120} />
        </div>
      </div>

      <div className="relative z-20 text-center max-w-4xl mx-auto">
        {/* Glowing Tiranga */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex justify-center mb-12"
        >
          <div className="relative">
            <div className="absolute inset-0 blur-3xl opacity-70">
              <WavingFlag height={180} className="w-[280px] sm:w-[340px]" />
            </div>
            <WavingFlag height={180} className="w-[280px] sm:w-[340px] relative" />
          </div>
        </motion.div>

        <AnimatePresence>
          {showFinaleText && (
            <>
              <motion.p
                initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 1.2 }}
                className="font-serif text-xl sm:text-2xl md:text-3xl text-white/80 italic mb-4"
              >
                Freedom was earned through sacrifice.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 1.2, delay: 0.8 }}
                className="font-serif text-xl sm:text-2xl md:text-3xl text-white/80 italic mb-12"
              >
                Our responsibility is to carry it forward.
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.5, delay: 1.6, ease: [0.22, 1, 0.36, 1] }}
                className="font-serif text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black mb-4"
              >
                <span className="shimmer-text">JAI HIND</span>
                <span className="ml-4 text-5xl sm:text-6xl md:text-7xl">🇮🇳</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 2.4 }}
                className="font-deva text-2xl sm:text-3xl text-saffron text-glow-saffron mb-2"
              >
                जय हिन्द
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 2.8 }}
                className="text-base sm:text-lg text-white/70 tracking-widest mb-12"
              >
                Happy Independence Day — 15 August 2026
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 3.2 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={replayCelebration}
                  className="relative px-8 py-4 rounded-full overflow-hidden group"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-saffron via-white to-india-green" />
                  <span className="absolute inset-0 bg-gradient-to-r from-saffron via-white to-india-green blur-md opacity-60 group-hover:opacity-100 transition-opacity" />
                  <span className="relative text-[#060818] font-serif font-bold text-base flex items-center gap-2">
                    Celebrate Again 🇮🇳
                  </span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  className="px-8 py-4 rounded-full glass-strong border border-gold/40 text-white font-serif font-bold text-base hover:bg-white/10 transition-colors"
                >
                  ↑ Back to Start
                </motion.button>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 3.8 }}
                className="mt-16 font-deva text-sm text-white/40"
              >
                वन्दे मातरम् · सत्यमेव जयते · जय हिन्द
              </motion.p>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Floating chakras */}
      {celebrate && (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute ${i % 2 === 0 ? "text-saffron/30" : "text-india-green/30"}`}
              style={{
                left: `${10 + i * 15}%`,
                top: `${15 + (i % 3) * 25}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.2, 0.6, 0.2],
              }}
              transition={{
                duration: 4 + i,
                repeat: Infinity,
                delay: i * 0.5,
              }}
            >
              <AshokaChakra size={40 + (i % 3) * 20} spinDuration={20 + i * 5} />
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
