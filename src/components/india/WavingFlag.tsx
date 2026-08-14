"use client";

import { motion } from "framer-motion";

interface WavingFlagProps {
  className?: string;
  /** "full" = pole + flag, "flag" = just the flag */
  variant?: "full" | "flag";
  height?: number;
}

/**
 * A stylized waving Indian flag built with SVG + framer-motion.
 * The wave is produced by animating path d attributes between sine offsets.
 * Uses three horizontal stripes (saffron, white, green) and a small Ashoka Chakra.
 */
export function WavingFlag({ className = "", variant = "full", height = 240 }: WavingFlagProps) {
  const w = 360;
  const h = 240;
  const stripeH = h / 3;

  // We define 5 wave keyframes (3 control points along x)
  const wavePaths = [
    // Saffron stripe
    "M0,0 L360,0 L360,80 L0,80 Z",
    "M0,0 L360,0 L355,80 L5,80 Z",
    "M0,0 L360,0 L350,80 L10,80 Z",
    "M0,0 L360,0 L355,80 L5,80 Z",
  ];

  return (
    <div className={`relative ${className}`} style={{ height }} aria-label="Indian flag waving">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        style={{ filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.5))" }}
      >
        <defs>
          <linearGradient id="saffronGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFB366" />
            <stop offset="50%" stopColor="#FF9933" />
            <stop offset="100%" stopColor="#E87722" />
          </linearGradient>
          <linearGradient id="whiteGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F0F0F0" />
          </linearGradient>
          <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2BCB12" />
            <stop offset="50%" stopColor="#138808" />
            <stop offset="100%" stopColor="#0B5C05" />
          </linearGradient>
          <linearGradient id="poleGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3a2a1a" />
            <stop offset="50%" stopColor="#7a5a3a" />
            <stop offset="100%" stopColor="#3a2a1a" />
          </linearGradient>
          {/* subtle shading overlay to simulate cloth folds */}
          <linearGradient id="clothShade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(0,0,0,0)" />
            <stop offset="30%" stopColor="rgba(0,0,0,0.15)" />
            <stop offset="60%" stopColor="rgba(0,0,0,0)" />
            <stop offset="85%" stopColor="rgba(0,0,0,0.18)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>
        </defs>

        {variant === "full" && (
          <>
            {/* pole */}
            <rect x="0" y="-20" width="6" height={h + 40} fill="url(#poleGrad)" rx="2" />
            <circle cx="3" cy="-20" r="6" fill="#D4AF37" />
          </>
        )}

        {/* Saffron stripe */}
        <motion.path
          d={wavePaths[0]}
          fill="url(#saffronGrad)"
          animate={{ d: wavePaths }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        {/* White stripe with chakra */}
        <motion.path
          d={wavePaths[0].replace(/80/g, "160").replace(/0,/g, "80,")}
          fill="url(#whiteGrad)"
          animate={{
            d: wavePaths.map((p) => p.replace(/80/g, "160").replace(/0,/g, "80,")),
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Green stripe */}
        <motion.path
          d={wavePaths[0].replace(/80/g, "240").replace(/0,/g, "160,")}
          fill="url(#greenGrad)"
          animate={{
            d: wavePaths.map((p) => p.replace(/80/g, "240").replace(/0,/g, "160,")),
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Cloth shading overlay */}
        <motion.path
          d={wavePaths[0]}
          fill="url(#clothShade)"
          animate={{ d: wavePaths }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.path
          d={wavePaths[0].replace(/80/g, "160").replace(/0,/g, "80,")}
          fill="url(#clothShade)"
          animate={{
            d: wavePaths.map((p) => p.replace(/80/g, "160").replace(/0,/g, "80,")),
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.path
          d={wavePaths[0].replace(/80/g, "240").replace(/0,/g, "160,")}
          fill="url(#clothShade)"
          animate={{
            d: wavePaths.map((p) => p.replace(/80/g, "240").replace(/0,/g, "160,")),
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Ashoka Chakra in the white stripe */}
        <motion.g
          animate={{ x: [0, -5, 0, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <g transform={`translate(${variant === "full" ? 90 : 85}, 120)`}>
            <AshokaChakraInline />
          </g>
        </motion.g>
      </svg>
    </div>
  );
}

function AshokaChakraInline() {
  const cx = 0;
  const cy = 0;
  const r = 22;
  const spokes = Array.from({ length: 24 }, (_, i) => {
    const angle = (i * 360) / 24;
    return (
      <line
        key={i}
        x1={cx}
        y1={cy}
        x2={cx + r * Math.cos((angle * Math.PI) / 180)}
        y2={cy + r * Math.sin((angle * Math.PI) / 180)}
        stroke="#000080"
        strokeWidth={1.2}
      />
    );
  });
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#000080" strokeWidth={1.6} />
      <circle cx={cx} cy={cy} r={3} fill="#000080" />
      {spokes}
    </g>
  );
}
