/**
 * In-memory sliding-window rate limit (per Node process).
 * Enough for a single PM2 instance on one VPS.
 */

type Bucket = number[]

const buckets = new Map<string, Bucket>()

const MAX_KEYS = 10_000

function pruneIfNeeded(): void {
  if (buckets.size <= MAX_KEYS) return
  // Drop oldest half of keys (Map insertion order)
  const drop = Math.ceil(buckets.size / 2)
  let i = 0
  for (const key of buckets.keys()) {
    buckets.delete(key)
    i += 1
    if (i >= drop) break
  }
}

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number }

/**
 * @param key unique client id (e.g. IP)
 * @param limit max hits in the window
 * @param windowMs window length in ms
 */
export function consumeRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const prev = buckets.get(key) ?? []
  const recent = prev.filter((t) => now - t < windowMs)

  if (recent.length >= limit) {
    const oldest = recent[0] ?? now
    const retryAfterSec = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000))
    buckets.set(key, recent)
    return { ok: false, retryAfterSec }
  }

  recent.push(now)
  buckets.set(key, recent)
  pruneIfNeeded()
  return { ok: true }
}

/** Client IP behind nginx / Cloudflare. */
export function getRequestClientIp(request: Request): string {
  const headers = request.headers
  const forwarded = headers.get("x-forwarded-for")
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim()
    if (first) return first
  }
  const realIp = headers.get("x-real-ip")?.trim()
  if (realIp) return realIp
  return "unknown"
}
