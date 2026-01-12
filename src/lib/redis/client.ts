/**
 * Redis Client Singleton
 *
 * Provides a single Redis connection instance with proper error handling
 * and connection management for rate limiting, caching, and health checks.
 */

import Redis from "ioredis";

// Global singleton for hot-reload in development
const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

/**
 * Creates a Redis client with proper configuration
 */
function createRedisClient(): Redis {
  const redisUrl = process.env["REDIS_URL"] || "redis://localhost:6379";
  const redisPassword = process.env["REDIS_PASSWORD"];

  const client = new Redis(redisUrl, {
    ...(redisPassword && { password: redisPassword }),
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      // Exponential backoff with max 3 seconds
      if (times > 3) return null;
      return Math.min(times * 100, 3000);
    },
    // Reconnect on error
    reconnectOnError(err) {
      const targetError = "READONLY";
      if (err.message.includes(targetError)) {
        return true;
      }
      return false;
    },
  });

  // Error handling
  client.on("error", (err) => {
    console.error("[Redis] Connection error:", err.message);
  });

  client.on("connect", () => {
    if (process.env.NODE_ENV === "development") {
      console.log("[Redis] Connected");
    }
  });

  return client;
}

/**
 * Get the Redis client singleton
 */
export function getRedis(): Redis {
  if (!globalForRedis.redis) {
    globalForRedis.redis = createRedisClient();
  }
  return globalForRedis.redis;
}

// Default export for convenience
export const redis = getRedis();

/**
 * Check if Redis is connected and responding
 */
export async function isRedisConnected(): Promise<boolean> {
  try {
    const client = getRedis();
    await client.ping();
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely execute a Redis operation with fallback
 * Useful for non-critical operations that shouldn't fail the request
 */
export async function safeRedisOperation<T>(
  operation: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error("[Redis] Operation failed:", error);
    return fallback;
  }
}
