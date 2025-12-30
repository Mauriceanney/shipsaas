/**
 * Unit tests for getDunningStatus action
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

// Hoist mocks for vitest
const { mockAuth, mockDbSubscription } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockDbSubscription: {
    findUnique: vi.fn(),
  },
}));

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

// Mock database
vi.mock("@/lib/db", () => ({
  db: {
    subscription: mockDbSubscription,
  },
}));

import { getDunningStatus } from "@/actions/billing/get-dunning-status";

describe("getDunningStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("authentication", () => {
    it("returns error when user is not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const result = await getDunningStatus();

      expect(result).toEqual({
        success: false,
        error: "Unauthorized",
      });
      expect(mockDbSubscription.findUnique).not.toHaveBeenCalled();
    });

    it("returns error when session has no user", async () => {
      mockAuth.mockResolvedValue({ user: null });

      const result = await getDunningStatus();

      expect(result).toEqual({
        success: false,
        error: "Unauthorized",
      });
      expect(mockDbSubscription.findUnique).not.toHaveBeenCalled();
    });

    it("returns error when session user has no id", async () => {
      mockAuth.mockResolvedValue({ user: {} });

      const result = await getDunningStatus();

      expect(result).toEqual({
        success: false,
        error: "Unauthorized",
      });
      expect(mockDbSubscription.findUnique).not.toHaveBeenCalled();
    });
  });

  describe("subscription validation", () => {
    it("returns showBanner false when user has no subscription", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user_123", email: "test@example.com" },
      });
      mockDbSubscription.findUnique.mockResolvedValue(null);

      const result = await getDunningStatus();

      expect(result).toEqual({
        success: true,
        data: {
          showBanner: false,
          daysSinceFailed: 0,
          statusChangedAt: null,
        },
      });
      expect(mockDbSubscription.findUnique).toHaveBeenCalledWith({
        where: { userId: "user_123" },
        select: { status: true, statusChangedAt: true },
      });
    });

    it("returns showBanner false when subscription status is ACTIVE", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user_123", email: "test@example.com" },
      });
      mockDbSubscription.findUnique.mockResolvedValue({
        status: "ACTIVE",
        statusChangedAt: new Date("2025-01-01"),
      });

      const result = await getDunningStatus();

      expect(result).toEqual({
        success: true,
        data: {
          showBanner: false,
          daysSinceFailed: 0,
          statusChangedAt: null,
        },
      });
    });

    it("returns showBanner false when subscription status is INACTIVE", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user_123", email: "test@example.com" },
      });
      mockDbSubscription.findUnique.mockResolvedValue({
        status: "INACTIVE",
        statusChangedAt: new Date("2025-01-01"),
      });

      const result = await getDunningStatus();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.showBanner).toBe(false);
      }
    });

    it("returns showBanner false when subscription status is TRIALING", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user_123", email: "test@example.com" },
      });
      mockDbSubscription.findUnique.mockResolvedValue({
        status: "TRIALING",
        statusChangedAt: new Date("2025-01-01"),
      });

      const result = await getDunningStatus();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.showBanner).toBe(false);
      }
    });

    it("returns showBanner false when subscription status is CANCELED", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user_123", email: "test@example.com" },
      });
      mockDbSubscription.findUnique.mockResolvedValue({
        status: "CANCELED",
        statusChangedAt: new Date("2025-01-01"),
      });

      const result = await getDunningStatus();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.showBanner).toBe(false);
      }
    });
  });

  describe("PAST_DUE status handling", () => {
    it("returns showBanner true when subscription status is PAST_DUE", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user_123", email: "test@example.com" },
      });
      const statusChangedAt = new Date("2025-12-25");
      mockDbSubscription.findUnique.mockResolvedValue({
        status: "PAST_DUE",
        statusChangedAt,
      });

      const result = await getDunningStatus();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.showBanner).toBe(true);
        expect(result.data.statusChangedAt).toEqual(statusChangedAt);
      }
    });

    it("calculates daysSinceFailed correctly for 1 day", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user_123", email: "test@example.com" },
      });
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      mockDbSubscription.findUnique.mockResolvedValue({
        status: "PAST_DUE",
        statusChangedAt: oneDayAgo,
      });

      const result = await getDunningStatus();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.daysSinceFailed).toBe(1);
      }
    });

    it("calculates daysSinceFailed correctly for 5 days", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user_123", email: "test@example.com" },
      });
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      mockDbSubscription.findUnique.mockResolvedValue({
        status: "PAST_DUE",
        statusChangedAt: fiveDaysAgo,
      });

      const result = await getDunningStatus();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.daysSinceFailed).toBe(5);
      }
    });

    it("returns 0 daysSinceFailed when statusChangedAt is null", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user_123", email: "test@example.com" },
      });
      mockDbSubscription.findUnique.mockResolvedValue({
        status: "PAST_DUE",
        statusChangedAt: null,
      });

      const result = await getDunningStatus();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.showBanner).toBe(true);
        expect(result.data.daysSinceFailed).toBe(0);
        expect(result.data.statusChangedAt).toBeNull();
      }
    });

    it("calculates daysSinceFailed as 0 for same day", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user_123", email: "test@example.com" },
      });
      const now = new Date();
      mockDbSubscription.findUnique.mockResolvedValue({
        status: "PAST_DUE",
        statusChangedAt: now,
      });

      const result = await getDunningStatus();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.daysSinceFailed).toBe(0);
      }
    });
  });

  describe("error handling", () => {
    it("handles database errors gracefully", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user_123", email: "test@example.com" },
      });
      mockDbSubscription.findUnique.mockRejectedValue(
        new Error("Database connection error")
      );

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const result = await getDunningStatus();

      expect(result).toEqual({
        success: false,
        error: "Failed to get dunning status",
      });

      consoleSpy.mockRestore();
    });

    it("handles auth errors gracefully", async () => {
      mockAuth.mockRejectedValue(new Error("Auth service unavailable"));

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const result = await getDunningStatus();

      expect(result).toEqual({
        success: false,
        error: "Failed to get dunning status",
      });

      consoleSpy.mockRestore();
    });
  });
});
