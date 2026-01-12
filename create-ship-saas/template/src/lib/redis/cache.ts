/**
 * Redis Cache Utility
 * Provides generic caching with graceful fallback
 */

import { redis, safeRedisOperation } from "./client";

/**
 * Cache key patterns
 */
export const CACHE_KEYS = {
  userDashboard: (userId: string) => `dashboard:user:${userId}:metrics`,
  adminDashboard: () => "dashboard:admin:metrics",
  adminAnalytics: () => "analytics:admin:metrics",
} as const;

/**
 * TTL in seconds
 */
export const CACHE_TTL = {
  userDashboard: 300, // 5 minutes
  adminDashboard: 60, // 1 minute
  adminAnalytics: 60, // 1 minute
} as const;

/**
 * Get cached data with fallback
 * @param key Cache key
 * @param fallback Function to fetch fresh data on cache miss
 * @param ttlSeconds Time to live in seconds
 * @returns Cached data or fresh data from fallback
 */
export async function getCachedData<T>(
  key: string,
  fallback: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  // Try to get from cache
  const cached = await safeRedisOperation(
    async () => {
      const data = await redis.get(key);
      return data ? JSON.parse(data, reviver) : null;
    },
    null
  );

  if (cached !== null) {
    return cached as T;
  }

  // Fallback to fetch fresh data
  const freshData = await fallback();

  // Cache the result (fire and forget - don't await)
  safeRedisOperation(
    async () => {
      await redis.setex(key, ttlSeconds, JSON.stringify(freshData, replacer));
    },
    undefined
  );

  return freshData;
}

/**
 * Invalidate cache by key
 * @param key Cache key to invalidate
 */
export async function invalidateCache(key: string): Promise<void> {
  await safeRedisOperation(
    async () => {
      await redis.del(key);
    },
    undefined
  );
}

/**
 * Invalidate user dashboard cache
 * @param userId User ID
 */
export async function invalidateUserDashboard(userId: string): Promise<void> {
  await invalidateCache(CACHE_KEYS.userDashboard(userId));
}

/**
 * Invalidate admin dashboard cache
 */
export async function invalidateAdminDashboard(): Promise<void> {
  await invalidateCache(CACHE_KEYS.adminDashboard());
}

/**
 * Handle BigInt serialization
 * Converts BigInt to string for JSON serialization
 */
function replacer(_key: string, value: unknown): unknown {
  return typeof value === "bigint" ? value.toString() : value;
}

/**
 * Handle BigInt deserialization
 * Converts storage bytes back to BigInt if needed
 */
function reviver(_key: string, value: unknown): unknown {
  // Convert storage bytes back to BigInt if needed
  if (_key === "used" || _key === "limit" || _key === "storageBytes") {
    return typeof value === "string" && /^\d+$/.test(value) ? BigInt(value) : value;
  }
  return value;
}
