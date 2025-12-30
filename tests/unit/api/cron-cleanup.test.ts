import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const { mockHeaders, mockFindMany, mockDelete } = vi.hoisted(() => ({
  mockHeaders: vi.fn(),
  mockFindMany: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: mockHeaders,
}));

vi.mock("@/lib/db", () => ({
  db: {
    accountDeletionRequest: {
      findMany: mockFindMany,
    },
    user: {
      delete: mockDelete,
    },
  },
}));

import { GET } from "@/app/api/cron/cleanup-deleted-accounts/route";

describe("GET /api/cron/cleanup-deleted-accounts", () => {
  const originalNodeEnv = process.env["NODE_ENV"];

  beforeEach(() => {
    vi.clearAllMocks();
    mockHeaders.mockResolvedValue({
      get: vi.fn().mockReturnValue("test-secret"),
    });
    // Set environment variable for testing
    process.env["CRON_SECRET"] = "test-secret";
    vi.stubEnv("NODE_ENV", "development");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("authorization", () => {
    it("rejects unauthorized requests in production", async () => {
      vi.stubEnv("NODE_ENV", "production");
      mockHeaders.mockResolvedValue({
        get: vi.fn().mockReturnValue("wrong-secret"),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("allows requests with valid cron secret", async () => {
      vi.stubEnv("NODE_ENV", "production");
      mockHeaders.mockResolvedValue({
        get: vi.fn().mockReturnValue("test-secret"),
      });
      mockFindMany.mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe("cleanup logic", () => {
    it("returns success when no accounts to delete", async () => {
      mockFindMany.mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.deletedCount).toBe(0);
      expect(data.message).toBe("No accounts to delete");
    });

    it("deletes expired accounts", async () => {
      const expiredRequests = [
        {
          id: "request-1",
          userId: "user-1",
          scheduledFor: new Date("2020-01-01"),
          canceledAt: null,
          user: { id: "user-1", email: "user1@test.com" },
        },
        {
          id: "request-2",
          userId: "user-2",
          scheduledFor: new Date("2020-01-01"),
          canceledAt: null,
          user: { id: "user-2", email: "user2@test.com" },
        },
      ];
      mockFindMany.mockResolvedValue(expiredRequests);
      mockDelete.mockResolvedValue({});

      const response = await GET();
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.deletedCount).toBe(2);
      expect(data.deletedUsers).toContain("user-1");
      expect(data.deletedUsers).toContain("user-2");
      expect(mockDelete).toHaveBeenCalledTimes(2);
    });

    it("queries only non-canceled expired requests", async () => {
      mockFindMany.mockResolvedValue([]);

      await GET();

      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          scheduledFor: { lte: expect.any(Date) },
          canceledAt: null,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });
    });

    it("handles deletion errors gracefully", async () => {
      const expiredRequests = [
        {
          id: "request-1",
          userId: "user-1",
          scheduledFor: new Date("2020-01-01"),
          canceledAt: null,
          user: { id: "user-1", email: "user1@test.com" },
        },
      ];
      mockFindMany.mockResolvedValue(expiredRequests);
      mockDelete.mockRejectedValue(new Error("Database error"));

      const response = await GET();
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.deletedCount).toBe(0);
      expect(data.errors).toHaveLength(1);
      expect(data.errors[0].userId).toBe("user-1");
    });
  });
});
