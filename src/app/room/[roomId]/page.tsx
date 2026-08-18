"use client";

import { useState, useEffect, use, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Users, AlertTriangle, Loader2, ArrowLeft, Settings, MessageSquare, X, Video, Gamepad2 } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/shared/Button";
import { getTheme } from "@/config/themes";
import { useSocket } from "@/hooks/use-socket";
import { useRoomStore } from "@/stores/room-store";
import { useChatStore } from "@/stores/chat-store";
import { ParticipantStrip } from "@/components/darko/room/ParticipantStrip";
import { ChatPanel } from "@/components/darko/chat/ChatPanel";
import { RoomMedia } from "@/components/darko/webrtc/RoomMedia";
import type { RoomDTO } from "@/types/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId: slug } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomDTO | null>(null);
  // Initialize roomToken from sessionStorage synchronously (avoids setState-in-effect)
  const [roomToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(`roomToken:${slug}`);
  });
  const [copied, setCopied] = useState(false);
  const [chatOpenMobile, setChatOpenMobile] = useState(false);
  const [participantsOpenMobile, setParticipantsOpenMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<"call" | "activity">("call");

  // Subscribe to store values BEFORE any early returns (rules of hooks)
  const self = useRoomStore((s) => s.self);
  const participantCount = useRoomStore((s) => s.participants.length);
  const participants = useRoomStore((s) => s.participants);

  // Compute participant IDs for WebRTC
  const participantIds = useMemo(() => participants.map((p) => p.id), [participants]);

  // On mount: redirect if no token, otherwise fetch room metadata
  useEffect(() => {
    if (!roomToken) {
      router.replace(`/join/${slug}`);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/rooms/${slug}`);
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(json.error ?? "Room unavailable");
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
  }, [slug, router, roomToken]);

  // Socket callbacks
  const onState = useCallback((state: import("@/types/events").RoomStatePayload) => {
    useRoomStore.getState().setInitialState(state);
  }, []);

  const onUserJoined = useCallback((payload: import("@/types/events").PresenceUserJoinedPayload) => {
    useRoomStore.getState().addParticipant(payload.participant);
    toast(`${payload.participant.displayName} joined`, { duration: 3000 });
  }, []);

  const onUserLeft = useCallback((payload: import("@/types/events").PresenceUserLeftPayload) => {
    const state = useRoomStore.getState();
    const participant = state.participants.find((p) => p.id === payload.participantId);
    state.removeParticipant(payload.participantId);
    if (participant) {
      toast(`${participant.displayName} left`, { duration: 2000 });
    }
  }, []);

  const onPresenceUpdate = useCallback((payload: import("@/types/events").PresenceUpdatePayload) => {
    useRoomStore.getState().updateParticipant(payload.participantId, payload.changes);
  }, []);

  const onChatMessage = useCallback((msg: import("@/types/events").ChatMessageBroadcast) => {
    useRoomStore.getState().addMessage(msg);
  }, []);

  const onChatDelete = useCallback((payload: import("@/types/events").ChatDeleteBroadcast) => {
    useRoomStore.getState().deleteMessage(payload.messageId);
  }, []);

  const onChatReaction = useCallback((payload: import("@/types/events").ChatReactionBroadcast) => {
    useRoomStore.getState().addReaction(payload.messageId, payload.userId, payload.emoji, payload.action);
  }, []);

  const onTyping = useCallback((payload: import("@/types/events").TypingBroadcast) => {
    useChatStore.getState().setTyping(payload.userId, payload.displayName, payload.isTyping);
  }, []);

  const onRoleUpdate = useCallback((payload: import("@/types/events").RoleUpdateBroadcast) => {
    useRoomStore.getState().updateRole(payload.targetUserId, payload.newRole);
    if (payload.targetUserId === useRoomStore.getState().self?.id) {
      toast(`You are now ${payload.newRole.toLowerCase()}`, { duration: 3000 });
    }
  }, []);

  const onSettingsUpdate = useCallback((payload: import("@/types/events").SettingsUpdateBroadcast) => {
    useRoomStore.getState().updateSettings(payload.changes);
  }, []);

  const onError = useCallback((message: string, code?: string) => {
    if (code === "ROOM_FULL") {
      toast.error("Room is full. Try again later.");
    } else if (code === "ROOM_EXPIRED") {
      toast.error("This room has expired.");
      setTimeout(() => router.push("/dashboard"), 2000);
    } else {
      toast.error(message);
    }
  }, [router]);

  const { socket, connected, connecting, error: socketError } = useSocket({
    roomToken,
    onState,
    onPresenceUpdate,
    onUserJoined,
    onUserLeft,
    onChatMessage,
    onChatDelete,
    onChatReaction,
    onTyping,
    onRoleUpdate,
    onSettingsUpdate,
    onError,
  });

  // Reset store on unmount
  useEffect(() => {
    return () => {
      useRoomStore.getState().reset();
      useChatStore.getState().reset();
    };
  }, []);

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
          <h1 className="font-display text-xl font-semibold text-white mb-2">Room unavailable</h1>
          <p className="text-sm text-secondary mb-6">{error ?? "This room may have been deleted or expired."}</p>
          <Button variant="primary" size="md" asChild>
            <a href="/rooms/create">Create a new room</a>
          </Button>
        </div>
      </div>
    );
  }

  const theme = getTheme(room.theme);

  return (
    <div className="min-h-screen relative" style={{ background: theme.bgGradient }}>
      {/* Ambient themed glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="ambient-glow animate-drift-slow"
          style={{ top: "-10%", left: "30%", width: "600px", height: "600px", background: theme.glow, opacity: 0.3 }}
        />
      </div>

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border-subtle glass safe-top">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-1.5 rounded-md text-muted hover:text-white hover:bg-hover transition-colors shrink-0"
            aria-label="Leave room"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h1 className="font-display text-base font-semibold text-white leading-tight truncate">{room.title}</h1>
            <p className="text-[10px] text-muted font-mono">darko.app/room/{slug}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Connection status */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md bg-elevated/50">
            <span className={cn("h-1.5 w-1.5 rounded-full", connected ? "bg-green-500 animate-pulse" : connecting ? "bg-amber-500" : "bg-red-500")} />
            <span className="text-[10px] text-muted">
              {connected ? "Connected" : connecting ? "Connecting..." : "Disconnected"}
            </span>
          </div>

          {/* Participant count (mobile) */}
          <button
            onClick={() => setParticipantsOpenMobile(true)}
            className="lg:hidden flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-elevated/50 text-xs text-secondary"
          >
            <Users className="h-3.5 w-3.5" />
            {participantCount}
          </button>

          <Button variant="ghost" size="sm" onClick={copyInviteLink} leftIcon={copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}>
            <span className="hidden sm:inline">{copied ? "Copied" : "Invite"}</span>
          </Button>
          <Button variant="ghost" size="icon" aria-label="Settings">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main content — desktop 3-column layout */}
      <main className="relative z-10 flex h-[calc(100vh-64px)] safe-bottom">
        {/* Left: Participants */}
        <aside className="hidden lg:flex w-64 xl:w-72 flex-col surface-floating border-r border-border-subtle">
          <ParticipantStrip />
        </aside>

        {/* Center: Activity stage with tabs */}
        <section className="flex-1 flex flex-col min-w-0">
          {socketError ? (
            <div className="flex-1 flex items-center justify-center px-4">
              <div className="surface-card p-6 max-w-md text-center">
                <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto mb-3" />
                <h2 className="font-display text-lg font-semibold text-white mb-2">Connection issue</h2>
                <p className="text-sm text-secondary mb-4">{socketError}</p>
                <Button variant="outline" size="md" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </div>
            </div>
          ) : participantCount === 0 ? (
            <div className="flex-1 flex items-center justify-center px-4 py-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center max-w-lg"
              >
                <div className="relative mb-6">
                  <div
                    className="h-20 w-20 rounded-2xl mx-auto flex items-center justify-center border-2 border-dashed"
                    style={{ borderColor: theme.accent + "60", background: theme.accent + "10" }}
                  >
                    <Users className="h-9 w-9" style={{ color: theme.accent }} />
                  </div>
                </div>
                <h2 className="font-display text-2xl font-bold text-white mb-2">Waiting for friends...</h2>
                <p className="text-sm text-secondary mb-6">Share the invite link to start your hangout.</p>
                <Button variant="primary" size="md" onClick={copyInviteLink} leftIcon={<Copy className="h-3.5 w-3.5" />}>
                  Copy invite link
                </Button>
              </motion.div>
            </div>
          ) : (
            <>
              {/* Tab bar */}
              <div className="flex items-center gap-1 px-4 pt-3 border-b border-border-subtle">
                <TabButton
                  active={activeTab === "call"}
                  onClick={() => setActiveTab("call")}
                  icon={Video}
                  label="Voice / Video"
                />
                <TabButton
                  active={activeTab === "activity"}
                  onClick={() => setActiveTab("activity")}
                  icon={Gamepad2}
                  label="Activity"
                />
              </div>

              {/* Tab content */}
              <div className="flex-1 min-h-0">
                {activeTab === "call" ? (
                  <RoomMedia
                    socket={socket}
                    connected={connected}
                    selfId={self?.id ?? null}
                    participantIds={participantIds}
                    participants={participants}
                    onLeaveRoom={() => router.push("/dashboard")}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mb-6 max-w-md">
                      {participants.slice(0, 8).map((p) => (
                        <ParticipantTileMini key={p.id} participant={p} themeAccent={theme.accent} />
                      ))}
                    </div>
                    <h2 className="font-display text-2xl font-bold text-white mb-2">
                      {participantCount} {participantCount === 1 ? "person is" : "people are"} here
                    </h2>
                    <p className="text-sm text-secondary mb-4">
                      Switch to Voice/Video to start a call. Chat is on the right.
                    </p>
                    <p className="text-xs text-muted">
                      Phase 4 brings watch party. Phase 5 brings games. Stay tuned.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        {/* Right: Chat (desktop) */}
        <aside className="hidden md:flex w-80 xl:w-96 flex-col">
          <ChatPanel socket={socket} className="m-3 ml-0" />
        </aside>
      </main>

      {/* Mobile: floating chat button */}
      <button
        onClick={() => setChatOpenMobile(true)}
        className="md:hidden fixed bottom-4 right-4 z-30 h-12 w-12 rounded-full bg-primary text-white shadow-lg flex items-center justify-center safe-bottom"
        aria-label="Open chat"
      >
        <MessageSquare className="h-5 w-5" />
      </button>

      {/* Mobile: chat slide-over */}
      <AnimatePresence>
        {chatOpenMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-40"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setChatOpenMobile(false)} />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute top-0 right-0 bottom-0 w-full max-w-sm safe-top safe-bottom safe-right"
            >
              <div className="h-full relative">
                <button
                  onClick={() => setChatOpenMobile(false)}
                  className="absolute -left-12 top-3 z-10 p-2 rounded-full glass-strong text-white"
                  aria-label="Close chat"
                >
                  <X className="h-4 w-4" />
                </button>
                <ChatPanel socket={socket} className="h-full rounded-none" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile: participants slide-over */}
      <AnimatePresence>
        {participantsOpenMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-40"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setParticipantsOpenMobile(false)} />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute top-0 left-0 bottom-0 w-72 safe-top safe-bottom safe-left"
            >
              <div className="h-full relative surface-floating">
                <button
                  onClick={() => setParticipantsOpenMobile(false)}
                  className="absolute -right-12 top-3 z-10 p-2 rounded-full glass-strong text-white"
                  aria-label="Close participants"
                >
                  <X className="h-4 w-4" />
                </button>
                <ParticipantStrip />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Mini participant tile for the "X people are here" view
function ParticipantTileMini({ participant, themeAccent }: { participant: import("@/types/events").ParticipantState; themeAccent: string }) {
  const hue = participant.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  const bgColor = `hsl(${hue}, 50%, 35%)`;
  const initials = participant.displayName.split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase() ?? "").join("") || "?";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative h-14 w-14 rounded-lg overflow-hidden flex items-center justify-center" style={{ background: bgColor }}>
        <span className="text-sm font-semibold text-white">{initials}</span>
        {participant.role === "OWNER" && (
          <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-500 border-2 border-elevated flex items-center justify-center">
            <span className="text-[8px]">👑</span>
          </div>
        )}
      </div>
      <span className="text-[10px] text-secondary truncate max-w-full">{participant.displayName}</span>
    </div>
  );
}

// Tab button for switching between Call and Activity views
function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Video; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
        active
          ? "border-primary text-white"
          : "border-transparent text-secondary hover:text-white"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
