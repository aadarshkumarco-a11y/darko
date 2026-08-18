export interface RoomTheme {
  id: string;
  name: string;
  description: string;
  accent: string;
  accentHover: string;
  glow: string;
  bgGradient: string;
  preview: string; // CSS background for theme picker
}

/**
 * DARKO's 7 original room themes.
 * Each theme is a curated palette — not a Tailwind hue rotate.
 */
export const ROOM_THEMES: RoomTheme[] = [
  {
    id: "midnight-lounge",
    name: "Midnight Lounge",
    description: "Deep navy with indigo glow. The default DARKO mood.",
    accent: "#6366F1",
    accentHover: "#5558E0",
    glow: "rgba(99, 102, 241, 0.35)",
    bgGradient: "linear-gradient(135deg, #0A0B14 0%, #11131F 50%, #0A0B14 100%)",
    preview: "linear-gradient(135deg, #0A0B14, #6366F1)",
  },
  {
    id: "neon-arcade",
    name: "Neon Arcade",
    description: "Pure black with electric magenta and cyan. 80s synthwave energy.",
    accent: "#EC4899",
    accentHover: "#DB2777",
    glow: "rgba(236, 72, 153, 0.4)",
    bgGradient: "linear-gradient(135deg, #000000 0%, #0F0A14 50%, #000000 100%)",
    preview: "linear-gradient(135deg, #000, #EC4899, #06B6D4)",
  },
  {
    id: "cozy-cinema",
    name: "Cozy Cinema",
    description: "Warm dark brown with amber accents. Like a private screening room.",
    accent: "#F59E0B",
    accentHover: "#D97706",
    glow: "rgba(245, 158, 11, 0.35)",
    bgGradient: "linear-gradient(135deg, #1A1308 0%, #241A0E 50%, #1A1308 100%)",
    preview: "linear-gradient(135deg, #1A1308, #F59E0B)",
  },
  {
    id: "cyber-loft",
    name: "Cyber Loft",
    description: "Graphite with electric green. Hacker-energy, productivity focus.",
    accent: "#10B981",
    accentHover: "#059669",
    glow: "rgba(16, 185, 129, 0.35)",
    bgGradient: "linear-gradient(135deg, #0A0F0D 0%, #111815 50%, #0A0F0D 100%)",
    preview: "linear-gradient(135deg, #0A0F0D, #10B981)",
  },
  {
    id: "space-station",
    name: "Space Station",
    description: "Near-black with cold blue. Quiet, clinical, weightless.",
    accent: "#3B82F6",
    accentHover: "#2563EB",
    glow: "rgba(59, 130, 246, 0.4)",
    bgGradient: "linear-gradient(135deg, #050810 0%, #0A0F1A 50%, #050810 100%)",
    preview: "linear-gradient(135deg, #050810, #3B82F6)",
  },
  {
    id: "sunset-drive-in",
    name: "Sunset Drive-In",
    description: "Deep purple with warm orange. Endless summer evening.",
    accent: "#F97316",
    accentHover: "#EA580C",
    glow: "rgba(249, 115, 22, 0.35)",
    bgGradient: "linear-gradient(135deg, #1A0A1A 0%, #2A1438 50%, #1A0A1A 100%)",
    preview: "linear-gradient(135deg, #1A0A1A, #F97316)",
  },
  {
    id: "minimal-studio",
    name: "Minimal Studio",
    description: "Pure neutral gray with white accents. Quiet, focused, designer-grade.",
    accent: "#E5E7EB",
    accentHover: "#D1D5DB",
    glow: "rgba(229, 231, 235, 0.2)",
    bgGradient: "linear-gradient(135deg, #0F0F0F 0%, #181818 50%, #0F0F0F 100%)",
    preview: "linear-gradient(135deg, #0F0F0F, #E5E7EB)",
  },
];

export const DEFAULT_THEME = ROOM_THEMES[0];

export function getTheme(themeId: string | null | undefined): RoomTheme {
  return ROOM_THEMES.find((t) => t.id === themeId) ?? DEFAULT_THEME;
}
