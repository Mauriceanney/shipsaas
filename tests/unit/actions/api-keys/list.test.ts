/**
 * Tests for listApiKeys server action
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies BEFORE imports using hoisted scope
const { mockAuth, mockDb } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockDb: {
    apiKey: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

import { listApiKeys } from "@/actions/api-keys/list";

describe("listApiKeys", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // AUTHENTICATION TESTS
  // ============================================

  describe("authentication", () => {
    it("returns error when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const result = await listApiKeys();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
      }
    });

    it("returns error when session has no user", async () => {
      mockAuth.mockResolvedValue({ user: null });

      const result = await listApiKeys();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
      }
    });

    it("returns error when session has no user ID", async () => {
      mockAuth.mockResolvedValue({ user: { id: null } });

      const result = await listApiKeys();

      expect(result.success).toBe(false);
    });
  });

  // ============================================
  // SUCCESS TESTS
  // ============================================

  describe("success cases", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1" },
      });
    });

    it("returns list of API keys", async () => {
      const mockApiKeys = [
        {
          id: "key-1",
          name: "Production API",
          keyPrefix: "sk_live_abc1",
          environment: "live",
          lastUsedAt: new Date("2024-01-15"),
          usageCount: 42,
          createdAt: new Date("2024-01-01"),
          revokedAt: null,
        },
        {
          id: "key-2",
          name: "Test API",
          keyPrefix: "sk_test_xyz9",
          environment: "test",
          lastUsedAt: null,
          usageCount: 0,
          createdAt: new Date("2024-01-02"),
          revokedAt: null,
        },
      ];

      mockDb.apiKey.findMany.mockResolvedValue(mockApiKeys);

      const result = await listApiKeys();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0]).toEqual(mockApiKeys[0]);
        expect(result.data[1]).toEqual(mockApiKeys[1]);
      }

      expect(mockDb.apiKey.findMany).toHaveBeenCalledWith({
        where: {
          userId: "user-1",
        },
        select: {
          id: true,
          name: true,
          keyPrefix: true,
          environment: true,
          lastUsedAt: true,
          scopes: true,
          usageCount: true,
          createdAt: true,
          revokedAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    });

    it("returns empty array when user has no API keys", async () => {
      mockDb.apiKey.findMany.mockResolvedValue([]);

      const result = await listApiKeys();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it("includes revoked keys in the list", async () => {
      const mockApiKeys = [
        {
          id: "key-1",
          name: "Active Key",
          keyPrefix: "sk_live_abc1",
          environment: "live",
          lastUsedAt: null,
          usageCount: 0,
          createdAt: new Date("2024-01-01"),
          revokedAt: null,
        },
        {
          id: "key-2",
          name: "Revoked Key",
          keyPrefix: "sk_live_xyz9",
          environment: "live",
          lastUsedAt: null,
          usageCount: 5,
          createdAt: new Date("2024-01-02"),
          revokedAt: new Date("2024-01-10"),
        },
      ];

      mockDb.apiKey.findMany.mockResolvedValue(mockApiKeys);

      const result = await listApiKeys();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[1]?.revokedAt).toEqual(new Date("2024-01-10"));
      }
    });
  });

  // ============================================
  // ERROR HANDLING TESTS
  // ============================================

  describe("error handling", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1" },
      });
    });

    it("handles database errors gracefully", async () => {
      mockDb.apiKey.findMany.mockRejectedValue(new Error("Database error"));

      const result = await listApiKeys();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Failed to fetch API keys");
      }
    });
  });
});
