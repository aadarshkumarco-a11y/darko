import jwt, { type JwtPayload } from "jsonwebtoken";
import type { Server, Socket } from "socket.io";

export interface RoomJwtPayload extends JwtPayload {
  roomId: string;
  slug: string;
  userId: string;
  displayName: string;
  isGuest: boolean;
  role: string;
}

export interface AuthenticatedSocket extends Socket {
  data: {
    user: {
      id: string;
      displayName: string;
      isGuest: boolean;
      role: string;
    };
    room: {
      id: string;
      slug: string;
    } | null;
  };
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) {
    console.error("FATAL: JWT_SECRET or NEXTAUTH_SECRET env var is required");
    console.error("Set it to the same value as NEXTAUTH_SECRET in the Next.js .env");
    process.exit(1);
  }
  return secret;
}

/**
 * Socket.IO auth middleware.
 * Verifies the room-scoped JWT issued by POST /api/rooms/[slug]/join.
 */
export function setupAuth(io: Server): void {
  io.use((socket: Socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) {
        return next(new Error("AUTH_REQUIRED"));
      }

      const payload = jwt.verify(token, getJwtSecret()) as RoomJwtPayload;
      if (!payload.roomId || !payload.userId || !payload.slug) {
        return next(new Error("INVALID_TOKEN"));
      }

      // Check expiry (jwt.verify already does this, but be explicit)
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        return next(new Error("TOKEN_EXPIRED"));
      }

      // Attach to socket.data
      (socket as AuthenticatedSocket).data = {
        user: {
          id: payload.userId,
          displayName: payload.displayName,
          isGuest: payload.isGuest,
          role: payload.role,
        },
        room: null, // Will be set on room:join
      };

      next();
    } catch (err) {
      console.error("[auth] JWT verification failed:", (err as Error).message);
      next(new Error("AUTH_FAILED"));
    }
  });
}
