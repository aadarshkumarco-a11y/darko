import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { toRoomDTO } from "@/lib/mappers";
import { updateRoomSchema } from "@/lib/validators/room";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/rooms/[slug] — Get room metadata by slug.
 * Public: returns title, theme, hasPassword, isPublic, memberCount.
 * Does NOT require auth — needed for the /join page preview.
 */
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const room = await db.room.findUnique({
      where: { slug },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Don't expose private room metadata to non-members
    const user = await getCurrentUser();
    const isMember =
      user &&
      (await db.roomMember.findUnique({
        where: { roomId_userId: { roomId: room.id, userId: user.id } },
        select: { id: true },
      }));

    const dto = await toRoomDTO(room, !!isMember);

    // If private and not a member, hide description
    if (!room.isPublic && !isMember) {
      dto.description = null;
      dto.settings = null;
    }

    return NextResponse.json({ data: dto });
  } catch (err) {
    console.error("[rooms/get] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/rooms/[slug] — Update room settings.
 * Owner or Host only.
 */
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const room = await db.room.findUnique({ where: { slug } });
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Check role
    const membership = await db.roomMember.findUnique({
      where: { roomId_userId: { roomId: room.id, userId: user.id } },
    });
    if (!membership || !["OWNER", "HOST"].includes(membership.role)) {
      return NextResponse.json({ error: "Forbidden — host or owner only" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const parsed = updateRoomSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const input = parsed.data;

    const updated = await db.room.update({
      where: { id: room.id },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description || null }),
        ...(input.theme !== undefined && { theme: input.theme }),
        ...(input.isPublic !== undefined && {
          isPublic: input.isPublic,
          expiresAt: input.isPublic
            ? room.expiresAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000)
            : null,
        }),
        ...(input.maxParticipants !== undefined && { maxParticipants: input.maxParticipants }),
        updatedAt: new Date(),
      },
    });

    const dto = await toRoomDTO(updated);
    return NextResponse.json({ data: dto });
  } catch (err) {
    console.error("[rooms/patch] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/rooms/[slug] — Delete a room.
 * Owner only.
 */
export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const room = await db.room.findUnique({ where: { slug } });
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (room.ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden — owner only" }, { status: 403 });
    }

    await db.room.delete({ where: { id: room.id } });

    return NextResponse.json({ data: { deleted: true } });
  } catch (err) {
    console.error("[rooms/delete] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
