import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { fetchUrlMetadata } from "@/lib/url-safety";
import { urlMetadataSchema } from "@/lib/validators/chat";
import { rateLimitByIp } from "@/lib/rate-limit";

/**
 * POST /api/url-metadata — Fetch SSRF-safe metadata (title, description, favicon) for a URL.
 * Auth required. Rate limited: 10 requests per minute per IP.
 */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = rateLimitByIp(req, { capacity: 10, refillPerSecond: 0.16 });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetInMs / 1000)) } }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const parsed = urlMetadataSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid URL" },
        { status: 400 }
      );
    }

    const metadata = await fetchUrlMetadata(parsed.data.url);
    return NextResponse.json({ data: metadata });
  } catch (err: any) {
    if (err.message?.includes("URL failed") || err.message?.includes("HTTPS")) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[url-metadata] error:", err);
    return NextResponse.json({ error: "Failed to fetch URL metadata" }, { status: 500 });
  }
}
