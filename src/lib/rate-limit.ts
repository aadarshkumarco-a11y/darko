/**
 * Simple in-memory token bucket rate limiter.
 * Suitable for serverless (per-instance limit) and single-process servers.
 * For multi-instance production, swap with Redis-backed implementation.
 */

interface Bucket {
  tokens: number;
  lastRefill: number;
}

interface RateLimitConfig {
  /** Maximum tokens in the bucket (burst capacity). */
  capacity: number;
  /** Tokens added per second (sustained rate). */
  refillPerSecond: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  capacity: 30,
  refillPerSecond: 0.5,
};

const buckets = new Map<string, Bucket>();
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  const cutoff = now - 30 * 60 * 1000; // remove idle buckets older than 30min
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.lastRefill < cutoff) {
      buckets.delete(key);
    }
  }
  lastCleanup = now;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetInMs: number;
}

export function rateLimit(
  key: string,
  config: Partial<RateLimitConfig> = {}
): RateLimitResult {
  cleanup();
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const now = Date.now();
  const nowSec = now / 1000;

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { tokens: cfg.capacity, lastRefill: nowSec };
    buckets.set(key, bucket);
  }

  // Refill tokens based on elapsed time
  const elapsed = nowSec - bucket.lastRefill;
  bucket.tokens = Math.min(cfg.capacity, bucket.tokens + elapsed * cfg.refillPerSecond);
  bucket.lastRefill = nowSec;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return {
      ok: true,
      remaining: Math.floor(bucket.tokens),
      resetInMs: 0,
    };
  }

  // Tokens depleted — calculate time until next token
  const msUntilNext = Math.ceil((1 - bucket.tokens) / cfg.refillPerSecond * 1000);
  return {
    ok: false,
    remaining: 0,
    resetInMs: msUntilNext,
  };
}

/**
 * Convenience: rate-limit by IP for API routes.
 */
export function rateLimitByIp(req: Request, config: Partial<RateLimitConfig> = {}): RateLimitResult {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  return rateLimit(`ip:${ip}`, config);
}
