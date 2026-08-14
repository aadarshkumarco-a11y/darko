"use client";

import { useState, useEffect, useCallback } from "react";
import { LoadingScreen } from "@/components/india/LoadingScreen";
import { HeroSection } from "@/components/india/HeroSection";
import { Navbar } from "@/components/india/Navbar";
import { FreedomFightersSection } from "@/components/india/FreedomFightersSection";
import { TimelineSection } from "@/components/india/TimelineSection";
import { NightBeforeFreedomSection } from "@/components/india/NightBeforeFreedomSection";
import { IndiaJourneySection } from "@/components/india/IndiaJourneySection";
import { InteractiveMapSection } from "@/components/india/InteractiveMapSection";
import { QuizSection } from "@/components/india/QuizSection";
import { FinaleSection } from "@/components/india/FinaleSection";
import { MusicController } from "@/components/india/MusicController";
import { EasterEggs } from "@/components/india/EasterEggs";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [heroEntered, setHeroEntered] = useState(false);
  const [musicOn, setMusicOn] = useState(false);

  // Lock body scroll during loading
  useEffect(() => {
    document.body.style.overflow = loading ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [loading]);

  // Register service worker for PWA
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const swCode = `
        const CACHE = 'india-i-day-2026-v1';
        self.addEventListener('install', (e) => {
          self.skipWaiting();
        });
        self.addEventListener('activate', (e) => {
          e.waitUntil(self.clients.claim());
        });
        self.addEventListener('fetch', (e) => {
          if (e.request.method !== 'GET') return;
          e.respondWith(
            caches.open(CACHE).then(async (cache) => {
              const cached = await cache.match(e.request);
              const networkFetch = fetch(e.request).then((res) => {
                if (res && res.status === 200 && res.type === 'basic') {
                  cache.put(e.request, res.clone());
                }
                return res;
              }).catch(() => cached);
              return cached || networkFetch;
            })
          );
        });
      `;
      const blob = new Blob([swCode], { type: "application/javascript" });
      const swUrl = URL.createObjectURL(blob);
      navigator.serviceWorker.register(swUrl).catch(() => {
        // SW registration failure is non-fatal
      });
    }
  }, []);

  const handleBegin = useCallback(() => {
    setHeroEntered(true);
    // Smooth scroll to freedom section
    setTimeout(() => {
      const el = document.getElementById("freedom");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 100);
    // Auto-start music on first user interaction (CTA click)
    if (!musicOn) setMusicOn(true);
  }, [musicOn]);

  const toggleMusic = useCallback(() => {
    setMusicOn((m) => !m);
  }, []);

  return (
    <main className="relative">
      {loading && <LoadingScreen onComplete={() => setLoading(false)} />}

      <MusicController musicOn={musicOn} onToggle={toggleMusic} />
      <Navbar musicOn={musicOn} onToggleMusic={toggleMusic} />
      <EasterEggs />

      <HeroSection onBegin={handleBegin} />

      <NightBeforeFreedomSection />
      <FreedomFightersSection />
      <TimelineSection />
      <IndiaJourneySection />
      <InteractiveMapSection />
      <QuizSection />
      <FinaleSection />

      {/* Footer */}
      <footer className="relative border-t border-gold/20 py-12 px-4 text-center bg-gradient-to-b from-transparent to-[#060818]">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-saffron/50" />
            <span className="text-xs uppercase tracking-[0.4em] text-gold/70">15 August 2026</span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-india-green/50" />
          </div>
          <p className="font-deva text-xl text-saffron/80 mb-2">वन्दे मातरम्</p>
          <p className="font-serif text-sm gold-text tracking-widest mb-4">VANDE MATARAM</p>
          <p className="text-xs text-white/40 max-w-md mx-auto leading-relaxed">
            A cinematic tribute to India&apos;s freedom journey — from the First War of Independence in 1857 to the world&apos;s largest democracy today.
          </p>
          <p className="mt-4 text-xs text-white/30">
            Crafted with reverence · Jai Hind 🇮🇳
          </p>
        </div>
      </footer>
    </main>
  );
}
