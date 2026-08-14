import type { Metadata, Viewport } from "next";
import { Inter, Cinzel, Tiro_Devanagari_Hindi } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const tiroDeva = Tiro_Devanagari_Hindi({
  variable: "--font-tiro",
  subsets: ["devanagari"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Independence Day 2026 — India | Freedom, Pride & Progress",
  description:
    "A cinematic digital celebration of India's independence — 15 August 2026. Journey from sacrifice to freedom, from freedom to progress. Jai Hind.",
  keywords: [
    "India Independence Day",
    "15 August 2026",
    "Indian Freedom Struggle",
    "Tiranga",
    "Ashoka Chakra",
    "Jai Hind",
    "Freedom Fighters",
  ],
  authors: [{ name: "Bharat" }],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icon.svg" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "India 2026",
  },
  openGraph: {
    title: "Independence Day 2026 — India 🇮🇳",
    description:
      "A cinematic digital celebration of India's independence — Freedom, Pride & Progress.",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Independence Day 2026 — India",
    description: "A cinematic digital celebration of India's independence.",
  },
};

export const viewport: Viewport = {
  themeColor: "#000080",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${cinzel.variable} ${tiroDeva.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
