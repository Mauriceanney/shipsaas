/**
 * Unit tests for quota enforcement utilities
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoist mocks
const { mockAuth, mockDb, mockCanUseMetric } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockDb: {
    subscription: {
      findUnique: vi.fn(),
    },
  },
  mockCanUseMetric: vi.fn(),
}));

// Mock dependencies
vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

vi.mock("@/lib/usage", async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>;
  return {
    ...actual,
    canUseMetric: mockCanUseMetric,
  };
});

import { checkQuota, requireQuota } from "@/lib/usage/quota";

describe("quota enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkQuota", () => {
    describe("authentication", () => {
      it("returns error when not authenticated", async () => {
        mockAuth.mockResolvedValue(null);

        const result = await checkQuota("apiCalls");

        expect(result).toEqual({ success: false, error: "Unauthorized" });
      });

      it("returns error when session has no user id", async () => {
        mockAuth.mockResolvedValue({ user: { id: null } });

        const result = await checkQuota("apiCalls");

        expect(result).toEqual({ success: false, error: "Unauthorized" });
      });
    });

    describe("subscription status", () => {
      it("denies access for CANCELED subscription", async () => {
        mockAuth.mockResolvedValue({ user: { id: "user-1" } });
        mockDb.subscription.findUnique.mockResolvedValue({
          plan: "PRO",
          status: "CANCELED",
        });

        const result = await checkQuota("apiCalls");

        expect(result).toEqual({
          success: true,
          allowed: false,
          error: "Subscription is not active",
          current: 0,
          limit: 0,
        });
      });

      it("allows access for ACTIVE subscription", async () => {
        mockAuth.mockResolvedValue({ user: { id: "user-1" } });
        mockDb.subscription.findUnique.mockResolvedValue({
          plan: "PRO",
          status: "ACTIVE",
        });
        mockCanUseMetric.mockResolvedValue({
          allowed: true,
          current: 100,
          limit: 50000,
        });

        const result = await checkQuota("apiCalls");

        expect(result).toEqual({ success: true, allowed: true });
      });

      it("allows access for TRIALING subscription", async () => {
        mockAuth.mockResolvedValue({ user: { id: "user-1" } });
        mockDb.subscription.findUnique.mockResolvedValue({
          plan: "PRO",
          status: "TRIALING",
        });
        mockCanUseMetric.mockResolvedValue({
          allowed: true,
          current: 0,
          limit: 50000,
        });

        const result = await checkQuota("apiCalls");

        expect(result).toEqual({ success: true, allowed: true });
      });

      it("allows access for PAST_DUE subscription (grace period)", async () => {
        mockAuth.mockResolvedValue({ user: { id: "user-1" } });
        mockDb.subscription.findUnique.mockResolvedValue({
          plan: "PRO",
          status: "PAST_DUE",
        });
        mockCanUseMetric.mockResolvedValue({
          allowed: true,
          current: 0,
          limit: 50000,
        });

        const result = await checkQuota("apiCalls");

        expect(result).toEqual({ success: true, allowed: true });
      });
    });

    describe("quota limits", () => {
      it("returns limit reached error when quota exceeded", async () => {
        mockAuth.mockResolvedValue({ user: { id: "user-1" } });
        mockDb.subscription.findUnique.mockResolvedValue({
          plan: "FREE",
          status: "ACTIVE",
        });
        mockCanUseMetric.mockResolvedValue({
          allowed: false,
          current: 1000,
          limit: 1000,
        });

        const result = await checkQuota("apiCalls");

        expect(result).toEqual({
          success: true,
          allowed: false,
          error: "API calls limit reached. Upgrade your plan for more.",
          current: 1000,
          limit: 1000,
        });
      });

      it("returns specific error for projects limit", async () => {
        mockAuth.mockResolvedValue({ user: { id: "user-1" } });
        mockDb.subscription.findUnique.mockResolvedValue({
          plan: "FREE",
          status: "ACTIVE",
        });
        mockCanUseMetric.mockResolvedValue({
          allowed: false,
          current: 1,
          limit: 1,
        });

        const result = await checkQuota("projectsCount");

        expect(result).toEqual({
          success: true,
          allowed: false,
          error: "projects limit reached. Upgrade your plan for more.",
          current: 1,
          limit: 1,
        });
      });

      it("defaults to FREE plan when no subscription", async () => {
        mockAuth.mockResolvedValue({ user: { id: "user-1" } });
        mockDb.subscription.findUnique.mockResolvedValue(null);
        mockCanUseMetric.mockResolvedValue({
          allowed: true,
          current: 0,
          limit: 1000,
        });

        await checkQuota("apiCalls");

        expect(mockCanUseMetric).toHaveBeenCalledWith("user-1", "FREE", "apiCalls", 1);
      });
    });
  });

  describe("requireQuota", () => {
    it("returns userId when quota available", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDb.subscription.findUnique.mockResolvedValue({
        plan: "PRO",
        status: "ACTIVE",
      });
      mockCanUseMetric.mockResolvedValue({
        allowed: true,
        current: 0,
        limit: 50000,
      });

      const result = await requireQuota("apiCalls");

      expect(result).toEqual({ success: true, userId: "user-1" });
    });

    it("returns error when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const result = await requireQuota("apiCalls");

      expect(result).toEqual({ success: false, error: "Unauthorized" });
    });

    it("returns error when quota exceeded", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDb.subscription.findUnique.mockResolvedValue({
        plan: "FREE",
        status: "ACTIVE",
      });
      mockCanUseMetric.mockResolvedValue({
        allowed: false,
        current: 1000,
        limit: 1000,
      });

      const result = await requireQuota("apiCalls");

      expect(result).toEqual({
        success: false,
        error: "API calls limit reached. Upgrade your plan for more.",
      });
    });
  });
});
