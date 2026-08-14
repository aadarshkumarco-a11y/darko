"use client";

import { useEffect, useRef } from "react";

interface WavingFlagProps {
  className?: string;
  /** "full" = pole + flag, "flag" = just the flag */
  variant?: "full" | "flag";
  height?: number;
  /** Wind strength — higher = more dramatic flutter */
  wind?: "gentle" | "medium" | "strong";
}

/**
 * Cinematic waving Indian flag.
 *
 * Animation is driven by requestAnimationFrame, computing the wave path
 * every frame using sine functions. Amplitude grows from 0 at the pole
 * (left edge) to maximum at the fly end (right edge) — mimicking real
 * cloth physics where the fixed edge stays still and the free edge flutters.
 *
 * Features:
 *  - Multi-harmonic wave (primary + ripple) for realistic cloth motion
 *  - Traveling cloth-fold shading bands
 *  - Chakra bobs vertically with the wave and rotates slowly
 *  - Subtle 3D perspective tilt on the whole flag
 *  - Pole with golden finial (full variant)
 */
export function WavingFlag({
  className = "",
  variant = "full",
  height = 240,
  wind = "medium",
}: WavingFlagProps) {
  const saffronRef = useRef<SVGPathElement>(null);
  const whiteRef = useRef<SVGPathElement>(null);
  const greenRef = useRef<SVGPathElement>(null);
  const shadeSaffronRef = useRef<SVGPathElement>(null);
  const shadeWhiteRef = useRef<SVGPathElement>(null);
  const shadeGreenRef = useRef<SVGPathElement>(null);
  const highlightSaffronRef = useRef<SVGPathElement>(null);
  const highlightWhiteRef = useRef<SVGPathElement>(null);
  const highlightGreenRef = useRef<SVGPathElement>(null);
  const chakraGroupRef = useRef<SVGGElement>(null);
  const chakraSpinRef = useRef<SVGGElement>(null);
  const gradientRef = useRef<SVGLinearGradientElement>(null);

  const W = 360;
  const H = 240;
  const STRIPE_H = 80;
  const SEGMENTS = 36;

  // Wind parameters
  const windParams = {
    gentle: { amp: 9, freq: 3.4, rippleAmp: 0.22, rippleFreq: 7.5, speed: 1.4, tilt: 3 },
    medium: { amp: 14, freq: 4.0, rippleAmp: 0.30, rippleFreq: 8.5, speed: 2.0, tilt: 5 },
    strong: { amp: 20, freq: 4.6, rippleAmp: 0.40, rippleFreq: 10.0, speed: 2.8, tilt: 7 },
  }[wind];

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      // Render static wave shape
      const t = 0;
      if (saffronRef.current) saffronRef.current.setAttribute("d", buildStripePath(t, 0, STRIPE_H));
      if (whiteRef.current) whiteRef.current.setAttribute("d", buildStripePath(t, STRIPE_H, STRIPE_H * 2));
      if (greenRef.current) greenRef.current.setAttribute("d", buildStripePath(t, STRIPE_H * 2, STRIPE_H * 3));
      if (shadeSaffronRef.current) shadeSaffronRef.current.setAttribute("d", buildStripePath(t, 0, STRIPE_H));
      if (shadeWhiteRef.current) shadeWhiteRef.current.setAttribute("d", buildStripePath(t, STRIPE_H, STRIPE_H * 2));
      if (shadeGreenRef.current) shadeGreenRef.current.setAttribute("d", buildStripePath(t, STRIPE_H * 2, STRIPE_H * 3));
      if (highlightSaffronRef.current) highlightSaffronRef.current.setAttribute("d", buildStripePath(t, 0, STRIPE_H));
      if (highlightWhiteRef.current) highlightWhiteRef.current.setAttribute("d", buildStripePath(t, STRIPE_H, STRIPE_H * 2));
      if (highlightGreenRef.current) highlightGreenRef.current.setAttribute("d", buildStripePath(t, STRIPE_H * 2, STRIPE_H * 3));
      return;
    }

    let raf: number;
    const startTime = performance.now();

    function waveOffset(x: number, t: number): number {
      // Amplitude grows linearly from 0 at pole (x=0) to max at fly end (x=W)
      const amp = (x / W) * windParams.amp;
      // Primary traveling wave
      const primary = Math.sin((x / W) * Math.PI * windParams.freq + t * windParams.speed) * amp;
      // Secondary ripple — higher freq, smaller amp, gives cloth texture
      const ripple =
        Math.sin((x / W) * Math.PI * windParams.rippleFreq + t * windParams.speed * 1.4) *
        amp *
        windParams.rippleAmp;
      // Tertiary micro-ripple for fine cloth vibration
      const micro = Math.sin((x / W) * Math.PI * 14 + t * windParams.speed * 1.8) * amp * 0.08;
      return primary + ripple + micro;
    }

    function waveY(x: number, t: number, baseY: number): number {
      return baseY + waveOffset(x, t);
    }

    function buildStripePath(t: number, topBase: number, bottomBase: number): string {
      let d = `M 0 ${waveY(0, t, topBase)}`;
      for (let i = 1; i <= SEGMENTS; i++) {
        const x = (i / SEGMENTS) * W;
        d += ` L ${x.toFixed(2)} ${waveY(x, t, topBase).toFixed(2)}`;
      }
      for (let i = SEGMENTS; i >= 0; i--) {
        const x = (i / SEGMENTS) * W;
        d += ` L ${x.toFixed(2)} ${waveY(x, t, bottomBase).toFixed(2)}`;
      }
      d += " Z";
      return d;
    }

    const animate = (now: number) => {
      const t = (now - startTime) / 1000;

      const saffronD = buildStripePath(t, 0, STRIPE_H);
      const whiteD = buildStripePath(t, STRIPE_H, STRIPE_H * 2);
      const greenD = buildStripePath(t, STRIPE_H * 2, STRIPE_H * 3);

      if (saffronRef.current) saffronRef.current.setAttribute("d", saffronD);
      if (whiteRef.current) whiteRef.current.setAttribute("d", whiteD);
      if (greenRef.current) greenRef.current.setAttribute("d", greenD);

      // Shade overlays use the same path as their stripe
      if (shadeSaffronRef.current) shadeSaffronRef.current.setAttribute("d", saffronD);
      if (shadeWhiteRef.current) shadeWhiteRef.current.setAttribute("d", whiteD);
      if (shadeGreenRef.current) shadeGreenRef.current.setAttribute("d", greenD);
      if (highlightSaffronRef.current) highlightSaffronRef.current.setAttribute("d", saffronD);
      if (highlightWhiteRef.current) highlightWhiteRef.current.setAttribute("d", whiteD);
      if (highlightGreenRef.current) highlightGreenRef.current.setAttribute("d", greenD);

      // Chakra: bobs vertically with the wave at its X position
      if (chakraGroupRef.current) {
        const chakraX = variant === "full" ? 95 : 90;
        const yOffset = waveOffset(chakraX, t);
        // Slight horizontal jiggle too
        const xOffset = Math.sin(t * windParams.speed * 0.6) * 1.5;
        chakraGroupRef.current.setAttribute(
          "transform",
          `translate(${(chakraX + xOffset).toFixed(2)}, ${(120 + yOffset).toFixed(2)})`
        );
      }

      // Chakra slow spin
      if (chakraSpinRef.current) {
        const angle = (t * 12) % 360;
        chakraSpinRef.current.setAttribute("transform", `rotate(${angle.toFixed(2)})`);
      }

      // Animate the cloth-fold gradient horizontally — traveling dark bands
      if (gradientRef.current) {
        const phase = (t * windParams.speed * 18) % 100;
        gradientRef.current.setAttribute(
          "gradientTransform",
          `translate(${phase.toFixed(2)} 0)`
        );
      }

      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [variant, windParams.amp, windParams.freq, windParams.rippleAmp, windParams.rippleFreq, windParams.speed, STRIPE_H]);

  return (
    <div
      className={`relative ${className}`}
      style={{
        height,
        perspective: "1200px",
        perspectiveOrigin: "left center",
      }}
      aria-label="Indian flag waving in the wind"
    >
      <svg
        viewBox={`-20 -30 ${W + 40} ${H + 60}`}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        style={{
          filter: "drop-shadow(0 18px 28px rgba(0,0,0,0.55))",
          transform: `rotateY(-${windParams.tilt}deg)`,
          transformOrigin: "left center",
          transformStyle: "preserve-3d",
        }}
      >
        <defs>
          <linearGradient id="wf-saffron" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFB366" />
            <stop offset="50%" stopColor="#FF9933" />
            <stop offset="100%" stopColor="#E87722" />
          </linearGradient>
          <linearGradient id="wf-white" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F0F0F0" />
          </linearGradient>
          <linearGradient id="wf-green" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2BCB12" />
            <stop offset="50%" stopColor="#138808" />
            <stop offset="100%" stopColor="#0B5C05" />
          </linearGradient>
          <linearGradient id="wf-pole" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2a1a0a" />
            <stop offset="40%" stopColor="#8a6a4a" />
            <stop offset="55%" stopColor="#a98a6a" />
            <stop offset="100%" stopColor="#2a1a0a" />
          </linearGradient>
          <radialGradient id="wf-finial" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#FFF6C9" />
            <stop offset="40%" stopColor="#F5D67A" />
            <stop offset="100%" stopColor="#8a6a1a" />
          </radialGradient>

          {/* Traveling cloth-fold shading: alternating dark bands */}
          <linearGradient
            ref={gradientRef}
            id="wf-cloth-shade"
            x1="0"
            y1="0"
            x2="1"
            y2="0"
            gradientUnits="userSpaceOnUse"
            spreadMethod="repeat"
          >
            <stop offset="0%" stopColor="rgba(0,0,0,0)" />
            <stop offset="8%" stopColor="rgba(0,0,0,0.28)" />
            <stop offset="16%" stopColor="rgba(0,0,0,0)" />
            <stop offset="30%" stopColor="rgba(255,255,255,0.06)" />
            <stop offset="42%" stopColor="rgba(0,0,0,0)" />
            <stop offset="55%" stopColor="rgba(0,0,0,0.22)" />
            <stop offset="68%" stopColor="rgba(0,0,0,0)" />
            <stop offset="82%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>

          {/* Highlight gradient for the upper edge of each fold */}
          <linearGradient id="wf-cloth-highlight" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="20%" stopColor="rgba(255,255,255,0.18)" />
            <stop offset="40%" stopColor="rgba(255,255,255,0)" />
            <stop offset="60%" stopColor="rgba(255,255,255,0.12)" />
            <stop offset="80%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>

        {/* Pole */}
        {variant === "full" && (
          <>
            <rect x="0" y="-30" width="7" height={H + 70} fill="url(#wf-pole)" rx="2" />
            {/* Golden finial (ball on top) */}
            <circle cx="3.5" cy="-25" r="9" fill="url(#wf-finial)" />
            <circle cx="3.5" cy="-25" r="9" fill="none" stroke="#8a6a1a" strokeWidth="0.5" />
            {/* Small spike on top of finial */}
            <path d={`M 3.5 -34 L 1.5 -28 L 5.5 -28 Z`} fill="#D4AF37" />
            {/* Rope/cord attaching flag to pole */}
            <path
              d={`M 3.5 5 Q 8 4 12 5 M 3.5 75 Q 8 76 12 75 M 3.5 155 Q 8 154 12 155 M 3.5 225 Q 8 226 12 225`}
              stroke="#8a6a4a"
              strokeWidth="0.8"
              fill="none"
              opacity="0.6"
            />
          </>
        )}

        {/* Saffron stripe */}
        <path ref={saffronRef} d="" fill="url(#wf-saffron)" />
        {/* White stripe */}
        <path ref={whiteRef} d="" fill="url(#wf-white)" />
        {/* Green stripe */}
        <path ref={greenRef} d="" fill="url(#wf-green)" />

        {/* Cloth shading overlay (traveling folds) */}
        <path ref={shadeSaffronRef} d="" fill="url(#wf-cloth-shade)" />
        <path ref={shadeWhiteRef} d="" fill="url(#wf-cloth-shade)" />
        <path ref={shadeGreenRef} d="" fill="url(#wf-cloth-shade)" />

        {/* Subtle highlight on top edges of folds */}
        <path
          ref={highlightSaffronRef}
          d=""
          fill="url(#wf-cloth-highlight)"
          opacity="0.6"
        />
        <path
          ref={highlightWhiteRef}
          d=""
          fill="url(#wf-cloth-highlight)"
          opacity="0.6"
        />
        <path
          ref={highlightGreenRef}
          d=""
          fill="url(#wf-cloth-highlight)"
          opacity="0.6"
        />

        {/* Ashoka Chakra — bobs with the wave + slow spin */}
        <g ref={chakraGroupRef} transform="translate(95, 120)">
          <g ref={chakraSpinRef}>
            <ChakraInline />
          </g>
        </g>

        {/* Fly-edge shadow (right edge is darker, catches less light) */}
        <path
          d={`M ${W - 30} 0 L ${W} 0 L ${W} ${H} L ${W - 30} ${H} Z`}
          fill="url(#wf-fly-shadow)"
          opacity="0.4"
          pointerEvents="none"
        />
        <defs>
          <linearGradient id="wf-fly-shadow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.5)" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function ChakraInline() {
  const r = 24;
  const spokes = Array.from({ length: 24 }, (_, i) => {
    const angle = (i * 360) / 24;
    return (
      <line
        key={i}
        x1="0"
        y1="0"
        x2={r * Math.cos((angle * Math.PI) / 180)}
        y2={r * Math.sin((angle * Math.PI) / 180)}
        stroke="#000080"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    );
  });
  return (
    <g>
      <circle cx="0" cy="0" r={r} fill="none" stroke="#000080" strokeWidth="1.8" />
      <circle cx="0" cy="0" r={r + 1} fill="none" stroke="rgba(0,0,128,0.3)" strokeWidth="0.5" />
      <circle cx="0" cy="0" r="3.5" fill="#000080" />
      {spokes}
    </g>
  );
}
