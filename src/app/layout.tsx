import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "DARKO — Virtual hangouts for everyone",
    template: "%s · DARKO",
  },
  description:
    "Create a room, share one link, and everything you need for a digital hangout is inside — watch together, voice/video chat, play games, share files. No app install, no mandatory account.",
  keywords: [
    "virtual hangout",
    "watch party",
    "voice chat",
    "video chat",
    "screen share",
    "play games online",
    "DARKO",
  ],
  authors: [{ name: "DARKO" }],
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DARKO",
  },
  openGraph: {
    title: "DARKO — Virtual hangouts for everyone",
    description:
      "Create a room, share one link. Watch together, talk, play games, share files. No app install, no mandatory account.",
    type: "website",
    siteName: "DARKO",
  },
  twitter: {
    card: "summary_large_image",
    title: "DARKO — Virtual hangouts",
    description: "Create a room, share one link. Everything for a digital hangout, inside.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0B14",
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
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
