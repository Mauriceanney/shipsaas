import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockQueryRaw, mockIsRedisConnected } = vi.hoisted(() => ({
  mockQueryRaw: vi.fn(),
  mockIsRedisConnected: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    $queryRaw: mockQueryRaw,
  },
}));

vi.mock("@/lib/redis", () => ({
  isRedisConnected: mockIsRedisConnected,
}));

import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("healthy state", () => {
    it("returns 200 when all services are connected", async () => {
      mockQueryRaw.mockResolvedValue([{ "?column?": 1 }]);
      mockIsRedisConnected.mockResolvedValue(true);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("healthy");
      expect(data.services.database.status).toBe("connected");
      expect(data.services.redis.status).toBe("connected");
      expect(data.timestamp).toBeDefined();
    });

    it("includes latency metrics for services", async () => {
      mockQueryRaw.mockResolvedValue([{ "?column?": 1 }]);
      mockIsRedisConnected.mockResolvedValue(true);

      const response = await GET();
      const data = await response.json();

      expect(data.services.database.latency_ms).toBeGreaterThanOrEqual(0);
      expect(data.services.redis.latency_ms).toBeGreaterThanOrEqual(0);
    });

    it("does not include error field when healthy", async () => {
      mockQueryRaw.mockResolvedValue([{ "?column?": 1 }]);
      mockIsRedisConnected.mockResolvedValue(true);

      const response = await GET();
      const data = await response.json();

      expect(data.error).toBeUndefined();
    });
  });

  describe("degraded state", () => {
    it("returns 200 when only database is connected", async () => {
      mockQueryRaw.mockResolvedValue([{ "?column?": 1 }]);
      mockIsRedisConnected.mockResolvedValue(false);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("degraded");
      expect(data.services.database.status).toBe("connected");
      expect(data.services.redis.status).toBe("disconnected");
      expect(data.error).toContain("Redis");
    });

    it("returns 200 when only Redis is connected", async () => {
      mockQueryRaw.mockRejectedValue(new Error("Connection refused"));
      mockIsRedisConnected.mockResolvedValue(true);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("degraded");
      expect(data.services.database.status).toBe("disconnected");
      expect(data.services.redis.status).toBe("connected");
      expect(data.error).toContain("Database");
    });

    it("includes error messages in degraded state", async () => {
      mockQueryRaw.mockResolvedValue([{ "?column?": 1 }]);
      mockIsRedisConnected.mockResolvedValue(false);

      const response = await GET();
      const data = await response.json();

      expect(data.error).toBeDefined();
      expect(typeof data.error).toBe("string");
    });
  });

  describe("unhealthy state", () => {
    it("returns 503 when all services are disconnected", async () => {
      mockQueryRaw.mockRejectedValue(new Error("Connection refused"));
      mockIsRedisConnected.mockResolvedValue(false);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.status).toBe("unhealthy");
      expect(data.services.database.status).toBe("disconnected");
      expect(data.services.redis.status).toBe("disconnected");
    });

    it("includes combined error messages when all services fail", async () => {
      mockQueryRaw.mockRejectedValue(new Error("DB Connection refused"));
      mockIsRedisConnected.mockResolvedValue(false);

      const response = await GET();
      const data = await response.json();

      expect(data.error).toContain("Database");
      expect(data.error).toContain("Redis");
    });

    it("does not include latency for failed database", async () => {
      mockQueryRaw.mockRejectedValue(new Error("Connection error"));
      mockIsRedisConnected.mockResolvedValue(false);

      const response = await GET();
      const data = await response.json();

      // Latency should not be included for failed services
      expect(data.services.database.latency_ms).toBeUndefined();
      expect(data.services.redis.latency_ms).toBeGreaterThanOrEqual(0);
    });
  });

  describe("error handling", () => {
    it("handles database timeout gracefully", async () => {
      mockQueryRaw.mockRejectedValue(new Error("Query timeout"));
      mockIsRedisConnected.mockResolvedValue(true);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200); // Degraded but operational
      expect(data.status).toBe("degraded");
      expect(data.error).toContain("timeout");
    });

    it("handles Redis connection errors gracefully", async () => {
      mockQueryRaw.mockResolvedValue([{ "?column?": 1 }]);
      mockIsRedisConnected.mockRejectedValue(new Error("Redis timeout"));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("degraded");
      expect(data.error).toContain("Redis");
    });

    it("handles unknown errors with generic message", async () => {
      mockQueryRaw.mockRejectedValue("String error");
      mockIsRedisConnected.mockResolvedValue(true);

      const response = await GET();
      const data = await response.json();

      expect(data.error).toContain("Unknown error");
    });
  });

  describe("response format", () => {
    it("returns valid JSON", async () => {
      mockQueryRaw.mockResolvedValue([{ "?column?": 1 }]);
      mockIsRedisConnected.mockResolvedValue(true);

      const response = await GET();
      
      // Should be able to parse JSON
      expect(async () => await response.json()).not.toThrow();
    });

    it("includes ISO 8601 timestamp", async () => {
      mockQueryRaw.mockResolvedValue([{ "?column?": 1 }]);
      mockIsRedisConnected.mockResolvedValue(true);

      const response = await GET();
      const data = await response.json();

      // Validate ISO 8601 format
      expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp);
    });

    it("includes all required fields", async () => {
      mockQueryRaw.mockResolvedValue([{ "?column?": 1 }]);
      mockIsRedisConnected.mockResolvedValue(true);

      const response = await GET();
      const data = await response.json();

      expect(data).toHaveProperty("status");
      expect(data).toHaveProperty("timestamp");
      expect(data).toHaveProperty("services");
      expect(data.services).toHaveProperty("database");
      expect(data.services).toHaveProperty("redis");
    });
  });

  describe("performance", () => {
    it("completes health check quickly", async () => {
      mockQueryRaw.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([{ "?column?": 1 }]), 50))
      );
      mockIsRedisConnected.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(true), 30))
      );

      const start = Date.now();
      await GET();
      const duration = Date.now() - start;

      // Should complete within reasonable time (with some buffer for test overhead)
      expect(duration).toBeLessThan(200);
    });
  });
});
