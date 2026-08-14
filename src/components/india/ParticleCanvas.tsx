"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  twinkle: number;
}

interface ParticleCanvasProps {
  /** Density multiplier — lower = fewer particles for perf */
  density?: number;
  /** Class for sizing/positioning */
  className?: string;
  /** Whether to render particles (respects reduced motion) */
  enabled?: boolean;
}

const COLORS = ["#FF9933", "#FFFFFF", "#138808", "#D4AF37", "#1E3A8A"];

/**
 * Lightweight canvas particle field with tricolor particles.
 * Respects prefers-reduced-motion by rendering a static field.
 */
export function ParticleCanvas({ density = 1, className = "", enabled = true }: ParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let particles: Particle[] = [];
    let width = 0;
    let height = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const parent = canvas.parentElement;
      width = parent?.clientWidth ?? window.innerWidth;
      height = parent?.clientHeight ?? window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const baseCount = Math.floor((width * height) / 18000) * density;
      const count = Math.min(Math.max(baseCount, 18), 110);
      particles = Array.from({ length: count }, () => createParticle());
    };

    const createParticle = (): Particle => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: -(Math.random() * 0.4 + 0.1),
      size: Math.random() * 2.4 + 0.6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: Math.random() * 0.5 + 0.25,
      twinkle: Math.random() * Math.PI * 2,
    });

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.twinkle += 0.02;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const twinkleAlpha = (Math.sin(p.twinkle) * 0.3 + 0.7) * p.alpha;
        ctx.globalAlpha = twinkleAlpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // soft glow
        ctx.globalAlpha = twinkleAlpha * 0.3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(draw);
    };

    const drawStatic = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    resize();
    window.addEventListener("resize", resize);

    if (reduceMotion) {
      drawStatic();
    } else {
      rafRef.current = requestAnimationFrame(draw);
    }

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [density, enabled]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 ${className}`}
      aria-hidden="true"
    />
  );
}
