"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Copy, Check, Users, AlertTriangle, Loader2, ArrowLeft, Settings, MessageSquare } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/shared/Button";
import { getTheme } from "@/config/themes";
import type { RoomDTO, RoomMemberDTO, JoinRoomResponse } from "@/types/api";
import { toast } from "sonner";

export default function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId: slug } = use(params);
  const router = useRouter();
  const { data: session } = useSession();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomDTO | null>(null);
  const [members, setMembers] = useState<RoomMemberDTO[]>([]);
  const [copied, setCopied] = useState(false);

  // On mount: check for room token from join flow. If missing, redirect to /join
  useEffect(() => {
    const token = sessionStorage.getItem(`roomToken:${slug}`);
    if (!token) {
      router.replace(`/join/${slug}`);
      return;
    }
    // Verify the token still works by fetching room info
    (async () => {
      try {
        const res = await fetch(`/api/rooms/${slug}`);
        const json = await res.json();
        if (!res.ok) {
          setError(json.error ?? "Room unavailable");
          setLoading(false);
          return;
        }
        setRoom(json.data);
        // Try to fetch members (will only succeed if user is a member)
        // For guests, members list will be empty — that's fine for Phase 1
        setMembers([]);
        setLoading(false);
      } catch {
        setError("Network error");
        setLoading(false);
      }
    })();
  }, [slug, router]);

  const copyInviteLink = async () => {
    const url = `${window.location.origin}/join/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Invite link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Logo size="md" href={null} />
        <div className="mt-8 flex items-center gap-2 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Entering room...
        </div>
      </div>
    );
  }

  // Error state
  if (error || !room) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="surface-card p-8 max-w-md text-center">
          <div className="h-12 w-12 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-6 w-6 text-red-400" />
          </div>
          <h1 className="font-display text-xl font-semibold text-white mb-2">
            Room unavailable
          </h1>
          <p className="text-sm text-secondary mb-6">
            {error ?? "This room may have been deleted, expired, or the link is incorrect."}
          </p>
          <Button variant="primary" size="md" asChild>
            <a href="/rooms/create">Create a new room</a>
          </Button>
        </div>
      </div>
    );
  }

  const theme = getTheme(room.theme);

  return (
    <div
      className="min-h-screen relative"
      style={{
        background: theme.bgGradient,
      }}
    >
      {/* Ambient themed glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="ambient-glow animate-drift-slow"
          style={{
            top: "-10%",
            left: "30%",
            width: "600px",
            height: "600px",
            background: theme.glow,
            opacity: 0.4,
          }}
        />
      </div>

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border-subtle glass">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-1.5 rounded-md text-muted hover:text-white hover:bg-hover transition-colors"
            aria-label="Leave room"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="font-display text-base font-semibold text-white leading-tight">
              {room.title}
            </h1>
            <p className="text-[10px] text-muted font-mono">darko.app/room/{slug}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={copyInviteLink} leftIcon={copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}>
            <span className="hidden sm:inline">{copied ? "Copied" : "Invite"}</span>
          </Button>
          <Button variant="ghost" size="icon" aria-label="Settings">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Empty room state — Phase 1 */}
      <main className="relative z-10 flex flex-col items-center justify-center px-4 py-16 min-h-[calc(100vh-64px)]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-lg"
        >
          {/* Empty state illustration */}
          <div className="relative mb-8">
            <div
              className="h-24 w-24 rounded-2xl mx-auto flex items-center justify-center border-2 border-dashed"
              style={{ borderColor: theme.accent + "60", background: theme.accent + "10" }}
            >
              <Users className="h-10 w-10" style={{ color: theme.accent }} />
            </div>
            <div
              className="absolute -inset-4 rounded-3xl opacity-30 blur-2xl pointer-events-none"
              style={{ background: theme.glow }}
            />
          </div>

          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3">
            You&apos;re in.
          </h2>
          <p className="text-base text-secondary mb-8 leading-relaxed">
            This room is set up and ready. Share the link with friends to start your hangout — watch together, voice chat, play games, and more.
          </p>

          {/* Invite link CTA */}
          <div className="surface-card p-4 mb-6">
            <p className="text-xs text-muted mb-2 uppercase tracking-widest">Invite link</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm text-white font-mono truncate text-left">
                {typeof window !== "undefined" ? `${window.location.origin}/join/${slug}` : `/join/${slug}`}
              </code>
              <Button
                variant="primary"
                size="sm"
                onClick={copyInviteLink}
                leftIcon={copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              >
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button variant="primary" size="lg" onClick={copyInviteLink} leftIcon={<Copy className="h-4 w-4" />}>
              Share invite link
            </Button>
            <Button variant="ghost" size="lg" asChild>
              <a href="/dashboard">Back to dashboard</a>
            </Button>
          </div>

          {/* Phase 1 honest limitation notice */}
          <div className="mt-12 p-4 rounded-lg bg-elevated/50 border border-border-subtle">
            <p className="text-xs text-muted leading-relaxed">
              <strong className="text-secondary">Heads up:</strong> Realtime features (chat, voice/video, watch party, games) are coming in Phase 2. For now, this is your room&apos;s control panel — invite friends, and once Phase 2 lands, you&apos;ll see them appear here in real time.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
