/**
 * Simple in-memory rate limiter for public-facing money-adjacent routes.
 *
 * Per-IP and per-phone limits with sliding window.
 * No external dependencies — uses a Map with periodic cleanup.
 * Not suitable for distributed multi-instance deployments
 * (use Redis/Upstash for that), but sufficient for Vercel's
 * single-region serverless with this traffic volume.
 */

interface RateLimitEntry {
  timestamps: number[]
}

const store = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000
const WINDOW_MS = 60 * 1000 // 1 minute sliding window

if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
      // Remove timestamps outside the window
      entry.timestamps = entry.timestamps.filter(t => now - t < WINDOW_MS)
      if (entry.timestamps.length === 0) {
        store.delete(key)
      }
    }
  }, CLEANUP_INTERVAL)
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
   resetAt: number
}

/**
 * Check rate limit for a given key.
 *
 * @param key - Unique identifier (e.g., "ip:1.2.3.4" or "phone:254712345678")
 * @param maxRequests - Maximum requests allowed in the window
 * @returns RateLimitResult with allowed flag and metadata
 */
export function checkRateLimit(key: string, maxRequests: number = 10): RateLimitResult {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry) {
    store.set(key, { timestamps: [now] })
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + WINDOW_MS }
  }

  // Filter to current window
  entry.timestamps = entry.timestamps.filter(t => now - t < WINDOW_MS)

  if (entry.timestamps.length >= maxRequests) {
    const oldestInWindow = entry.timestamps[0]
    return {
      allowed: false,
      remaining: 0,
      resetAt: oldestInWindow + WINDOW_MS,
    }
  }

  entry.timestamps.push(now)
  return {
    allowed: true,
    remaining: maxRequests - entry.timestamps.length,
    resetAt: now + WINDOW_MS,
  }
}

/**
 * Extract client IP from NextRequest headers.
 * Checks X-Forwarded-For (set by Caddy/Vercel), then X-Real-IP,
 * then falls back to connection remote address.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp
  return 'unknown'
}

/**
 * Middleware helper: check rate limit, return 429 if exceeded.
 */
export function rateLimitOrThrow(req: Request, maxRequests: number = 10): void {
  const ip = getClientIp(req)
  const result = checkRateLimit(`ip:${ip}`, maxRequests)
  if (!result.allowed) {
    const err = new Error(`Rate limit exceeded. Try again after ${new Date(result.resetAt).toISOString()}`)
    ;(err as any).statusCode = 429
    ;(err as any).rateLimitInfo = result
    throw err
  }
}
