"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Plus, Users, Clock, ArrowRight, Loader2 } from "lucide-react";
import { Navbar } from "@/components/darko/layout/Navbar";
import { Button } from "@/components/shared/Button";
import { getTheme } from "@/config/themes";
import type { RoomDTO } from "@/types/api";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [rooms, setRooms] = useState<RoomDTO[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/dashboard");
      return;
    }
    if (status !== "authenticated") return;

    (async () => {
      try {
        const res = await fetch("/api/rooms");
        const json = await res.json();
        if (!res.ok) throw new Error();
        setRooms(json.data ?? []);
      } catch {
        setError(true);
      }
    })();
  }, [status, router]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="relative pt-32 pb-20 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10"
          >
            <div>
              <p className="text-sm text-muted mb-1">
                Welcome back, <span className="text-secondary">{session?.user?.displayName ?? session?.user?.name}</span>
              </p>
              <h1 className="font-display text-4xl font-bold text-white">Your rooms</h1>
            </div>
            <Button variant="primary" size="lg" asChild leftIcon={<Plus className="h-4 w-4" />}>
              <a href="/rooms/create">New room</a>
            </Button>
          </motion.div>

          {/* Loading */}
          {rooms === null && !error && (
            <div className="flex items-center justify-center py-20 text-muted">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading your rooms...
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="surface-card p-8 text-center">
              <p className="text-sm text-secondary mb-4">Could not load your rooms.</p>
              <Button variant="outline" size="md" onClick={() => window.location.reload()}>
                Try again
              </Button>
            </div>
          )}

          {/* Empty state */}
          {rooms !== null && rooms.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="surface-card p-12 text-center"
            >
              <div className="h-14 w-14 rounded-2xl bg-elevated border border-border-strong flex items-center justify-center mx-auto mb-5">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <h2 className="font-display text-xl font-semibold text-white mb-2">No rooms yet</h2>
              <p className="text-sm text-secondary mb-6 max-w-sm mx-auto">
                Create your first room and share the link with friends. It takes about 10 seconds.
              </p>
              <Button variant="primary" size="lg" asChild>
                <a href="/rooms/create">Create your first room</a>
              </Button>
            </motion.div>
          )}

          {/* Rooms grid */}
          {rooms !== null && rooms.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room, i) => {
                const theme = getTheme(room.theme);
                return (
                  <motion.a
                    key={room.id}
                    href={`/room/${room.slug}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    className="group surface-card overflow-hidden hover:-translate-y-1"
                  >
                    <div
                      className="h-24 relative"
                      style={{ background: theme.preview }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] text-white">
                        {theme.name}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-display font-semibold text-white mb-1 line-clamp-1">
                        {room.title}
                      </h3>
                      <p className="text-xs text-muted line-clamp-1 mb-3">
                        {room.description ?? "No description"}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted">
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {room.memberCount}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(room.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-border-subtle flex items-center justify-between text-xs">
                        <span className="font-mono text-muted">/{room.slug}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </motion.a>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
