import { headers } from "next/headers";

import { getRedis } from "@/lib/redis";

/**
 * Rate Limiting
 *
 * Distributed rate limiting using Redis sorted sets for sliding window algorithm.
 * Protects API endpoints and server actions from abuse.
 */

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
 * Sliding window rate limiter using Redis sorted sets
 *
 * Algorithm:
 * 1. Remove expired entries older than window start
 * 2. Count remaining entries
 * 3. Add current request with timestamp score
 * 4. Set TTL on the key
 */
export async function rateLimit(
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const { key, limit, window } = config;
  const now = Date.now();
  const windowStart = now - window * 1000;
  const redisKey = `ratelimit:${key}`;

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

    return { success, limit, remaining, reset };
  } catch (error) {
    // Fail open: allow request if Redis is unavailable
    console.error("[RateLimit] Redis error, failing open:", error);
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: Math.ceil((now + window * 1000) / 1000),
    };
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
