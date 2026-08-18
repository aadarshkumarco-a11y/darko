import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateUser } from "@/lib/session";
import { generateUniqueRoomSlug, hashPassword } from "@/lib/crypto";
import { createRoomSchema } from "@/lib/validators/room";
import { toRoomDTO } from "@/lib/mappers";
import { rateLimitByIp } from "@/lib/rate-limit";

/**
 * POST /api/rooms — Create a new room.
 * Auth required (Google user or guest).
 */
export async function POST(req: Request) {
  try {
    const { safe, dbId } = await getOrCreateUser();

    // Rate limit: 10 room creations per minute per IP
    const rl = rateLimitByIp(req, { capacity: 10, refillPerSecond: 0.16 });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetInMs / 1000)) } }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = createRoomSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const input = parsed.data;

    // Generate unique slug
    const slug = await generateUniqueRoomSlug(async (s) => {
      const existing = await db.room.findUnique({
        where: { slug: s },
        select: { id: true },
      });
      return !!existing;
    });

    // Hash password if provided
    const passwordHash = input.password ? await hashPassword(input.password) : null;

    // For guests, we need a placeholder owner in the DB.
    // Strategy: create a "ghost" User row for guests who create rooms.
    // This is the only time we persist anything about a guest — they own the room.
    let ownerId = dbId;
    if (!ownerId) {
      const ghostUser = await db.user.create({
        data: {
          id: safe.id,
          email: null,
          name: safe.displayName,
          role: "USER",
          preferences: { create: {} },
        },
      });
      ownerId = ghostUser.id;
    } else {
      // Ensure preferences exist
      await db.userPreferences.upsert({
        where: { userId: ownerId },
        update: {},
        create: { userId: ownerId },
      });
    }

    // Create room + settings + owner membership in a transaction
    const room = await db.$transaction(async (tx) => {
      const newRoom = await tx.room.create({
        data: {
          slug,
          title: input.title,
          description: input.description || null,
          ownerId: ownerId!,
          isPublic: input.isPublic,
          passwordHash,
          maxParticipants: input.maxParticipants,
          theme: input.theme,
          currentMode: "WATCH",
          expiresAt: input.isPublic ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null,
          settings: { create: {} },
          members: {
            create: {
              userId: ownerId!,
              role: "OWNER",
              isOnline: false,
            },
          },
        },
      });
      return newRoom;
    });

    const dto = await toRoomDTO(room);
    return NextResponse.json({ data: dto }, { status: 201 });
  } catch (err: any) {
    if (err.status === 401) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[rooms/create] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/rooms — List rooms owned by the current user.
 * Auth required.
 */
export async function GET() {
  try {
    const { dbId } = await getOrCreateUser();

    // Guest with no DB row yet (hasn't created a room) — return empty list
    if (!dbId) {
      return NextResponse.json({ data: [] });
    }

    const rooms = await db.room.findMany({
      where: { ownerId: dbId },
      orderBy: { lastActivity: "desc" },
      take: 50,
    });

    const dtos = await Promise.all(rooms.map((r) => toRoomDTO(r, false)));
    return NextResponse.json({ data: dtos });
  } catch (err: any) {
    if (err.status === 401) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[rooms/list] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
