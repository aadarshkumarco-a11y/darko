import { Navbar } from "@/components/darko/layout/Navbar";
import { Footer } from "@/components/darko/layout/Footer";
import { Shield, Flag, Ban, Users, Lock, Eye } from "lucide-react";

export const metadata = { title: "Safety" };

export default function SafetyPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="relative pt-32 pb-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-3">
            Community <span className="text-gradient-accent">Safety</span>
          </h1>
          <p className="text-secondary mb-10">
            DARKO is built for friends hanging out. Here&apos;s how we keep it that way.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            {[
              { icon: Lock, title: "Private by default", desc: "Rooms aren&apos;t indexed. Only people with the link can join." },
              { icon: Eye, title: "No recording", desc: "Voice/video is P2P. We don&apos;t record or store your media." },
              { icon: Flag, title: "Report anything", desc: "Report users or rooms that violate our rules. Phase 7 ships this UI." },
              { icon: Ban, title: "Moderator tools", desc: "Room owners can kick, mute, and ban. Server-side enforced." },
              { icon: Users, title: "Capacity limits", desc: "Rooms cap at 8 participants. P2P mesh realistically supports 6 voice/video." },
              { icon: Shield, title: "Server-side auth", desc: "Roles are never trusted from the client. Every permission check happens on the server." },
            ].map((item) => (
              <div key={item.title} className="surface-card p-5">
                <item.icon className="h-5 w-5 text-primary mb-3" />
                <h3 className="font-display font-semibold text-white text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-secondary leading-relaxed" dangerouslySetInnerHTML={{ __html: item.desc }} />
              </div>
            ))}
          </div>

          <div className="surface-card p-6">
            <h2 className="font-display text-xl font-bold text-white mb-4">Community rules</h2>
            <ul className="space-y-3 text-sm text-secondary">
              <li className="flex gap-3">
                <span className="text-red-400">✕</span>
                <span>No harassment, hate speech, or threats</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-400">✕</span>
                <span>No content that exploits or harms minors</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-400">✕</span>
                <span>No sharing copyrighted content without rights (we don&apos;t bypass DRM)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-400">✕</span>
                <span>No malware, phishing, or illegal content</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-400">✕</span>
                <span>No attempts to disrupt, overload, or attack the service</span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-400">✓</span>
                <span>Be excellent to each other</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 p-5 rounded-lg bg-elevated/50 border border-border-subtle">
            <h3 className="font-display font-semibold text-white mb-2 text-sm">Reporting a violation</h3>
            <p className="text-xs text-muted leading-relaxed">
              In Phase 7, you&apos;ll be able to report users and rooms directly from inside any room. For now, if you encounter a serious violation, open an issue on our GitHub with the room slug and a description of what happened.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
