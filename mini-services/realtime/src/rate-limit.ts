/**
 * Per-socket, per-event-type token bucket rate limiter.
 * Lives in the realtime server process (not shared with the Next.js API rate limiter).
 */

interface Bucket {
  tokens: number;
  lastRefill: number;
}

interface RateLimitConfig {
  capacity: number;
  refillPerSecond: number;
}

const DEFAULTS: Record<string, RateLimitConfig> = {
  "chat:message": { capacity: 30, refillPerSecond: 0.5 }, // 30 burst, 30/min sustained
  "chat:typing": { capacity: 20, refillPerSecond: 1 }, // 20 burst, 60/min sustained
  "chat:reaction": { capacity: 60, refillPerSecond: 1 },
  "media:*": { capacity: 60, refillPerSecond: 2 },
  "webrtc:*": { capacity: 100, refillPerSecond: 10 },
  default: { capacity: 30, refillPerSecond: 1 },
};

const buckets = new Map<string, Bucket>();

export function checkRateLimit(
  socketId: string,
  eventType: string
): { ok: boolean; remaining: number; resetInMs: number } {
  const key = `${socketId}:${eventType}`;
  const config = DEFAULTS[eventType] ?? DEFAULTS.default;
  const now = Date.now();
  const nowSec = now / 1000;

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { tokens: config.capacity, lastRefill: nowSec };
    buckets.set(key, bucket);
  }

  // Refill
  const elapsed = nowSec - bucket.lastRefill;
  bucket.tokens = Math.min(config.capacity, bucket.tokens + elapsed * config.refillPerSecond);
  bucket.lastRefill = nowSec;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return { ok: true, remaining: Math.floor(bucket.tokens), resetInMs: 0 };
  }

  const msUntilNext = Math.ceil(((1 - bucket.tokens) / config.refillPerSecond) * 1000);
  return { ok: false, remaining: 0, resetInMs: msUntilNext };
}

// Periodic cleanup of stale buckets
setInterval(() => {
  const cutoff = Date.now() / 1000 - 30 * 60; // 30 min idle
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.lastRefill < cutoff) buckets.delete(key);
  }
}, 5 * 60 * 1000).unref?.();
