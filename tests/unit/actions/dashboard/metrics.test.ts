/**
 * Unit tests for dashboard metrics server actions
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoist mocks
const { mockAuth, mockDb, mockGetUserUsage, mockGetCachedData } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockDb: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    subscription: {
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    loginHistory: {
      count: vi.fn(),
      findFirst: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
  mockGetUserUsage: vi.fn(),
  mockGetCachedData: vi.fn(),
}));

// Mock dependencies
vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

vi.mock("@/lib/usage", () => ({
  getUserUsage: mockGetUserUsage,
  getCurrentPeriod: () => "2024-01",
}));

vi.mock("@/lib/redis", () => ({
  getCachedData: mockGetCachedData,
  CACHE_KEYS: {
    userDashboard: (userId: string) => `dashboard:user:${userId}:metrics`,
    adminDashboard: () => "dashboard:admin:metrics",
  },
  CACHE_TTL: {
    userDashboard: 300,
    adminDashboard: 60,
  },
}));

import {
  getUserDashboardMetrics,
  getAdminDashboardMetrics,
} from "@/actions/dashboard/metrics";

describe("dashboard metrics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: getCachedData calls the fallback function (cache miss)
    mockGetCachedData.mockImplementation(async (_key, fallback, _ttl) => {
      return await fallback();
    });
  });

  describe("getUserDashboardMetrics", () => {
    describe("authentication", () => {
      it("returns error when not authenticated", async () => {
        mockAuth.mockResolvedValue(null);

        const result = await getUserDashboardMetrics();

        expect(result.success).toBe(false);
        expect(result.error).toBe("Unauthorized");
      });

      it("returns error when session has no user id", async () => {
        mockAuth.mockResolvedValue({ user: { id: null } });

        const result = await getUserDashboardMetrics();

        expect(result.success).toBe(false);
        expect(result.error).toBe("Unauthorized");
      });
    });

    describe("user not found", () => {
      it("returns error when user does not exist", async () => {
        mockAuth.mockResolvedValue({ user: { id: "user-1" } });
        mockDb.user.findUnique.mockResolvedValue(null);

        const result = await getUserDashboardMetrics();

        expect(result.success).toBe(false);
        expect(result.error).toBe("User not found");
      });
    });

    describe("success cases", () => {
      it("returns metrics for user with subscription", async () => {
        mockAuth.mockResolvedValue({ user: { id: "user-1" } });
        mockDb.user.findUnique.mockResolvedValue({
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-15"),
          subscription: {
            plan: "PLUS",
            status: "ACTIVE",
            stripeCurrentPeriodEnd: new Date("2024-02-01"),
          },
        });
        mockGetUserUsage.mockResolvedValue({
          apiCalls: { used: 100, limit: 50000 },
          projects: { used: 5, limit: -1 },
          storage: { used: BigInt(1000000), limit: 50 * 1024 * 1024 * 1024 },
          teamMembers: { used: 3, limit: 10 },
        });
        mockDb.loginHistory.count.mockResolvedValue(10);
        mockDb.loginHistory.findFirst.mockResolvedValue({
          createdAt: new Date("2024-01-14"),
        });

        const result = await getUserDashboardMetrics();

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.subscription?.plan).toBe("PLUS");
          expect(result.data.subscription?.status).toBe("ACTIVE");
          expect(result.data.usage.apiCalls.used).toBe(100);
          expect(result.data.activity.recentLogins).toBe(10);
        }
      });

      it("returns metrics for user without subscription", async () => {
        mockAuth.mockResolvedValue({ user: { id: "user-1" } });
        mockDb.user.findUnique.mockResolvedValue({
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-15"),
          subscription: null,
        });
        mockGetUserUsage.mockResolvedValue({
          apiCalls: { used: 50, limit: 1000 },
          projects: { used: 1, limit: 1 },
          storage: { used: BigInt(0), limit: 5 * 1024 * 1024 * 1024 },
          teamMembers: { used: 1, limit: 1 },
        });
        mockDb.loginHistory.count.mockResolvedValue(2);
        mockDb.loginHistory.findFirst.mockResolvedValue(null);

        const result = await getUserDashboardMetrics();

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.subscription).toBeNull();
          expect(result.data.usage.apiCalls.limit).toBe(1000);
          expect(result.data.activity.lastLoginAt).toBeNull();
        }
      });
    });

    describe("error handling", () => {
      it("handles database errors gracefully", async () => {
        mockAuth.mockResolvedValue({ user: { id: "user-1" } });
        mockDb.user.findUnique.mockRejectedValue(new Error("DB Error"));

        const result = await getUserDashboardMetrics();

        expect(result.success).toBe(false);
        expect(result.error).toBe("Failed to get dashboard metrics");
      });
    });
  });

  describe("getAdminDashboardMetrics", () => {
    describe("authentication", () => {
      it("returns error when not authenticated", async () => {
        mockAuth.mockResolvedValue(null);

        const result = await getAdminDashboardMetrics();

        expect(result.success).toBe(false);
        expect(result.error).toBe("Unauthorized");
      });
    });

    describe("authorization", () => {
      it("returns error when user is not admin", async () => {
        mockAuth.mockResolvedValue({ user: { id: "user-1" } });
        mockDb.user.findUnique.mockResolvedValue({ role: "USER" });

        const result = await getAdminDashboardMetrics();

        expect(result.success).toBe(false);
        expect(result.error).toBe("Forbidden");
      });
    });

    describe("success cases", () => {
      it("returns admin metrics with optimized queries", async () => {
        mockAuth.mockResolvedValue({ user: { id: "admin-1" } });
        mockDb.user.findUnique.mockResolvedValue({ role: "ADMIN" });

        // Mock optimized user metrics query (single $queryRaw)
        mockDb.$queryRaw.mockResolvedValue([
          {
            total: BigInt(100),
            active_this_month: BigInt(50),
            new_this_month: BigInt(10),
          },
        ]);

        // Mock optimized subscription query (single groupBy)
        mockDb.subscription.groupBy.mockResolvedValue([
          { status: "ACTIVE", plan: "FREE", _count: { id: 20 } },
          { status: "ACTIVE", plan: "PLUS", _count: { id: 8 } },
          { status: "ACTIVE", plan: "PRO", _count: { id: 2 } },
          { status: "TRIALING", plan: "FREE", _count: { id: 3 } },
          { status: "TRIALING", plan: "PLUS", _count: { id: 2 } },
          { status: "PAST_DUE", plan: "PLUS", _count: { id: 1 } },
          { status: "PAST_DUE", plan: "PRO", _count: { id: 1 } },
        ]);

        mockDb.user.findMany.mockResolvedValue([
          { id: "1", email: "user@test.com", name: "Test", createdAt: new Date() },
        ]);

        const result = await getAdminDashboardMetrics();

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.users.total).toBe(100);
          expect(result.data.users.activeThisMonth).toBe(50);
          expect(result.data.users.newThisMonth).toBe(10);
          expect(result.data.subscriptions.active).toBe(30); // 20 + 8 + 2
          expect(result.data.subscriptions.trialing).toBe(5); // 3 + 2
          expect(result.data.subscriptions.pastDue).toBe(2); // 1 + 1
          expect(result.data.subscriptions.byPlan.FREE).toBe(23); // 20 + 3
          expect(result.data.subscriptions.byPlan.PLUS).toBe(10); // 8 + 2
          expect(result.data.subscriptions.byPlan.PRO).toBe(2); // 2 (ACTIVE only, TRIALING is 0)
          expect(result.data.recentSignups).toHaveLength(1);
        }

        // Verify optimized query usage - should use $queryRaw and groupBy
        expect(mockDb.$queryRaw).toHaveBeenCalledTimes(1);
        expect(mockDb.subscription.groupBy).toHaveBeenCalledTimes(1);
      });

      it("handles subscriptions with no data correctly", async () => {
        mockAuth.mockResolvedValue({ user: { id: "admin-1" } });
        mockDb.user.findUnique.mockResolvedValue({ role: "ADMIN" });

        mockDb.$queryRaw.mockResolvedValue([
          {
            total: BigInt(50),
            active_this_month: BigInt(20),
            new_this_month: BigInt(5),
          },
        ]);

        // No subscriptions
        mockDb.subscription.groupBy.mockResolvedValue([]);
        mockDb.user.findMany.mockResolvedValue([]);

        const result = await getAdminDashboardMetrics();

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.subscriptions.active).toBe(0);
          expect(result.data.subscriptions.trialing).toBe(0);
          expect(result.data.subscriptions.pastDue).toBe(0);
          expect(result.data.subscriptions.byPlan.FREE).toBe(0);
          expect(result.data.subscriptions.byPlan.PLUS).toBe(0);
          expect(result.data.subscriptions.byPlan.PRO).toBe(0);
        }
      });

      it("correctly counts PRO plan subscriptions (bug fix)", async () => {
        mockAuth.mockResolvedValue({ user: { id: "admin-1" } });
        mockDb.user.findUnique.mockResolvedValue({ role: "ADMIN" });

        mockDb.$queryRaw.mockResolvedValue([
          {
            total: BigInt(30),
            active_this_month: BigInt(15),
            new_this_month: BigInt(3),
          },
        ]);

        // Emphasis on PRO plan being counted correctly
        mockDb.subscription.groupBy.mockResolvedValue([
          { status: "ACTIVE", plan: "PRO", _count: { id: 15 } },
          { status: "TRIALING", plan: "PRO", _count: { id: 5 } },
        ]);

        mockDb.user.findMany.mockResolvedValue([]);

        const result = await getAdminDashboardMetrics();

        expect(result.success).toBe(true);
        if (result.success) {
          // PRO should be 20 (15 ACTIVE + 5 TRIALING), not PLUS
          expect(result.data.subscriptions.byPlan.PRO).toBe(20);
          expect(result.data.subscriptions.byPlan.PLUS).toBe(0);
        }
      });
    });

    describe("error handling", () => {
      it("handles database errors gracefully", async () => {
        mockAuth.mockResolvedValue({ user: { id: "admin-1" } });
        mockDb.user.findUnique.mockResolvedValue({ role: "ADMIN" });
        mockDb.$queryRaw.mockRejectedValue(new Error("DB Error"));

        const result = await getAdminDashboardMetrics();

        expect(result.success).toBe(false);
        expect(result.error).toBe("Failed to get admin metrics");
      });
    });

    describe("caching", () => {
      it("uses cache key with correct TTL", async () => {
        mockAuth.mockResolvedValue({ user: { id: "admin-1" } });
        mockDb.user.findUnique.mockResolvedValue({ role: "ADMIN" });

        mockDb.$queryRaw.mockResolvedValue([
          {
            total: BigInt(100),
            active_this_month: BigInt(50),
            new_this_month: BigInt(10),
          },
        ]);

        mockDb.subscription.groupBy.mockResolvedValue([
          { status: "ACTIVE", plan: "FREE", _count: { id: 20 } },
        ]);

        mockDb.user.findMany.mockResolvedValue([]);

        await getAdminDashboardMetrics();

        expect(mockGetCachedData).toHaveBeenCalledWith(
          "dashboard:admin:metrics",
          expect.any(Function),
          60
        );
      });
    });
  });

  describe("caching integration", () => {
    describe("getUserDashboardMetrics caching", () => {
      it("uses cache key with userId and correct TTL", async () => {
        mockAuth.mockResolvedValue({ user: { id: "user-123" } });
        mockDb.user.findUnique.mockResolvedValue({
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-15"),
          subscription: null,
        });
        mockGetUserUsage.mockResolvedValue({
          apiCalls: { used: 50, limit: 1000 },
          projects: { used: 1, limit: 1 },
          storage: { used: BigInt(0), limit: 5 * 1024 * 1024 * 1024 },
          teamMembers: { used: 1, limit: 1 },
        });
        mockDb.loginHistory.count.mockResolvedValue(2);
        mockDb.loginHistory.findFirst.mockResolvedValue(null);

        await getUserDashboardMetrics();

        expect(mockGetCachedData).toHaveBeenCalledWith(
          "dashboard:user:user-123:metrics",
          expect.any(Function),
          300
        );
      });

      it("returns cached data when available", async () => {
        const cachedMetrics = {
          account: {
            memberSince: new Date("2024-01-01"),
            lastActive: new Date("2024-01-15"),
          },
          subscription: null,
          usage: {
            apiCalls: { used: 50, limit: 1000 },
            projects: { used: 1, limit: 1 },
            storage: { used: 0, limit: 5368709120 },
            teamMembers: { used: 1, limit: 1 },
          },
          activity: {
            recentLogins: 2,
            lastLoginAt: null,
          },
        };

        mockAuth.mockResolvedValue({ user: { id: "user-123" } });
        // Return cached data directly
        mockGetCachedData.mockResolvedValueOnce(cachedMetrics);

        const result = await getUserDashboardMetrics();

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(cachedMetrics);
        }
        // DB should not be called when cache hits
        expect(mockDb.user.findUnique).not.toHaveBeenCalled();
      });
    });
  });
});
