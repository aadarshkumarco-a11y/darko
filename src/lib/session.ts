import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import type { SafeUser } from "@/types/api";

/**
 * Get the current authenticated user (Google OAuth or guest).
 * Returns null if not signed in.
 */
export async function getCurrentUser(): Promise<SafeUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const isGuest = session.user.isGuest === true;

  return {
    id: session.user.id,
    email: isGuest ? null : session.user.email ?? null,
    name: session.user.name ?? null,
    image: session.user.image ?? null,
    isGuest,
    displayName: session.user.displayName ?? session.user.name ?? "Guest",
  };
}

/**
 * Require authentication. Throws a 401-shaped error if not signed in.
 */
export async function requireUser(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) {
    const err = new Error("UNAUTHORIZED") as Error & { status: number };
    err.status = 401;
    throw err;
  }
  return user;
}

/**
 * Get or create a User row for the current session.
 * - Google users: must already exist (created by NextAuth adapter on first sign-in).
 * - Guest users: may or may not have a DB row. If they've created a room, they do
 *   (we persist a "ghost" User row when a guest creates a room, so they own it).
 *   If they haven't created a room yet, dbId is null.
 */
export async function getOrCreateUser(): Promise<{ safe: SafeUser; dbId: string | null }> {
  const safe = await requireUser();

  // Both guests and Google users may have a DB row. Look it up.
  const dbUser = await db.user.findUnique({
    where: { id: safe.id },
    select: { id: true },
  });

  if (!dbUser) {
    // Guest who hasn't created a room yet — no DB row, that's fine.
    // Google users should always have a row (created by NextAuth adapter).
    if (!safe.isGuest) {
      const err = new Error("USER_NOT_FOUND") as Error & { status: number };
      err.status = 401;
      throw err;
    }
    return { safe, dbId: null };
  }

  return { safe, dbId: dbUser.id };
}
