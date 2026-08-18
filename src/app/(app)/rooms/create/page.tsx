"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { ArrowRight, Lock, Globe, Sparkles } from "lucide-react";
import { Navbar } from "@/components/darko/layout/Navbar";
import { Button } from "@/components/shared/Button";
import { ROOM_THEMES } from "@/config/themes";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CreateRoomPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [theme, setTheme] = useState("midnight-lounge");
  const [maxParticipants, setMaxParticipants] = useState(8);
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please give your room a title");
      return;
    }
    if (hasPassword && password.length < 4) {
      toast.error("Password must be at least 4 characters");
      return;
    }

    // If not signed in, redirect to login first
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent("/rooms/create")}`);
      return;
    }
    if (status === "loading") return;

    setCreating(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          isPublic,
          password: hasPassword ? password : undefined,
          theme,
          maxParticipants,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to create room");
        setCreating(false);
        return;
      }

      toast.success("Room created!");
      router.push(`/room/${json.data.slug}`);
    } catch (err) {
      toast.error("Network error — please try again");
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="relative pt-32 pb-20 px-4">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs font-medium text-secondary mb-3">
              <Sparkles className="h-3 w-3" />
              New room
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-white">
              Set up your <span className="text-gradient-accent">hangout</span>
            </h1>
            <p className="mt-3 text-sm text-secondary">
              Pick a vibe, set the rules, share the link.
            </p>
          </motion.div>

          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="surface-card p-6 sm:p-8 space-y-6"
          >
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-white mb-2">
                Room title <span className="text-red-400">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={80}
                placeholder="Friday night movie marathon"
                className="w-full h-11 px-3 rounded-md bg-input border border-border-subtle text-sm text-white placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
                required
              />
              <p className="mt-1 text-xs text-muted">{title.length}/80</p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-white mb-2">
                Description <span className="text-muted">(optional)</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder="What's the plan?"
                className="w-full px-3 py-2 rounded-md bg-input border border-border-subtle text-sm text-white placeholder:text-muted focus:outline-none focus:border-primary transition-colors resize-none"
              />
            </div>

            {/* Theme picker */}
            <div>
              <label className="block text-sm font-medium text-white mb-3">Theme</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ROOM_THEMES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id)}
                    className={cn(
                      "relative h-16 rounded-lg overflow-hidden border-2 transition-all",
                      theme === t.id
                        ? "border-primary scale-[1.02]"
                        : "border-border-subtle hover:border-border-strong"
                    )}
                    style={{ background: t.preview }}
                    aria-label={t.name}
                  >
                    <span className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-black/60 text-[10px] text-white text-left">
                      {t.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-white mb-3">Visibility</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left",
                    !isPublic
                      ? "border-primary bg-primary/5"
                      : "border-border-subtle hover:border-border-strong"
                  )}
                >
                  <Lock className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-white">Private</div>
                    <div className="text-xs text-muted">Only with the link</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left",
                    isPublic
                      ? "border-primary bg-primary/5"
                      : "border-border-subtle hover:border-border-strong"
                  )}
                >
                  <Globe className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-white">Public</div>
                    <div className="text-xs text-muted">Listed in lobby</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasPassword}
                  onChange={(e) => setHasPassword(e.target.checked)}
                  className="h-4 w-4 rounded border-border-subtle bg-input accent-primary"
                />
                <span className="text-sm font-medium text-white">Require a password</span>
              </label>
              {hasPassword && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-3"
                >
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={4}
                    maxLength={100}
                    placeholder="Choose a password"
                    className="w-full h-11 px-3 rounded-md bg-input border border-border-subtle text-sm text-white placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
                  />
                </motion.div>
              )}
            </div>

            {/* Max participants */}
            <div>
              <label htmlFor="maxParticipants" className="block text-sm font-medium text-white mb-2">
                Max participants: <span className="text-primary">{maxParticipants}</span>
              </label>
              <input
                id="maxParticipants"
                type="range"
                min={2}
                max={8}
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <p className="mt-1 text-xs text-muted">
                P2P WebRTC works best with 6 or fewer voice/video participants.
              </p>
            </div>

            {/* Submit */}
            <div className="pt-4 border-t border-border-subtle flex items-center justify-between">
              <p className="text-xs text-muted">
                {session?.user
                  ? `Creating as ${session.user.displayName ?? session.user.name}`
                  : "You'll need to sign in first"}
              </p>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={creating}
                rightIcon={!creating ? <ArrowRight className="h-4 w-4" /> : undefined}
              >
                Create room
              </Button>
            </div>
          </motion.form>
        </div>
      </main>
    </div>
  );
}
