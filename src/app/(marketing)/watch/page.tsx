import { Navbar } from "@/components/darko/layout/Navbar";
import { Footer } from "@/components/darko/layout/Footer";
import { CTASection } from "@/components/darko/landing/CTASection";
import { Play, Youtube, FileVideo, Monitor, Shield } from "lucide-react";

export const metadata = { title: "Watch party" };

const SOURCES = [
  { icon: Youtube, name: "YouTube", status: "Phase 4", desc: "Sync any public YouTube video. ToS-compliant IFrame API." },
  { icon: FileVideo, name: "Direct video URLs", status: "Phase 4", desc: "MP4/WebM with CORS-permitting headers." },
  { icon: Monitor, name: "Screen share", status: "Phase 3", desc: "Watch anything on your screen — DRM-protected services included (each viewer needs their own subscription)." },
];

export default function WatchPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="relative pt-32 pb-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs font-medium text-secondary mb-4">
              <Play className="h-3 w-3" />
              Coming in Phase 4
            </div>
            <h1 className="font-display text-5xl sm:text-6xl font-bold tracking-tight text-white">
              Watch <span className="text-gradient-accent">together.</span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-secondary max-w-2xl mx-auto">
              Sub-second drift correction. Host controls playback. Anyone can suggest. Add to a shared playlist.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {SOURCES.map((s) => (
              <div key={s.name} className="surface-card p-6">
                <s.icon className="h-8 w-8 text-primary mb-3" />
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-display font-semibold text-white">{s.name}</h3>
                  <span className="text-[10px] uppercase tracking-widest text-muted">{s.status}</span>
                </div>
                <p className="text-sm text-secondary">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="p-5 rounded-lg bg-elevated/50 border border-border-subtle">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-white mb-1 text-sm">DRM-protected content (Netflix, Prime, Disney+, HBO)</h4>
                <p className="text-xs text-muted leading-relaxed">
                  DARKO never bypasses DRM, never proxies protected streams, and never redistributes copyrighted content.
                  For these services, use screen-share — and each viewer needs their own subscription.
                  We sync what&apos;s on your screen, not what&apos;s behind a paywall.
                </p>
              </div>
            </div>
          </div>
        </div>
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
