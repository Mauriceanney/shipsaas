import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

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

describe("Rate Limiting", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    // Default: no existing requests (count = 0)
    mockPipeline.exec.mockResolvedValue([
      [null, 0], // zremrangebyscore result
      [null, 0], // zcard result (0 existing requests)
      [null, 1], // zadd result
      [null, 1], // expire result
    ]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("rateLimit", () => {
    it("should allow request when under limit", async () => {
      const { rateLimit } = await import("@/lib/rate-limit");

      const result = await rateLimit({
        key: "test:user1",
        limit: 5,
        window: 60,
      });

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.limit).toBe(5);
    });

    it("should deny request when at limit", async () => {
      // Simulate 5 existing requests (at limit)
      mockPipeline.exec.mockResolvedValue([
        [null, 0],
        [null, 5], // Already at limit
        [null, 1],
        [null, 1],
      ]);

      const { rateLimit } = await import("@/lib/rate-limit");

      const result = await rateLimit({
        key: "test:user1",
        limit: 5,
        window: 60,
      });

      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should return correct reset timestamp", async () => {
      const { rateLimit } = await import("@/lib/rate-limit");
      const beforeCall = Date.now();

      const result = await rateLimit({
        key: "test:user1",
        limit: 5,
        window: 60,
      });

      const afterCall = Date.now();
      const expectedResetMin = Math.ceil((beforeCall + 60 * 1000) / 1000);
      const expectedResetMax = Math.ceil((afterCall + 60 * 1000) / 1000);

      expect(result.reset).toBeGreaterThanOrEqual(expectedResetMin);
      expect(result.reset).toBeLessThanOrEqual(expectedResetMax);
    });

    it("should handle Redis errors gracefully (fail open)", async () => {
      mockPipeline.exec.mockRejectedValue(new Error("Redis connection error"));

      const { rateLimit } = await import("@/lib/rate-limit");

      const result = await rateLimit({
        key: "test:user1",
        limit: 5,
        window: 60,
      });

      // Should fail open (allow the request)
      expect(result.success).toBe(true);
    });
  });

  describe("rateLimiters", () => {
    it("should have auth rate limiter with 5 per minute", async () => {
      const { rateLimiters } = await import("@/lib/rate-limit");

      const result = await rateLimiters.auth("192.168.1.1");

      expect(result.limit).toBe(5);
      expect(mockPipeline.expire).toHaveBeenCalledWith(expect.any(String), 60);
    });

    it("should have api rate limiter with 100 per minute", async () => {
      const { rateLimiters } = await import("@/lib/rate-limit");

      const result = await rateLimiters.api("192.168.1.1");

      expect(result.limit).toBe(100);
    });

    it("should have passwordReset rate limiter with 3 per 15 minutes", async () => {
      const { rateLimiters } = await import("@/lib/rate-limit");

      const result = await rateLimiters.passwordReset("test@example.com");

      expect(result.limit).toBe(3);
      expect(mockPipeline.expire).toHaveBeenCalledWith(expect.any(String), 900);
    });
  });

  describe("getClientIp", () => {
    it("should extract IP from x-forwarded-for header", async () => {
      const { getClientIp } = await import("@/lib/rate-limit");

      const request = {
        headers: {
          get: vi.fn((name: string) => {
            if (name === "x-forwarded-for") return "203.0.113.195, 70.41.3.18";
            return null;
          }),
        },
        ip: undefined,
      } as unknown as Request;

      const ip = getClientIp(request);
      expect(ip).toBe("203.0.113.195");
    });

    it("should fallback to x-real-ip", async () => {
      const { getClientIp } = await import("@/lib/rate-limit");

      const request = {
        headers: {
          get: vi.fn((name: string) => {
            if (name === "x-real-ip") return "192.168.1.100";
            return null;
          }),
        },
        ip: undefined,
      } as unknown as Request;

      const ip = getClientIp(request);
      expect(ip).toBe("192.168.1.100");
    });

    it("should return unknown for missing headers", async () => {
      const { getClientIp } = await import("@/lib/rate-limit");

      const request = {
        headers: {
          get: vi.fn(() => null),
        },
        ip: undefined,
      } as unknown as Request;

      const ip = getClientIp(request);
      expect(ip).toBe("unknown");
    });
  });
});
