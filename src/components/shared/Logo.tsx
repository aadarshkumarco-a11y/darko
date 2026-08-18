"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  href?: string | null;
  className?: string;
}

const SIZES = {
  sm: { box: 28, text: "text-base" },
  md: { box: 32, text: "text-lg" },
  lg: { box: 40, text: "text-2xl" },
};

export function Logo({ size = "md", showWordmark = true, href = "/", className }: LogoProps) {
  const s = SIZES[size];

  const content = (
    <span className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <LogoMark size={s.box} />
      {showWordmark && (
        <span className={cn("font-display font-bold tracking-tight text-white", s.text)}>
          DARKO
        </span>
      )}
    </span>
  );

  if (href === null) return content;

  return (
    <Link href={href} aria-label="DARKO home" className="inline-flex">
      {content}
    </Link>
  );
}

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0"
    >
      <defs>
        <linearGradient id="darko-logo-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0A0B14" />
          <stop offset="1" stopColor="#11131F" />
        </linearGradient>
        <linearGradient id="darko-logo-accent" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#818CF8" />
          <stop offset="1" stopColor="#6366F1" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill="url(#darko-logo-bg)" />
      <rect width="512" height="512" rx="112" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
      <path
        d="M 168 144 L 168 368 L 264 368 C 332 368 376 312 376 256 C 376 200 332 144 264 144 L 168 144 Z M 216 192 L 264 192 C 304 192 328 220 328 256 C 328 292 304 320 264 320 L 216 320 L 216 192 Z"
        fill="url(#darko-logo-accent)"
      />
      <circle cx="376" cy="144" r="16" fill="#6366F1" />
      <circle cx="376" cy="144" r="32" fill="#6366F1" opacity="0.3" />
    </svg>
  );
}
