import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/auth/guest — returns the current session (useful for client hydration).
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ data: null });
  }
  return NextResponse.json({
    data: {
      id: (session.user as any).id,
      name: session.user.name,
      image: session.user.image,
      isGuest: (session.user as any).isGuest ?? false,
      displayName: (session.user as any).displayName ?? session.user.name,
    },
  });
}
