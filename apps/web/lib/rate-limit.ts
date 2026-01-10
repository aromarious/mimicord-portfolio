import { type Duration, Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { env } from "@/env"
import { InMemoryRateLimit, parseWindow } from "@/lib/in-memory-ratelimit"
import { logger } from "@/lib/logger"

// Settings
const CONFIG = {
  upstashUrl: env.UPSTASH_REDIS_REST_URL,
  upstashToken: env.UPSTASH_REDIS_REST_TOKEN,
  disabled: env.DISABLE_RATE_LIMIT,
  maxRequests: env.RATE_LIMIT_MAX_REQUESTS || 10,
  window: (env.RATE_LIMIT_WINDOW as Duration) || "1 m",
} as const

const ANON_CONFIG = {
  maxRequests: Math.max(1, Math.floor(CONFIG.maxRequests / 2)),
  window: CONFIG.window,
} as const

const isProduction =
  process.env.NODE_ENV === "production" ||
  process.env.VERCEL_ENV === "production"

// Singleton instances
let ratelimit: Ratelimit | null = null
let fallback: InMemoryRateLimit | null = null
let anonRatelimit: Ratelimit | null = null
let anonFallback: InMemoryRateLimit | null = null
let rateLimitDisabled = false

// Initialize once on module load
function init() {
  if (CONFIG.disabled) {
    rateLimitDisabled = true
    console.log("[RateLimit] Disabled by config")
    // Warn if rate limiting is disabled in production
    if (isProduction) {
      console.warn(
        "[RateLimit] WARNING: Rate limiting is disabled in production environment!",
      )
    }
    return
  }

  if (CONFIG.upstashUrl && CONFIG.upstashToken) {
    try {
      const redis = new Redis({
        url: CONFIG.upstashUrl,
        token: CONFIG.upstashToken,
      })
      ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(CONFIG.maxRequests, CONFIG.window),
        analytics: true,
        prefix: "@upstash/ratelimit",
      })
      anonRatelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(
          ANON_CONFIG.maxRequests,
          ANON_CONFIG.window,
        ),
        analytics: true,
        prefix: "@upstash/ratelimit-anon",
      })
    } catch (e) {
      console.error("[RateLimit] Redis initialization failed:", e)
      // Fallback if Redis init fails immediately
      fallback = new InMemoryRateLimit(
        CONFIG.maxRequests,
        parseWindow(CONFIG.window),
      )
      anonFallback = new InMemoryRateLimit(
        ANON_CONFIG.maxRequests,
        parseWindow(ANON_CONFIG.window),
      )
    }
  } else {
    // If no credentials, use in-memory rate limiting in production for safety
    if (isProduction) {
      console.warn(
        "[RateLimit] Missing Redis credentials in production, using in-memory rate limiting",
      )
      fallback = new InMemoryRateLimit(
        CONFIG.maxRequests,
        parseWindow(CONFIG.window),
      )
      anonFallback = new InMemoryRateLimit(
        ANON_CONFIG.maxRequests,
        parseWindow(ANON_CONFIG.window),
      )
    } else {
      console.warn(
        "[RateLimit] Rate limiting could not be applied: missing Redis credentials",
      )
    }
  }
}

init()

export type RateLimitResult = {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

/**
 * Check rate limit for a key.
 * Tries Redis -> Fallback (In-Memory) -> Fail Open (Allow)
 */
export async function checkRateLimit(
  key: string,
  options?: { mode?: "ip" | "anonymous" },
): Promise<RateLimitResult> {
  const successResult: RateLimitResult = {
    success: true,
    limit: 0,
    remaining: 0,
    reset: 0,
  }

  const failureResult: RateLimitResult = {
    success: false,
    limit: 0,
    remaining: 0,
    reset: Date.now(),
  }

  if (rateLimitDisabled) {
    return successResult
  }

  const mode = options?.mode ?? "ip"
  const primary = mode === "anonymous" ? anonRatelimit : ratelimit
  const backup = mode === "anonymous" ? anonFallback : fallback

  // If both are null (disabled or not init), allow in non-production only.
  if (!primary && !backup) {
    if (isProduction) {
      console.error("[RateLimit] Rate limiter is not initialized.")
      return failureResult
    }
    return successResult
  }

  try {
    if (primary) {
      return await primary.limit(key)
    }
    if (backup) {
      return await backup.limit(key)
    }
  } catch (e) {
    logger.error({ key, error: e }, "RateLimit check failed")

    // If Redis failed during check, try fallback if available, or create one on the fly?
    // For now, if we had a Redis instance but it failed, we could try to use a fallback.
    // The previous implementation utilized a `fallbackRateLimit` variable.
    // Let's ensure we can use it.

    if (primary && !backup) {
      // Lazy init fallback if Redis fails at runtime?
      // Or just assume if init passed, we only have one.
      // To be safe and mimic previous logic:
      try {
        if (!backup) {
          if (mode === "anonymous") {
            anonFallback = new InMemoryRateLimit(
              ANON_CONFIG.maxRequests,
              parseWindow(ANON_CONFIG.window),
            )
          } else {
            fallback = new InMemoryRateLimit(
              CONFIG.maxRequests,
              parseWindow(CONFIG.window),
            )
          }
        }
        const nextBackup = mode === "anonymous" ? anonFallback : fallback
        if (nextBackup) {
          return await nextBackup.limit(key)
        }
      } catch (fallbackError) {
        console.error("[RateLimit] Fallback also failed:", fallbackError)
      }
    } else if (backup) {
      // If fallback itself failed
      console.error("[RateLimit] Fallback failed:", e)
    }
  }

  if (isProduction) {
    console.error("[RateLimit] limiter failed.")
    return failureResult
  }

  // Fail open in non-production
  return successResult
}
