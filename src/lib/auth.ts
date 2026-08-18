import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import type { Adapter } from "next-auth/adapters";

/**
 * DARKO NextAuth configuration.
 *
 * Two providers:
 *  1. Google OAuth — for users who want persistent profiles
 *  2. Credentials ("guest") — for guest sessions (no DB row; JWT only with isGuest: true)
 *
 * Strategy: JWT (not database sessions) — works on serverless (Vercel).
 */

const GUEST_PROVIDER_ID = "guest";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as unknown as Adapter,
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    CredentialsProvider({
      id: GUEST_PROVIDER_ID,
      name: "Guest",
      credentials: {
        displayName: { label: "Display name", type: "text" },
      },
      async authorize(credentials) {
        const displayName = (credentials?.displayName ?? "Guest").trim().slice(0, 24);
        if (displayName.length < 2) return null;
        // Generate a guest user object — no DB row, JWT only
        return {
          id: `guest_${crypto.randomUUID()}`,
          name: displayName,
          email: null,
          image: null,
          // Custom flag — encoded into JWT in callbacks below
          isGuest: true,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // First sign-in: persist user info to token
      if (user) {
        token.userId = user.id;
        token.isGuest = (user as any).isGuest === true || account?.provider === GUEST_PROVIDER_ID;
        token.displayName = user.name ?? "Guest";
        if (user.image) token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      // Forward token claims to the session object
      if (session.user) {
        (session.user as any).id = token.userId as string;
        (session.user as any).isGuest = (token.isGuest as boolean) ?? false;
        (session.user as any).displayName = (token.displayName as string) ?? session.user.name ?? "Guest";
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Create default UserPreferences for new Google users
      if (user.id && !user.id.startsWith("guest_")) {
        try {
          await db.userPreferences.create({ data: { userId: user.id } });
        } catch {
          // ignore if already exists
        }
      }
    },
  },
};
