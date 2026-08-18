import { Navbar } from "@/components/darko/layout/Navbar";
import { Footer } from "@/components/darko/layout/Footer";
import { CTASection } from "@/components/darko/landing/CTASection";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="relative pt-32 pb-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h1 className="font-display text-5xl sm:text-6xl font-bold tracking-tight text-white mb-6">
            About <span className="text-gradient-accent">DARKO</span>
          </h1>

          <div className="prose prose-invert max-w-none space-y-6 text-secondary">
            <p className="text-lg leading-relaxed">
              DARKO is a browser-first virtual hangout platform. The goal is simple: create a room, share one link, and have everything you need for a digital hangout inside — no app installs, no mandatory accounts, no friction.
            </p>

            <p className="leading-relaxed">
              We were tired of juggling Discord for voice, Twitch for watch parties, Google Drive for file sharing, and three browser tabs for games. So we built DARKO to put all of that inside a single shared space — one that feels like a real virtual room, not a dashboard.
            </p>

            <h2 className="font-display text-2xl font-bold text-white pt-4">Principles</h2>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <span className="text-primary">✦</span>
                <span><strong className="text-white">Guest-first.</strong> Friends join with one click. Google login is optional, for those who want persistence.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">✦</span>
                <span><strong className="text-white">₹0 infrastructure.</strong> Browser-native WebRTC, free-tier hosting, no paid APIs for the core MVP.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">✦</span>
                <span><strong className="text-white">Honest about limits.</strong> P2P mesh supports ~6 voice/video participants. We don&apos;t pretend otherwise.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">✦</span>
                <span><strong className="text-white">No DRM bypass.</strong> For Netflix/Prime/etc., screen-share workflow only. Each viewer needs their own subscription.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">✦</span>
                <span><strong className="text-white">Original.</strong> DARKO has its own visual identity, architecture, and code. Not a clone of anything.</span>
              </li>
            </ul>

            <h2 className="font-display text-2xl font-bold text-white pt-4">Tech stack</h2>
            <p className="leading-relaxed">
              Next.js 16 + TypeScript strict, Tailwind CSS 4, Framer Motion, Socket.IO, WebRTC, Prisma, NextAuth. All open-source. All browser-native. No paid SDKs.
            </p>

            <h2 className="font-display text-2xl font-bold text-white pt-4">Roadmap</h2>
            <p className="leading-relaxed">
              Phase 1 (Foundation) is live now — landing page, auth, rooms, join flow. Phase 2 adds realtime (presence + chat). Phase 3 brings WebRTC voice/video. Phase 4 lands the watch party. Phase 5 ships multiplayer games. Phases 6–8 round out file sharing, public lobby, moderation, and PWA polish. See <code className="text-primary">docs/ARCHITECTURE.md</code> for the full plan.
            </p>
          </div>
        </div>
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
