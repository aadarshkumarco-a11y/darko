import { Navbar } from "@/components/darko/layout/Navbar";
import { Footer } from "@/components/darko/layout/Footer";
import { CTASection } from "@/components/darko/landing/CTASection";
import { Gamepad2, Circle, Grid3x3, Crown, Palette } from "lucide-react";

export const metadata = { title: "Games" };

const GAMES = [
  { icon: Circle, name: "Tic-Tac-Toe", status: "Phase 5", desc: "Classic 3x3. Quick rematch. Spectator mode." },
  { icon: Grid3x3, name: "Connect Four", status: "Phase 5", desc: "Drop-checkers strategy. Two players + spectators." },
  { icon: Crown, name: "Chess", status: "Phase 5", desc: "Full chess with move validation (chess.js). Reconnect-safe." },
  { icon: Palette, name: "Drawing game", status: "Phase 5", desc: "Collaborative canvas + guess-the-word mode." },
];

export default function GamesPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="relative pt-32 pb-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs font-medium text-secondary mb-4">
              <Gamepad2 className="h-3 w-3" />
              Coming in Phase 5
            </div>
            <h1 className="font-display text-5xl sm:text-6xl font-bold tracking-tight text-white">
              Play <span className="text-gradient-accent">together.</span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-secondary max-w-2xl mx-auto">
              Multiplayer games built right into the room. No installs, no separate tabs — just open a room and start a game.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {GAMES.map((g) => (
              <div key={g.name} className="surface-card p-6 flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-elevated border border-border-subtle flex items-center justify-center shrink-0">
                  <g.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display font-semibold text-white">{g.name}</h3>
                    <span className="text-[10px] uppercase tracking-widest text-muted px-1.5 py-0.5 rounded bg-elevated">
                      {g.status}
                    </span>
                  </div>
                  <p className="text-sm text-secondary">{g.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 p-4 rounded-lg bg-elevated/50 border border-border-subtle text-center">
            <p className="text-xs text-muted leading-relaxed">
              All games are open-source and original. No copyrighted ROMs or proprietary assets.
              Game state is authoritative on the server and survives reconnects.
            </p>
          </div>
        </div>
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
