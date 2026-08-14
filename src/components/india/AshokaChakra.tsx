"use client";

import { motion } from "framer-motion";

interface AshokaChakraProps {
  size?: number;
  className?: string;
  spinDuration?: number;
  reverse?: boolean;
  strokeWidth?: number;
  glow?: boolean;
  /** If true, the chakra spins with framer-motion (more controllable). Otherwise pure CSS. */
  animated?: boolean;
}

/**
 * Renders a precise Ashoka Chakra (24 spokes) as an SVG.
 * Navy blue on transparent background by default.
 */
export function AshokaChakra({
  size = 200,
  className = "",
  spinDuration = 60,
  reverse = false,
  strokeWidth = 3,
  glow = false,
  animated = true,
}: AshokaChakraProps) {
  const cx = 100;
  const cy = 100;
  const radius = 80;
  const innerRadius = 12;
  const spokeCount = 24;

  const spokes = Array.from({ length: spokeCount }, (_, i) => {
    const angle = (i * 360) / spokeCount;
    return (
      <line
        key={i}
        x1={cx}
        y1={cy}
        x2={cx + radius * Math.cos((angle * Math.PI) / 180)}
        y2={cy + radius * Math.sin((angle * Math.PI) / 180)}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    );
  });

  // small rim dots between spokes for authenticity
  const rimDots = Array.from({ length: spokeCount }, (_, i) => {
    const angle = ((i + 0.5) * 360) / spokeCount;
    const r = radius - 4;
    return (
      <circle
        key={`dot-${i}`}
        cx={cx + r * Math.cos((angle * Math.PI) / 180)}
        cy={cy + r * Math.sin((angle * Math.PI) / 180)}
        r={1.4}
        fill="currentColor"
      />
    );
  });

  const svg = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={glow ? { filter: "drop-shadow(0 0 12px currentColor)" } : undefined}
      aria-hidden="true"
    >
      <g
        className={animated ? (reverse ? "animate-chakra-reverse" : "") : ""}
        style={
          animated && !reverse
            ? { animation: `chakra-spin ${spinDuration}s linear infinite`, transformOrigin: "center" }
            : animated && reverse
            ? { transformOrigin: "center" }
            : undefined
        }
      >
        {/* outer rim */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth + 1}
        />
        {/* inner hub */}
        <circle cx={cx} cy={cy} r={innerRadius} fill="currentColor" />
        <circle
          cx={cx}
          cy={cy}
          r={innerRadius + 3}
          fill="none"
          stroke="currentColor"
          strokeWidth={1}
        />
        {spokes}
        {rimDots}
      </g>
    </svg>
  );

  return svg;
}

/** A motion-enhanced chakra that fades/spins in on view */
export function MotionAshokaChakra(props: AshokaChakraProps & { delay?: number }) {
  const { delay = 0, ...rest } = props;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, rotate: -45 }}
      whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 1.4, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <AshokaChakra {...rest} />
    </motion.div>
  );
}
