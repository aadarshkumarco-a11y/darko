export const siteConfig = {
  name: "DARKO",
  tagline: "Virtual hangouts for everyone",
  description:
    "Create a room, share one link, and everything you need for a digital hangout is inside — watch together, voice/video chat, play games, share files.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL ?? "",
  ogImage: "/og.png",
  links: {
    twitter: "https://twitter.com",
    github: "https://github.com",
    discord: "https://discord.gg",
  },
  nav: [
    { label: "Features", href: "/features" },
    { label: "Games", href: "/games" },
    { label: "Watch", href: "/watch" },
    { label: "About", href: "/about" },
  ],
  footer: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Safety", href: "/safety" },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
