/**
 * Rate Limiting with In-Memory Fallback
 *
 * Distributed rate limiting using Redis sorted sets for sliding window algorithm.
 * Falls back to in-memory limiting when Redis is unavailable.
 * Protects API endpoints and server actions from abuse.
 */

import { headers } from "next/headers";
import { logger } from "@/lib/logger";
import { getRedis } from "@/lib/redis";

export interface RateLimitConfig {
  key: string; // Identifier (e.g., user ID, IP address)
  limit: number; // Max requests allowed
  window: number; // Time window in seconds
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp when window resets
}

/**
 * In-Memory Rate Limiter Fallback
 * Used when Redis is unavailable
 */
class InMemoryRateLimiter {
  private cache = new Map<string, { timestamps: number[]; lastAccess: number }>();
  private readonly MAX_ENTRIES = 10000;
  private readonly FALLBACK_MULTIPLIER = 0.5; // Use 50% of configured limits
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Start automatic cleanup every 60 seconds
    if (typeof globalThis !== "undefined") {
      this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    }
  }

  check(key: string, limit: number, window: number): RateLimitResult {
    const now = Date.now();
    const windowStart = now - window * 1000;
    const conservativeLimit = Math.max(1, Math.floor(limit * this.FALLBACK_MULTIPLIER));

    // Get or create entry
    let entry = this.cache.get(key);
    if (!entry) {
      entry = { timestamps: [], lastAccess: now };
      this.cache.set(key, entry);
    }

    // Enforce max entries (LRU eviction)
    if (this.cache.size > this.MAX_ENTRIES) {
      this.evictOldest();
      logger.warn(
        {
          component: "rate-limit",
          entriesCount: this.cache.size,
        },
        "Rate limiter fallback approaching memory limit, evicting oldest entries"
      );
    }

    // Remove expired timestamps
    entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);
    entry.lastAccess = now;

    const currentCount = entry.timestamps.length;
    const success = currentCount < conservativeLimit;

    // Add current request timestamp if allowed
    if (success) {
      entry.timestamps.push(now);
    }

    const remaining = Math.max(0, conservativeLimit - entry.timestamps.length);
    const reset = Math.ceil((now + window * 1000) / 1000);

    return {
      success,
      limit, // Return original limit (not conservative)
      remaining,
      reset,
    };
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccess < oldestTime) {
        oldestTime = entry.lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour

    for (const [key, entry] of this.cache.entries()) {
      // Remove entries that haven't been accessed in 1 hour
      if (now - entry.lastAccess > maxAge) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

/**
 * Circuit Breaker for Redis
 * Tracks failures and switches to fallback
 */
class CircuitBreaker {
  private consecutiveFailures = 0;
  private lastFailureTime = 0;
  private readonly FAILURE_THRESHOLD = 3;
  private retryTimeout: number;
  private fallbackActivatedAt: number | null = null;

  constructor(retryTimeoutMs: number = 30000) {
    this.retryTimeout = retryTimeoutMs;
  }

  recordFailure(): void {
    this.consecutiveFailures++;
    this.lastFailureTime = Date.now();

    if (this.consecutiveFailures === this.FAILURE_THRESHOLD && !this.fallbackActivatedAt) {
      this.fallbackActivatedAt = Date.now();
      logger.warn(
        {
          component: "rate-limit",
          event: "fallback_activated",
          consecutiveFailures: this.consecutiveFailures,
        },
        "Rate limiter using in-memory fallback due to Redis failures"
      );
    }
  }

  recordSuccess(): void {
    if (this.consecutiveFailures >= this.FAILURE_THRESHOLD && this.fallbackActivatedAt) {
      const downtimeDuration = Math.floor((Date.now() - this.fallbackActivatedAt) / 1000);
      logger.info(
        {
          component: "rate-limit",
          event: "redis_recovered",
          downtimeDuration: `${downtimeDuration}s`,
        },
        "Rate limiter resumed using Redis"
      );
    }
    this.consecutiveFailures = 0;
    this.fallbackActivatedAt = null;
  }

  shouldUseFallback(): boolean {
    if (this.consecutiveFailures < this.FAILURE_THRESHOLD) {
      return false;
    }

    // After threshold, attempt Redis again after timeout
    const timeSinceFailure = Date.now() - this.lastFailureTime;
    return timeSinceFailure < this.retryTimeout;
  }
}

// Global singletons
const globalForRateLimit = globalThis as unknown as {
  inMemoryLimiter?: InMemoryRateLimiter;
  circuitBreaker?: CircuitBreaker;
};

function getInMemoryLimiter(): InMemoryRateLimiter {
  if (!globalForRateLimit.inMemoryLimiter) {
    globalForRateLimit.inMemoryLimiter = new InMemoryRateLimiter();
  }
  return globalForRateLimit.inMemoryLimiter;
}

function getCircuitBreaker(): CircuitBreaker {
  if (!globalForRateLimit.circuitBreaker) {
    // Use 1 second timeout in test environment, 30 seconds in production
    const timeout = process.env.NODE_ENV === "test" ? 1000 : 30000;
    globalForRateLimit.circuitBreaker = new CircuitBreaker(timeout);
  }
  return globalForRateLimit.circuitBreaker;
}

/**
 * Sliding window rate limiter using Redis sorted sets with in-memory fallback
 *
 * Algorithm:
 * 1. Check circuit breaker - use fallback if circuit is open
 * 2. Try Redis:
 *    - Remove expired entries older than window start
 *    - Count remaining entries
 *    - Add current request with timestamp score
 *    - Set TTL on the key
 * 3. On Redis failure - use in-memory fallback
 */
export async function rateLimit(config: RateLimitConfig): Promise<RateLimitResult> {
  const { key, limit, window } = config;
  const now = Date.now();
  const windowStart = now - window * 1000;
  const redisKey = `ratelimit:${key}`;
  const circuitBreaker = getCircuitBreaker();

  // Check circuit breaker - skip Redis if circuit is open
  if (circuitBreaker.shouldUseFallback()) {
    const fallback = getInMemoryLimiter();
    return fallback.check(key, limit, window);
  }

  try {
    const redis = getRedis();

    // Use Redis pipeline for atomic operations
    const pipeline = redis.pipeline();

    // Remove expired entries
    pipeline.zremrangebyscore(redisKey, 0, windowStart);
    // Count current entries
    pipeline.zcard(redisKey);
    // Add current request with unique timestamp
    pipeline.zadd(redisKey, now, `${now}-${Math.random().toString(36).slice(2)}`);
    // Set TTL to auto-cleanup
    pipeline.expire(redisKey, window);

    const results = await pipeline.exec();
    const currentCount = (results?.[1]?.[1] as number) || 0;

    const success = currentCount < limit;
    const remaining = Math.max(0, limit - currentCount - 1);
    const reset = Math.ceil((now + window * 1000) / 1000);

    // Record success
    circuitBreaker.recordSuccess();

    return { success, limit, remaining, reset };
  } catch (error) {
    // Record failure
    circuitBreaker.recordFailure();

    // Log error with context
    logger.warn(
      {
        component: "rate-limit",
        event: "fallback_used",
        error: error instanceof Error ? error.message : "Unknown error",
        key,
      },
      "Rate limiter using fallback due to Redis error"
    );

    // Use in-memory fallback
    const fallback = getInMemoryLimiter();
    return fallback.check(key, limit, window);
  }
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const rateLimiters = {
  /**
   * Auth endpoints: 5 requests per minute
   * Strict limit to prevent brute force attacks
   */
  auth: (identifier: string) =>
    rateLimit({
      key: `auth:${identifier}`,
      limit: 5,
      window: 60,
    }),

  /**
   * Password reset: 3 requests per 15 minutes
   * Very strict to prevent email enumeration
   */
  passwordReset: (identifier: string) =>
    rateLimit({
      key: `pwd-reset:${identifier}`,
      limit: 3,
      window: 900, // 15 minutes
    }),

  /**
   * API endpoints: 100 requests per minute
   * General API rate limit
   */
  api: (identifier: string) =>
    rateLimit({
      key: `api:${identifier}`,
      limit: 100,
      window: 60,
    }),

  /**
   * Webhooks: 1000 requests per minute
   * Higher limit for trusted webhook sources
   */
  webhook: (identifier: string) =>
    rateLimit({
      key: `webhook:${identifier}`,
      limit: 1000,
      window: 60,
    }),

  /**
   * Two-Factor Authentication: 5 attempts per 5 minutes
   * Strict limit to prevent TOTP brute force
   */
  twoFactor: (identifier: string) =>
    rateLimit({
      key: `2fa:${identifier}`,
      limit: 5,
      window: 300, // 5 minutes
    }),

  /**
   * Forgot password: 5 requests per hour per email
   * Prevents abuse while allowing legitimate retries
   */
  forgotPassword: (email: string) =>
    rateLimit({
      key: `forgot-pwd:${email}`,
      limit: 5,
      window: 3600, // 1 hour
    }),

  /**
   * Data export: 3 requests per day per user
   * GDPR compliance while preventing abuse
   */
  dataExport: (userId: string) =>
    rateLimit({
      key: `data-export:${userId}`,
      limit: 3,
      window: 86400, // 24 hours
    }),

  /**
   * Retry payment: 3 requests per hour per user
   * Prevents payment retry spam
   */
  retryPayment: (userId: string) =>
    rateLimit({
      key: `retry-payment:${userId}`,
      limit: 3,
      window: 3600, // 1 hour
    }),
};

/**
 * Extract client IP address from request headers
 */
export function getClientIp(request: Request): string {
  const reqHeaders = request.headers;

  // Check x-forwarded-for (may contain multiple IPs)
  const forwarded = reqHeaders.get("x-forwarded-for");
  if (forwarded) {
    const ip = forwarded.split(",")[0]?.trim();
    if (ip) return ip;
  }

  // Check x-real-ip (single IP from reverse proxy)
  const realIp = reqHeaders.get("x-real-ip");
  if (realIp) return realIp;

  // Fallback
  return "unknown";
}

/**
 * Extract client IP from server action context
 * Uses next/headers to access request headers in Server Actions
 */
export async function getClientIpFromHeaders(): Promise<string> {
  try {
    const headersList = await headers();

    // Check x-forwarded-for (may contain multiple IPs)
    const forwarded = headersList.get("x-forwarded-for");
    if (forwarded) {
      const ip = forwarded.split(",")[0]?.trim();
      if (ip) return ip;
    }

    // Check x-real-ip (single IP from reverse proxy)
    const realIp = headersList.get("x-real-ip");
    if (realIp) return realIp;

    // Fallback
    return "unknown";
  } catch {
    // If headers() fails (e.g., not in a request context), return unknown
    return "unknown";
  }
}

/**
 * Create rate limit response headers
 */
export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.reset.toString(),
    ...(result.success
      ? {}
      : {
          "Retry-After": Math.max(
            1,
            Math.ceil(result.reset - Date.now() / 1000)
          ).toString(),
        }),
  };
}
