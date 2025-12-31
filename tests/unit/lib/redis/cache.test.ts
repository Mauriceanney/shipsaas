import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock dependencies BEFORE imports
vi.mock("@/lib/redis/client");

import { getCachedData, invalidateCache, invalidateUserDashboard, invalidateAdminDashboard, CACHE_KEYS, CACHE_TTL } from "@/lib/redis/cache";
import { redis, safeRedisOperation } from "@/lib/redis/client";

describe("cache utility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("CACHE_KEYS", () => {
    it("generates user dashboard key with userId", () => {
      const key = CACHE_KEYS.userDashboard("user-123");
      expect(key).toBe("dashboard:user:user-123:metrics");
    });

    it("generates admin dashboard key", () => {
      const key = CACHE_KEYS.adminDashboard();
      expect(key).toBe("dashboard:admin:metrics");
    });
  });

  describe("CACHE_TTL", () => {
    it("has correct TTL for user dashboard", () => {
      expect(CACHE_TTL.userDashboard).toBe(300);
    });

    it("has correct TTL for admin dashboard", () => {
      expect(CACHE_TTL.adminDashboard).toBe(60);
    });
  });

  describe("getCachedData", () => {
    it("returns cached data when cache hit", async () => {
      const mockData = { count: 42, name: "test" };
      const cached = JSON.stringify(mockData);

      // Mock safeRedisOperation to call the operation successfully
      vi.mocked(safeRedisOperation).mockImplementationOnce(async (operation) => {
        return await operation();
      });
      vi.mocked(redis.get).mockResolvedValueOnce(cached);

      const fallback = vi.fn().mockResolvedValue({ count: 0, name: "fallback" });
      const result = await getCachedData("test-key", fallback, 300);

      expect(result).toEqual(mockData);
      expect(redis.get).toHaveBeenCalledWith("test-key");
      expect(fallback).not.toHaveBeenCalled();
    });

    it("calls fallback when cache miss", async () => {
      const fallbackData = { count: 99, name: "fresh" };

      // Mock first safeRedisOperation (get) returns null
      vi.mocked(safeRedisOperation).mockImplementationOnce(async (operation) => {
        return await operation();
      });
      vi.mocked(redis.get).mockResolvedValueOnce(null);

      // Mock second safeRedisOperation (set) - fire and forget
      vi.mocked(safeRedisOperation).mockImplementationOnce(async (operation) => {
        return await operation();
      });
      vi.mocked(redis.setex).mockResolvedValueOnce("OK");

      const fallback = vi.fn().mockResolvedValue(fallbackData);
      const result = await getCachedData("test-key", fallback, 300);

      expect(result).toEqual(fallbackData);
      expect(fallback).toHaveBeenCalled();
    });

    it("caches fallback result after cache miss", async () => {
      const fallbackData = { count: 99, name: "fresh" };

      // Mock get operation
      vi.mocked(safeRedisOperation).mockImplementationOnce(async (operation) => {
        return await operation();
      });
      vi.mocked(redis.get).mockResolvedValueOnce(null);

      // Mock set operation
      vi.mocked(safeRedisOperation).mockImplementationOnce(async (operation) => {
        return await operation();
      });
      vi.mocked(redis.setex).mockResolvedValueOnce("OK");

      const fallback = vi.fn().mockResolvedValue(fallbackData);
      await getCachedData("test-key", fallback, 300);

      expect(redis.setex).toHaveBeenCalledWith(
        "test-key",
        300,
        JSON.stringify(fallbackData)
      );
    });

    it("falls back gracefully when Redis fails", async () => {
      const fallbackData = { count: 99, name: "fresh" };

      // Mock safeRedisOperation to return null on Redis failure
      vi.mocked(safeRedisOperation).mockResolvedValueOnce(null);

      const fallback = vi.fn().mockResolvedValue(fallbackData);
      const result = await getCachedData("test-key", fallback, 300);

      expect(result).toEqual(fallbackData);
      expect(fallback).toHaveBeenCalled();
    });

    it("handles BigInt serialization for storage bytes", async () => {
      const mockData = {
        storage: { used: BigInt(1024000), limit: 5000000 },
      };
      const cached = JSON.stringify(mockData, (key, value) =>
        typeof value === "bigint" ? value.toString() : value
      );

      vi.mocked(safeRedisOperation).mockImplementationOnce(async (operation) => {
        return await operation();
      });
      vi.mocked(redis.get).mockResolvedValueOnce(cached);

      const fallback = vi.fn();
      const result = await getCachedData("test-key", fallback, 300);

      expect(result).toEqual({
        storage: { used: BigInt(1024000), limit: 5000000 },
      });
    });

    it("handles complex objects with nested BigInt", async () => {
      const mockData = {
        usage: {
          storageBytes: BigInt(999999),
          apiCalls: 150,
        },
        nested: {
          used: BigInt(500),
          limit: 1000,
        },
      };
      const cached = JSON.stringify(mockData, (key, value) =>
        typeof value === "bigint" ? value.toString() : value
      );

      vi.mocked(safeRedisOperation).mockImplementationOnce(async (operation) => {
        return await operation();
      });
      vi.mocked(redis.get).mockResolvedValueOnce(cached);

      const fallback = vi.fn();
      const result = await getCachedData("test-key", fallback, 300);

      expect(result).toEqual({
        usage: {
          storageBytes: BigInt(999999),
          apiCalls: 150,
        },
        nested: {
          used: BigInt(500),
          limit: 1000,
        },
      });
    });
  });

  describe("invalidateCache", () => {
    it("deletes cache key", async () => {
      vi.mocked(safeRedisOperation).mockImplementationOnce(async (operation) => {
        return await operation();
      });
      vi.mocked(redis.del).mockResolvedValueOnce(1);

      await invalidateCache("test-key");

      expect(redis.del).toHaveBeenCalledWith("test-key");
    });

    it("handles Redis errors gracefully", async () => {
      // Mock safeRedisOperation to handle error and return fallback
      vi.mocked(safeRedisOperation).mockImplementationOnce(async (operation, fallback) => {
        try {
          return await operation();
        } catch {
          return fallback;
        }
      });
      vi.mocked(redis.del).mockRejectedValueOnce(new Error("Redis error"));

      // Should not throw
      await expect(invalidateCache("test-key")).resolves.toBeUndefined();
    });
  });

  describe("invalidateUserDashboard", () => {
    it("invalidates user dashboard cache", async () => {
      vi.mocked(safeRedisOperation).mockImplementationOnce(async (operation) => {
        return await operation();
      });
      vi.mocked(redis.del).mockResolvedValueOnce(1);

      await invalidateUserDashboard("user-123");

      expect(redis.del).toHaveBeenCalledWith("dashboard:user:user-123:metrics");
    });
  });

  describe("invalidateAdminDashboard", () => {
    it("invalidates admin dashboard cache", async () => {
      vi.mocked(safeRedisOperation).mockImplementationOnce(async (operation) => {
        return await operation();
      });
      vi.mocked(redis.del).mockResolvedValueOnce(1);

      await invalidateAdminDashboard();

      expect(redis.del).toHaveBeenCalledWith("dashboard:admin:metrics");
    });
  });
});
