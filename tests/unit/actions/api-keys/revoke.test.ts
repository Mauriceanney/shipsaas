/**
 * Tests for revokeApiKey server action
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies BEFORE imports using hoisted scope
const { mockAuth, mockDb, mockLogger } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockDb: {
    apiKey: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
  mockLogger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

vi.mock("@/lib/logger", () => ({
  logger: mockLogger,
}));

import { revokeApiKey } from "@/actions/api-keys/revoke";

describe("revokeApiKey", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // AUTHENTICATION TESTS
  // ============================================

  describe("authentication", () => {
    it("returns error when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const result = await revokeApiKey({ id: "key-1" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
      }
    });

    it("returns error when session has no user", async () => {
      mockAuth.mockResolvedValue({ user: null });

      const result = await revokeApiKey({ id: "key-1" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
      }
    });

    it("returns error when session has no user ID", async () => {
      mockAuth.mockResolvedValue({ user: { id: null } });

      const result = await revokeApiKey({ id: "key-1" });

      expect(result.success).toBe(false);
    });
  });

  // ============================================
  // VALIDATION TESTS
  // ============================================

  describe("validation", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1" },
      });
    });

    it("returns error for empty ID", async () => {
      const result = await revokeApiKey({ id: "" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("required");
      }
    });

    it("returns error for missing ID", async () => {
      const result = await revokeApiKey({});

      expect(result.success).toBe(false);
    });
  });

  // ============================================
  // AUTHORIZATION TESTS
  // ============================================

  describe("authorization", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1" },
      });
    });

    it("returns error when key does not belong to user", async () => {
      mockDb.apiKey.findFirst.mockResolvedValue(null);

      const result = await revokeApiKey({ id: "key-from-other-user" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("API key not found");
      }

      expect(mockDb.apiKey.findFirst).toHaveBeenCalledWith({
        where: {
          id: "key-from-other-user",
          userId: "user-1",
        },
      });
    });

    it("returns error when key is already revoked", async () => {
      mockDb.apiKey.findFirst.mockResolvedValue({
        id: "key-1",
        userId: "user-1",
        revokedAt: new Date("2024-01-10"),
      });

      const result = await revokeApiKey({ id: "key-1" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("API key already revoked");
      }
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

    it("revokes API key successfully", async () => {
      const mockApiKey = {
        id: "key-1",
        userId: "user-1",
        name: "Production API",
        revokedAt: null,
      };

      mockDb.apiKey.findFirst.mockResolvedValue(mockApiKey);
      mockDb.apiKey.update.mockResolvedValue({
        ...mockApiKey,
        revokedAt: new Date(),
      });

      const result = await revokeApiKey({ id: "key-1" });

      expect(result.success).toBe(true);
      expect(mockDb.apiKey.update).toHaveBeenCalledWith({
        where: { id: "key-1" },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it("logs successful revocation", async () => {
      const mockApiKey = {
        id: "key-1",
        userId: "user-1",
        revokedAt: null,
      };

      mockDb.apiKey.findFirst.mockResolvedValue(mockApiKey);
      mockDb.apiKey.update.mockResolvedValue({
        ...mockApiKey,
        revokedAt: new Date(),
      });

      await revokeApiKey({ id: "key-1" });

      expect(mockLogger.info).toHaveBeenCalledWith(
        {
          component: "api-keys",
          action: "revoke",
          userId: "user-1",
          keyId: "key-1",
        },
        "API key revoked"
      );
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

    it("handles database find errors gracefully", async () => {
      mockDb.apiKey.findFirst.mockRejectedValue(new Error("Database error"));

      const result = await revokeApiKey({ id: "key-1" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Failed to revoke API key");
      }
    });

    it("handles database update errors gracefully", async () => {
      mockDb.apiKey.findFirst.mockResolvedValue({
        id: "key-1",
        userId: "user-1",
        revokedAt: null,
      });
      mockDb.apiKey.update.mockRejectedValue(new Error("Update failed"));

      const result = await revokeApiKey({ id: "key-1" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Failed to revoke API key");
      }
    });

    it("logs errors", async () => {
      mockDb.apiKey.findFirst.mockRejectedValue(new Error("Database error"));

      await revokeApiKey({ id: "key-1" });

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          component: "api-keys",
          action: "revoke",
          userId: "user-1",
        }),
        "Failed to revoke API key"
      );
    });
  });
});
