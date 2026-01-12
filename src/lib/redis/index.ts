/**
 * Redis Module
 * Provides Redis client, caching, and utilities
 */

export { redis, getRedis, isRedisConnected, safeRedisOperation } from "./client";
export {
  getCachedData,
  invalidateCache,
  invalidateUserDashboard,
  invalidateAdminDashboard,
  CACHE_KEYS,
  CACHE_TTL,
} from "./cache";
