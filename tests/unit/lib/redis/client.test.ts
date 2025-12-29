import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock ioredis before importing
vi.mock("ioredis", () => {
  const MockRedis = vi.fn().mockImplementation(() => ({
    ping: vi.fn().mockResolvedValue("PONG"),
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue("OK"),
    del: vi.fn().mockResolvedValue(1),
    quit: vi.fn().mockResolvedValue("OK"),
    on: vi.fn(),
    status: "ready",
  }));
  return { default: MockRedis };
});

describe("Redis Client", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getRedis", () => {
    it("should return a Redis instance", async () => {
      const { getRedis } = await import("@/lib/redis/client");
      const redis = getRedis();

      expect(redis).toBeDefined();
      expect(redis.ping).toBeDefined();
    });

    it("should return the same instance on multiple calls (singleton)", async () => {
      const { getRedis } = await import("@/lib/redis/client");
      const redis1 = getRedis();
      const redis2 = getRedis();

      expect(redis1).toBe(redis2);
    });
  });

  describe("isRedisConnected", () => {
    it("should return true when Redis responds to ping", async () => {
      const { isRedisConnected } = await import("@/lib/redis/client");
      const connected = await isRedisConnected();

      expect(connected).toBe(true);
    });

    it("should return false when Redis ping fails", async () => {
      const { getRedis, isRedisConnected } = await import("@/lib/redis/client");
      const redis = getRedis();

      // Override ping to simulate failure
      vi.mocked(redis.ping).mockRejectedValueOnce(new Error("Connection refused"));

      const connected = await isRedisConnected();
      expect(connected).toBe(false);
    });
  });

  describe("safeRedisOperation", () => {
    it("should return result on success", async () => {
      const { safeRedisOperation, getRedis } = await import("@/lib/redis/client");
      const redis = getRedis();
      vi.mocked(redis.get).mockResolvedValue("value");

      const result = await safeRedisOperation(
        () => redis.get("key"),
        "default"
      );

      expect(result).toBe("value");
    });

    it("should return fallback on error", async () => {
      const { safeRedisOperation, getRedis } = await import("@/lib/redis/client");
      const redis = getRedis();
      vi.mocked(redis.get).mockRejectedValue(new Error("Redis error"));

      const result = await safeRedisOperation(
        () => redis.get("key"),
        "fallback"
      );

      expect(result).toBe("fallback");
    });
  });
});
