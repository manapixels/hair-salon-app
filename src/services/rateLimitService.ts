/**
 * Rate Limiting Service
 *
 * Protects API endpoints from spam and abuse by limiting requests per IP/user.
 * Uses in-memory storage with automatic cleanup.
 *
 * For production with multiple servers, consider Redis-based rate limiting.
 */

interface RateLimitEntry {
  timestamps: number[];
  blocked: boolean;
  blockUntil?: number;
}

// Store rate limit data: identifier -> entry
const rateLimitStore: Record<string, RateLimitEntry> = {};

// Configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute
const BLOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes block for exceeding limit

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (phone number, telegram ID, or IP)
 * @returns Object with allowed status and remaining requests
 */
export function checkRateLimit(identifier: string): {
  allowed: boolean;
  remaining: number;
  retryAfter?: number;
} {
  const now = Date.now();
  const entry = rateLimitStore[identifier] || { timestamps: [], blocked: false };

  // Check if currently blocked
  if (entry.blocked && entry.blockUntil) {
    if (now < entry.blockUntil) {
      return {
        allowed: false,
        remaining: 0,
        retryAfter: Math.ceil((entry.blockUntil - now) / 1000), // seconds
      };
    } else {
      // Block expired, reset
      entry.blocked = false;
      entry.blockUntil = undefined;
      entry.timestamps = [];
    }
  }

  // Filter out timestamps outside the current window
  entry.timestamps = entry.timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);

  // Check if limit exceeded
  if (entry.timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    // Block user
    entry.blocked = true;
    entry.blockUntil = now + BLOCK_DURATION_MS;
    rateLimitStore[identifier] = entry;

    console.warn(
      `[Rate Limit] Blocked ${identifier} for ${BLOCK_DURATION_MS / 1000}s (exceeded ${MAX_REQUESTS_PER_WINDOW} requests/min)`,
    );

    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil(BLOCK_DURATION_MS / 1000),
    };
  }

  // Add current timestamp
  entry.timestamps.push(now);
  rateLimitStore[identifier] = entry;

  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_WINDOW - entry.timestamps.length,
  };
}

/**
 * Cleanup old entries (run periodically)
 */
export function cleanupRateLimitStore(): number {
  const now = Date.now();
  let cleaned = 0;

  for (const identifier in rateLimitStore) {
    const entry = rateLimitStore[identifier];

    // Remove if no recent activity and not blocked
    const lastActivity = entry.timestamps[entry.timestamps.length - 1] || 0;
    const isOld = now - lastActivity > RATE_LIMIT_WINDOW_MS * 2;
    const blockExpired = entry.blocked && entry.blockUntil && now > entry.blockUntil;

    if (isOld || blockExpired) {
      delete rateLimitStore[identifier];
      cleaned++;
    }
  }

  return cleaned;
}

/**
 * Reset rate limit for a specific identifier (admin override)
 */
export function resetRateLimit(identifier: string): void {
  delete rateLimitStore[identifier];
  console.log(`[Rate Limit] Reset rate limit for ${identifier}`);
}

// Run cleanup every 5 minutes
setInterval(
  () => {
    const cleaned = cleanupRateLimitStore();
    if (cleaned > 0) {
      console.log(`[Rate Limit] Cleaned up ${cleaned} old entries`);
    }
  },
  5 * 60 * 1000,
);
