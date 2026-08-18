"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { ArrowRight, Lock, Users, AlertTriangle, Loader2 } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/shared/Button";
import { getTheme } from "@/config/themes";
import type { RoomDTO } from "@/types/api";
import { toast } from "sonner";

export default function JoinRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId: slug } = use(params);
  const router = useRouter();
  const { data: session, status } = useSession();

  const [room, setRoom] = useState<RoomDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [displayNameInput, setDisplayNameInput] = useState("");
  const [password, setPassword] = useState("");
  const [joining, setJoining] = useState(false);

  // Derive display name: user input takes precedence, else fall back to session
  const displayName = displayNameInput || session?.user?.displayName || "";

  // Fetch room metadata
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/rooms/${slug}`);
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(json.error ?? "Room not found");
          setLoading(false);
          return;
        }
        setRoom(json.data);
        setLoading(false);
      } catch {
        if (!cancelled) {
          setError("Network error");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (room?.hasPassword && !password) {
      toast.error("This room requires a password");
      return;
    }

    setJoining(true);
    try {
      const res = await fetch(`/api/rooms/${slug}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: password || undefined,
          displayName: displayName.trim() || "Guest",
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.code === "PASSWORD_REQUIRED") {
          toast.error("This room requires a password");
        } else if (json.code === "ROOM_FULL") {
          toast.error("Room is full — try again later");
        } else {
          toast.error(json.error ?? "Could not join room");
        }
        setJoining(false);
        return;
      }
      // Store room token in sessionStorage for the room page to pick up
      sessionStorage.setItem(`roomToken:${slug}`, json.data.roomToken);
      router.push(`/room/${slug}`);
    } catch {
      toast.error("Network error — please try again");
      setJoining(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Logo size="md" href={null} />
        <div className="mt-8 flex items-center gap-2 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading room...
        </div>
      </div>
    );
  }

  // Error state (room not found / expired)
  if (error || !room) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface-card p-8 max-w-md text-center"
        >
          <div className="h-12 w-12 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-6 w-6 text-red-400" />
          </div>
          <h1 className="font-display text-xl font-semibold text-white mb-2">
            Room unavailable
          </h1>
          <p className="text-sm text-secondary mb-6">
            {error ?? "This room may have been deleted, expired, or the link is incorrect."}
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" size="md" asChild>
              <a href="/">Back to home</a>
            </Button>
            <Button variant="primary" size="md" asChild>
              <a href="/rooms/create">Create a new room</a>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const theme = getTheme(room.theme);

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center px-4 py-16">
      {/* Themed ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="ambient-glow"
          style={{
            top: "10%",
            left: "30%",
            width: "500px",
            height: "500px",
            background: theme.glow,
            opacity: 0.4,
          }}
        />
      </div>

      <div className="relative mb-8">
        <Logo size="md" href={null} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="surface-card p-8">
          {/* Room preview header */}
          <div className="mb-6 pb-6 border-b border-border-subtle">
            <div
              className="h-20 rounded-lg mb-4 relative overflow-hidden"
              style={{ background: theme.preview }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute bottom-2 left-3 text-[10px] uppercase tracking-widest text-white/80">
                {theme.name}
              </div>
            </div>
            <h1 className="font-display text-2xl font-bold text-white mb-1">{room.title}</h1>
            {room.description && (
              <p className="text-sm text-secondary leading-relaxed">{room.description}</p>
            )}
            <div className="mt-3 flex items-center gap-4 text-xs text-muted">
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {room.onlineCount} online
              </span>
              {room.hasPassword && (
                <span className="inline-flex items-center gap-1.5 text-amber-400">
                  <Lock className="h-3.5 w-3.5" />
                  Password protected
                </span>
              )}
            </div>
          </div>

          {/* Join form */}
          <form onSubmit={handleJoin} className="space-y-4">
            {/* If not signed in, ask for display name */}
            {status !== "authenticated" && (
              <div>
                <label htmlFor="displayName" className="block text-xs font-medium text-secondary mb-1.5">
                  Display name
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayNameInput(e.target.value)}
                  maxLength={24}
                  placeholder="Your name"
                  className="w-full h-10 px-3 rounded-md bg-input border border-border-subtle text-sm text-white placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
                  required
                />
              </div>
            )}

            {/* Password (if needed) */}
            {room.hasPassword && (
              <div>
                <label htmlFor="password" className="block text-xs font-medium text-secondary mb-1.5">
                  Room password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full h-10 px-3 rounded-md bg-input border border-border-subtle text-sm text-white placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
                  required
                />
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={joining}
              rightIcon={!joining ? <ArrowRight className="h-4 w-4" /> : undefined}
            >
              Join room
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-muted">
            {status === "authenticated"
              ? `Joining as ${session?.user?.displayName ?? session?.user?.name}`
              : "Joining as guest — no account needed"}
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          By joining, you agree to DARKO&apos;s{" "}
          <a href="/terms" className="text-secondary hover:text-white underline-offset-2 hover:underline">
            Terms
          </a>{" "}
          and{" "}
          <a href="/safety" className="text-secondary hover:text-white underline-offset-2 hover:underline">
            Safety rules
          </a>
          .
        </p>
      </motion.div>
    </div>
  );
}
