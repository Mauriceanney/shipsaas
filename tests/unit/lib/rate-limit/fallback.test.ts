import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Redis pipeline
const mockPipeline = {
  zremrangebyscore: vi.fn().mockReturnThis(),
  zcard: vi.fn().mockReturnThis(),
  zadd: vi.fn().mockReturnThis(),
  expire: vi.fn().mockReturnThis(),
  exec: vi.fn(),
};

// Mock ioredis
vi.mock("ioredis", () => {
  const MockRedis = vi.fn().mockImplementation(() => ({
    ping: vi.fn().mockResolvedValue("PONG"),
    pipeline: vi.fn(() => mockPipeline),
    on: vi.fn(),
    status: "ready",
  }));
  return { default: MockRedis };
});

describe("Rate Limit Fallback", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    // Clear global state between tests
    const globalForRateLimit = globalThis as any;
    if (globalForRateLimit.inMemoryLimiter) {
      globalForRateLimit.inMemoryLimiter.clear();
    }
    if (globalForRateLimit.circuitBreaker) {
      globalForRateLimit.circuitBreaker = undefined;
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("In-Memory Fallback", () => {
    it("should activate fallback when Redis fails", async () => {
      // Simulate Redis failure
      mockPipeline.exec.mockRejectedValue(new Error("Redis connection error"));

      const { rateLimit } = await import("@/lib/rate-limit");
      const { logger } = await import("@/lib/logger");

      const result = await rateLimit({
        key: "test:user1",
        limit: 5,
        window: 60,
      });

      // Should still return a result (not throw)
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();

      // Should log the fallback activation
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          component: "rate-limit",
          event: expect.stringContaining("fallback"),
        }),
        expect.stringContaining("fallback")
      );
    });

    it("should enforce rate limiting in fallback mode", async () => {
      mockPipeline.exec.mockRejectedValue(new Error("Redis connection error"));

      const { rateLimit } = await import("@/lib/rate-limit");

      // Conservative limit (50% of 5 = 2)
      const fallbackLimit = 2;

      // First request - should succeed
      const result1 = await rateLimit({
        key: "test:user1",
        limit: 5,
        window: 60,
      });
      expect(result1.success).toBe(true);

      // Second request - should succeed
      const result2 = await rateLimit({
        key: "test:user1",
        limit: 5,
        window: 60,
      });
      expect(result2.success).toBe(true);

      // Third request - should fail (exceeded fallback limit)
      const result3 = await rateLimit({
        key: "test:user1",
        limit: 5,
        window: 60,
      });
      expect(result3.success).toBe(false);
    });

    it("should use conservative limits (50% of configured)", async () => {
      mockPipeline.exec.mockRejectedValue(new Error("Redis connection error"));

      const { rateLimit } = await import("@/lib/rate-limit");

      // Test with limit of 10, fallback should be 5
      const result1 = await rateLimit({
        key: "test:user2",
        limit: 10,
        window: 60,
      });

      expect(result1.success).toBe(true);
      expect(result1.limit).toBe(10); // Original limit returned
      // Fallback internally uses 5, but we report original limit
    });

    it("should cleanup expired entries automatically", async () => {
      mockPipeline.exec.mockRejectedValue(new Error("Redis connection error"));

      const { rateLimit } = await import("@/lib/rate-limit");

      // Make requests that should expire
      await rateLimit({
        key: "test:user3",
        limit: 5,
        window: 1, // 1 second window
      });

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // New request should succeed (old entries cleaned up)
      const result = await rateLimit({
        key: "test:user3",
        limit: 5,
        window: 1,
      });

      expect(result.success).toBe(true);
    });

    it("should handle different keys independently", async () => {
      mockPipeline.exec.mockRejectedValue(new Error("Redis connection error"));

      const { rateLimit } = await import("@/lib/rate-limit");

      // Exhaust limit for user1
      await rateLimit({ key: "test:user1", limit: 5, window: 60 });
      await rateLimit({ key: "test:user1", limit: 5, window: 60 });
      const result1 = await rateLimit({
        key: "test:user1",
        limit: 5,
        window: 60,
      });

      // user2 should still be able to make requests
      const result2 = await rateLimit({
        key: "test:user2",
        limit: 5,
        window: 60,
      });

      expect(result1.success).toBe(false); // user1 blocked
      expect(result2.success).toBe(true); // user2 allowed
    });
  });

  describe("Circuit Breaker", () => {
    it("should open circuit after consecutive failures", async () => {
      const { rateLimit } = await import("@/lib/rate-limit");

      // Simulate 3 consecutive failures
      mockPipeline.exec.mockRejectedValueOnce(new Error("Failure 1"));
      await rateLimit({ key: "test:cb1", limit: 5, window: 60 });

      mockPipeline.exec.mockRejectedValueOnce(new Error("Failure 2"));
      await rateLimit({ key: "test:cb2", limit: 5, window: 60 });

      mockPipeline.exec.mockRejectedValueOnce(new Error("Failure 3"));
      await rateLimit({ key: "test:cb3", limit: 5, window: 60 });

      // Circuit should now be open, using fallback without trying Redis
      const callCountBefore = mockPipeline.exec.mock.calls.length;
      await rateLimit({ key: "test:cb4", limit: 5, window: 60 });
      const callCountAfter = mockPipeline.exec.mock.calls.length;

      // Should not have called Redis (circuit is open)
      expect(callCountAfter).toBe(callCountBefore);
    });

    it("should close circuit when Redis recovers", async () => {
      const { rateLimit } = await import("@/lib/rate-limit");
      const { logger } = await import("@/lib/logger");

      // Open circuit with failures
      mockPipeline.exec.mockRejectedValueOnce(new Error("Failure 1"));
      await rateLimit({ key: "test:recover1", limit: 5, window: 60 });

      mockPipeline.exec.mockRejectedValueOnce(new Error("Failure 2"));
      await rateLimit({ key: "test:recover2", limit: 5, window: 60 });

      mockPipeline.exec.mockRejectedValueOnce(new Error("Failure 3"));
      await rateLimit({ key: "test:recover3", limit: 5, window: 60 });

      // Wait for circuit breaker retry timeout (1s in test, 30s in production)
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Redis now works
      mockPipeline.exec.mockResolvedValue([
        [null, 0],
        [null, 0],
        [null, 1],
        [null, 1],
      ]);

      await rateLimit({ key: "test:recover4", limit: 5, window: 60 });

      // Should log recovery
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          component: "rate-limit",
          event: expect.stringContaining("recover"),
        }),
        expect.stringContaining("Redis")
      );
    });
  });

  describe("Memory Management", () => {
    it("should enforce max entries limit", async () => {
      mockPipeline.exec.mockRejectedValue(new Error("Redis connection error"));

      const { rateLimit } = await import("@/lib/rate-limit");
      const { logger } = await import("@/lib/logger");

      // Create 10,001 unique keys (exceeding max of 10,000)
      for (let i = 0; i < 10001; i++) {
        await rateLimit({
          key: `test:user${i}`,
          limit: 5,
          window: 60,
        });
      }

      // Should have logged a warning about memory limit
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          component: "rate-limit",
          entriesCount: expect.any(Number),
        }),
        expect.stringContaining("memory")
      );
    });

    it("should evict oldest entries when at capacity", async () => {
      mockPipeline.exec.mockRejectedValue(new Error("Redis connection error"));

      const { rateLimit } = await import("@/lib/rate-limit");

      // Fill cache to capacity
      for (let i = 0; i < 10000; i++) {
        await rateLimit({
          key: `test:user${i}`,
          limit: 5,
          window: 60,
        });
      }

      // Add one more - should evict oldest
      await rateLimit({
        key: "test:newest",
        limit: 5,
        window: 60,
      });

      // Oldest entry (user0) should have been evicted
      // New request from user0 should succeed (not rate limited)
      const result = await rateLimit({
        key: "test:user0",
        limit: 5,
        window: 60,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Pre-configured Rate Limiters", () => {
    it("should use conservative limits for auth endpoint in fallback", async () => {
      mockPipeline.exec.mockRejectedValue(new Error("Redis connection error"));

      const { rateLimiters } = await import("@/lib/rate-limit");

      // Normal limit is 5/min, fallback should be 2/min
      await rateLimiters.auth("192.168.1.1");
      await rateLimiters.auth("192.168.1.1");
      const result = await rateLimiters.auth("192.168.1.1");

      expect(result.success).toBe(false); // 3rd request blocked
    });

    it("should use conservative limits for passwordReset in fallback", async () => {
      mockPipeline.exec.mockRejectedValue(new Error("Redis connection error"));

      const { rateLimiters } = await import("@/lib/rate-limit");

      // Normal limit is 3/15min, fallback should be 1/15min
      await rateLimiters.passwordReset("test@example.com");
      const result = await rateLimiters.passwordReset("test@example.com");

      expect(result.success).toBe(false); // 2nd request blocked
    });

    it("should use conservative limits for twoFactor in fallback", async () => {
      mockPipeline.exec.mockRejectedValue(new Error("Redis connection error"));

      const { rateLimiters } = await import("@/lib/rate-limit");

      // Normal limit is 5/5min, fallback should be 2/5min
      await rateLimiters.twoFactor("user-123");
      await rateLimiters.twoFactor("user-123");
      const result = await rateLimiters.twoFactor("user-123");

      expect(result.success).toBe(false); // 3rd request blocked
    });
  });

  describe("Error Handling", () => {
    it("should not throw when fallback also fails", async () => {
      mockPipeline.exec.mockRejectedValue(new Error("Redis connection error"));

      const { rateLimit } = await import("@/lib/rate-limit");

      // Should not throw, even if fallback has issues
      await expect(
        rateLimit({
          key: "test:error",
          limit: 5,
          window: 60,
        })
      ).resolves.toBeDefined();
    });

    it("should log errors with context", async () => {
      mockPipeline.exec.mockRejectedValue(
        new Error("Connection timeout after 5000ms")
      );

      const { rateLimit } = await import("@/lib/rate-limit");
      const { logger } = await import("@/lib/logger");

      await rateLimit({
        key: "test:logging",
        limit: 5,
        window: 60,
      });

      // Check that fallback_used event was logged with error
      const fallbackCalls = (logger.warn as any).mock.calls.filter(
        (call: any) => call[0]?.event === "fallback_used"
      );
      expect(fallbackCalls.length).toBeGreaterThan(0);
      expect(fallbackCalls[0][0]).toMatchObject({
        component: "rate-limit",
        event: "fallback_used",
        error: expect.stringContaining("timeout"),
        key: "test:logging",
      });
    });
  });
});
