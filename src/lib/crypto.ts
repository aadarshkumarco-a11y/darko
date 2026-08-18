import { randomBytes, createHmac, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ============ Slug (room code) ============

const SLUG_ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789"; // no confusable chars (l, 1, 0, o)
const SLUG_LENGTH = 6;

/**
 * Generate a short, human-shareable room slug like "x7k2m9".
 * Avoids confusable characters (0/O, 1/l/I).
 */
export function generateRoomSlug(): string {
  const bytes = randomBytes(SLUG_LENGTH);
  let slug = "";
  for (let i = 0; i < SLUG_LENGTH; i++) {
    slug += SLUG_ALPHABET[bytes[i] % SLUG_ALPHABET.length];
  }
  return slug;
}

/**
 * Generate a slug and verify uniqueness against the DB.
 * Retries up to 5 times before giving up.
 */
export async function generateUniqueRoomSlug(
  existsFn: (slug: string) => Promise<boolean>
): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const slug = generateRoomSlug();
    if (!(await existsFn(slug))) return slug;
  }
  // Extremely unlikely fallback — extend to 8 chars
  return randomBytes(4).toString("hex");
}

// ============ Password hashing ============

const BCRYPT_ROUNDS = 10;

export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, BCRYPT_ROUNDS);
}

export async function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plaintext, hash);
  } catch {
    return false;
  }
}

// ============ HMAC for guest IDs (deterministic, optional) ============

export function hmacSign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function hmacVerify(payload: string, signature: string, secret: string): boolean {
  const expected = hmacSign(payload, secret);
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

// ============ Room-scoped JWT ============

export interface RoomJwtPayload {
  roomId: string;
  slug: string;
  userId: string;
  displayName: string;
  isGuest: boolean;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Issue a short-lived room-scoped JWT.
 * Used to authenticate the Socket.IO handshake.
 */
export function signRoomToken(payload: Omit<RoomJwtPayload, "iat" | "exp">, ttlSeconds = 4 * 60 * 60): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set");
  return jwt.sign(payload, secret, { expiresIn: ttlSeconds });
}

export function verifyRoomToken(token: string): RoomJwtPayload | null {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return null;
  try {
    return jwt.verify(token, secret) as RoomJwtPayload;
  } catch {
    return null;
  }
}
