import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { verifyPassword, signRoomToken } from "@/lib/crypto";
import { joinRoomSchema } from "@/lib/validators/room";
import { toRoomDTO, toRoomMemberDTO } from "@/lib/mappers";
import { rateLimitByIp } from "@/lib/rate-limit";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * POST /api/rooms/[slug]/join — Validate access and issue a room-scoped JWT.
 *
 * Body: { password?: string, displayName?: string }
 *
 * Flow:
 *   1. Verify room exists and isn't expired
 *   2. Check ban list (per-room and global)
 *   3. If room has password, verify it (rate-limited brute-force protection)
 *   4. Check capacity
 *   5. If user is authenticated, ensure RoomMember row exists
 *   6. Issue room JWT (4h TTL) — used to authenticate Socket.IO handshake
 *
 * Returns: { room, roomToken, members }
 */
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;
    // Rate limit join attempts: 20 per minute per IP
    const rl = rateLimitByIp(req, { capacity: 20, refillPerSecond: 0.33 });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many join attempts. Please wait a moment." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetInMs / 1000)) } }
      );
    }

    const room = await db.room.findUnique({
      where: { slug },
      include: { settings: true },
    });
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Check expiry
    if (room.expiresAt && room.expiresAt < new Date()) {
      return NextResponse.json({ error: "This room has expired" }, { status: 410 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = joinRoomSchema.safeParse({
      password: body.password ?? "",
      displayName: body.displayName ?? "Guest",
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const input = parsed.data;

    // Get current user (may be null for unauthenticated guests)
    const user = await getCurrentUser();

    // If room settings disallow guests and user is unauthenticated, reject
    if (room.settings && !room.settings.allowGuests && (!user || user.isGuest)) {
      return NextResponse.json(
        { error: "This room requires a DARKO account to join" },
        { status: 403 }
      );
    }

    // Verify password if set
    if (room.passwordHash) {
      if (!input.password) {
        return NextResponse.json(
          { error: "Password required", code: "PASSWORD_REQUIRED" },
          { status: 401 }
        );
      }
      // Brute-force protection: 5 attempts per IP per room per 10 min
      const bruteRl = rateLimitByIp(req, {
        capacity: 5,
        refillPerSecond: 5 / 600, // 5 tokens per 10 min
      });
      // Note: rate-limit key would ideally include room.id; for simplicity we use IP only.
      // The IP-based limit already throttles brute-force across rooms from one IP.
      if (!bruteRl.ok) {
        return NextResponse.json(
          { error: "Too many failed attempts. Try again later." },
          { status: 429 }
        );
      }
      const ok = await verifyPassword(input.password, room.passwordHash);
      if (!ok) {
        return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
      }
    }

    // Check ban list
    if (user) {
      const ban = await db.ban.findFirst({
        where: {
          userId: user.id,
          AND: [
            {
              OR: [
                { roomId: room.id }, // room-specific ban
                { roomId: null }, // global ban
              ],
            },
            {
              OR: [
                { expiresAt: null }, // permanent
                { expiresAt: { gt: new Date() } }, // not yet expired
              ],
            },
          ],
        },
      });
      if (ban) {
        return NextResponse.json(
          { error: "You are banned from this room" },
          { status: 403 }
        );
      }
    }

    // Check capacity (count active online members)
    const onlineCount = await db.roomMember.count({
      where: { roomId: room.id, isOnline: true },
    });
    // Guests aren't in RoomMember, so this is a lower bound.
    // The realtime server will enforce the actual hard cap.
    if (onlineCount >= room.maxParticipants) {
      return NextResponse.json(
        { error: "Room is full", code: "ROOM_FULL" },
        { status: 503 }
      );
    }

    // For authenticated users: ensure RoomMember row exists
    let role = "GUEST";
    if (user && !user.isGuest) {
      const member = await db.roomMember.upsert({
        where: { roomId_userId: { roomId: room.id, userId: user.id } },
        update: {
          isOnline: true,
          lastSeen: new Date(),
        },
        create: {
          roomId: room.id,
          userId: user.id,
          role: "MEMBER",
          isOnline: true,
        },
        include: { user: true },
      });
      role = member.role;
    } else if (user && user.isGuest && room.ownerId === user.id) {
      // Guest who created the room — they're the owner
      role = "OWNER";
    }

    // Get all members for initial state
    const members = await db.roomMember.findMany({
      where: { roomId: room.id },
      include: { user: true },
    });

    // Issue room JWT
    const roomToken = signRoomToken({
      roomId: room.id,
      slug: room.slug,
      userId: user?.id ?? `guest_${crypto.randomUUID()}`,
      displayName: user?.displayName ?? input.displayName,
      isGuest: !user || user.isGuest,
      role,
    });

    // Update room lastActivity
    await db.room.update({
      where: { id: room.id },
      data: { lastActivity: new Date() },
    });

    const dto = await toRoomDTO(room);

    return NextResponse.json({
      data: {
        room: dto,
        roomToken,
        members: members.map(toRoomMemberDTO),
      },
    });
  } catch (err) {
    console.error("[rooms/join] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
