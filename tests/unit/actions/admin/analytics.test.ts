/**
 * Unit tests for admin analytics server actions
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoist mocks
const { mockAuth, mockDb, mockGetCachedData } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockDb: {
    user: {
      findUnique: vi.fn(),
    },
    subscription: {
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
  mockGetCachedData: vi.fn(),
}));

// Mock dependencies
vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

vi.mock("@/lib/redis", () => ({
  getCachedData: mockGetCachedData,
  CACHE_KEYS: {
    adminAnalytics: () => "analytics:admin:metrics",
  },
  CACHE_TTL: {
    adminAnalytics: 60,
  },
}));

vi.mock("@/lib/stripe/config", () => ({
  STRIPE_PRICE_IDS: {
    PLUS: {
      monthly: "price_plus_monthly",
      yearly: "price_plus_yearly",
    },
    PRO: {
      monthly: "price_pro_monthly",
      yearly: "price_pro_yearly",
    },
  },
  PLAN_PRICING: {
    PLUS: { monthly: 19, yearly: 190 },
    PRO: { monthly: 99, yearly: 990 },
  },
}));

import { getAdminAnalytics } from "@/actions/admin/analytics";

describe("admin analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: getCachedData calls the fallback function (cache miss)
    mockGetCachedData.mockImplementation(async (_key, fallback, _ttl) => {
      return await fallback();
    });
  });

  describe("getAdminAnalytics", () => {
    describe("authentication", () => {
      it("returns error when not authenticated", async () => {
        mockAuth.mockResolvedValue(null);

        const result = await getAdminAnalytics();

        expect(result.success).toBe(false);
        expect(result.error).toBe("Unauthorized");
      });

      it("returns error when session has no user id", async () => {
        mockAuth.mockResolvedValue({ user: { id: null } });

        const result = await getAdminAnalytics();

        expect(result.success).toBe(false);
        expect(result.error).toBe("Unauthorized");
      });
    });

    describe("authorization", () => {
      it("returns error when user is not admin", async () => {
        mockAuth.mockResolvedValue({ user: { id: "user-1" } });
        mockDb.user.findUnique.mockResolvedValue({ role: "USER" });

        const result = await getAdminAnalytics();

        expect(result.success).toBe(false);
        expect(result.error).toBe("Forbidden");
      });
    });

    describe("MRR calculation", () => {
      it("calculates MRR correctly for monthly subscriptions", async () => {
        mockAuth.mockResolvedValue({ user: { id: "admin-1" } });
        mockDb.user.findUnique.mockResolvedValue({ role: "ADMIN" });

        // 2 PLUS monthly ($19 each) + 1 PRO monthly ($99)
        mockDb.subscription.findMany.mockResolvedValue([
          { stripePriceId: "price_plus_monthly", status: "ACTIVE" },
          { stripePriceId: "price_plus_monthly", status: "ACTIVE" },
          { stripePriceId: "price_pro_monthly", status: "ACTIVE" },
        ]);

        mockDb.subscription.groupBy.mockResolvedValue([]);
        mockDb.$queryRaw.mockResolvedValue([
          { month: "2024-01", count: BigInt(10) },
        ]);

        const result = await getAdminAnalytics();

        expect(result.success).toBe(true);
        if (result.success) {
          // 2 * 19 + 1 * 99 = 137
          expect(result.data.revenue.mrr).toBe(137);
        }
      });

      it("calculates MRR correctly for yearly subscriptions (divided by 12)", async () => {
        mockAuth.mockResolvedValue({ user: { id: "admin-1" } });
        mockDb.user.findUnique.mockResolvedValue({ role: "ADMIN" });

        // 1 PLUS yearly ($190/12) + 1 PRO yearly ($990/12)
        mockDb.subscription.findMany.mockResolvedValue([
          { stripePriceId: "price_plus_yearly", status: "ACTIVE" },
          { stripePriceId: "price_pro_yearly", status: "ACTIVE" },
        ]);

        mockDb.subscription.groupBy.mockResolvedValue([]);
        mockDb.$queryRaw.mockResolvedValue([]);

        const result = await getAdminAnalytics();

        expect(result.success).toBe(true);
        if (result.success) {
          // 190/12 + 990/12 ≈ 98.33
          expect(result.data.revenue.mrr).toBeCloseTo(98.33, 1);
        }
      });

      it("excludes CANCELED subscriptions from MRR", async () => {
        mockAuth.mockResolvedValue({ user: { id: "admin-1" } });
        mockDb.user.findUnique.mockResolvedValue({ role: "ADMIN" });

        // Only returns ACTIVE/TRIALING (not CANCELED)
        mockDb.subscription.findMany.mockResolvedValue([
          { stripePriceId: "price_plus_monthly", status: "ACTIVE" },
        ]);

        mockDb.subscription.groupBy.mockResolvedValue([]);
        mockDb.$queryRaw.mockResolvedValue([]);

        const result = await getAdminAnalytics();

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.revenue.mrr).toBe(19);
        }

        // Verify findMany was called with correct filter
        expect(mockDb.subscription.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              status: { in: ["ACTIVE", "TRIALING"] },
            }),
          })
        );
      });

      it("handles subscriptions with null stripePriceId", async () => {
        mockAuth.mockResolvedValue({ user: { id: "admin-1" } });
        mockDb.user.findUnique.mockResolvedValue({ role: "ADMIN" });

        mockDb.subscription.findMany.mockResolvedValue([
          { stripePriceId: null, status: "ACTIVE" },
          { stripePriceId: "price_plus_monthly", status: "ACTIVE" },
        ]);

        mockDb.subscription.groupBy.mockResolvedValue([]);
        mockDb.$queryRaw.mockResolvedValue([]);

        const result = await getAdminAnalytics();

        expect(result.success).toBe(true);
        if (result.success) {
          // Only counts the one with valid priceId
          expect(result.data.revenue.mrr).toBe(19);
        }
      });
    });

    describe("ARR calculation", () => {
      it("calculates ARR as MRR * 12", async () => {
        mockAuth.mockResolvedValue({ user: { id: "admin-1" } });
        mockDb.user.findUnique.mockResolvedValue({ role: "ADMIN" });

        mockDb.subscription.findMany.mockResolvedValue([
          { stripePriceId: "price_plus_monthly", status: "ACTIVE" },
        ]);

        mockDb.subscription.groupBy.mockResolvedValue([]);
        mockDb.$queryRaw.mockResolvedValue([]);

        const result = await getAdminAnalytics();

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.revenue.mrr).toBe(19);
          expect(result.data.revenue.arr).toBe(228); // 19 * 12
        }
      });
    });

    describe("churn calculation", () => {
      it("calculates churn rate correctly", async () => {
        mockAuth.mockResolvedValue({ user: { id: "admin-1" } });
        mockDb.user.findUnique.mockResolvedValue({ role: "ADMIN" });

        mockDb.subscription.findMany.mockResolvedValue([]);

        // 5 canceled this month out of 100 at month start
        mockDb.subscription.groupBy.mockResolvedValue([
          { status: "CANCELED", _count: { id: 5 } },
          { status: "ACTIVE", _count: { id: 95 } },
        ]);

        mockDb.$queryRaw.mockResolvedValue([]);

        const result = await getAdminAnalytics();

        expect(result.success).toBe(true);
        if (result.success) {
          // 5 / 100 * 100 = 5%
          expect(result.data.churn.rate).toBe(5);
          expect(result.data.churn.count).toBe(5);
        }
      });

      it("returns 0% churn when no cancellations this month", async () => {
        mockAuth.mockResolvedValue({ user: { id: "admin-1" } });
        mockDb.user.findUnique.mockResolvedValue({ role: "ADMIN" });

        mockDb.subscription.findMany.mockResolvedValue([]);
        mockDb.subscription.groupBy.mockResolvedValue([
          { status: "ACTIVE", _count: { id: 100 } },
        ]);
        mockDb.$queryRaw.mockResolvedValue([]);

        const result = await getAdminAnalytics();

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.churn.rate).toBe(0);
          expect(result.data.churn.count).toBe(0);
        }
      });

      it("handles zero active subscriptions at month start", async () => {
        mockAuth.mockResolvedValue({ user: { id: "admin-1" } });
        mockDb.user.findUnique.mockResolvedValue({ role: "ADMIN" });

        mockDb.subscription.findMany.mockResolvedValue([]);
        mockDb.subscription.groupBy.mockResolvedValue([]);
        mockDb.$queryRaw.mockResolvedValue([]);

        const result = await getAdminAnalytics();

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.churn.rate).toBe(0);
        }
      });
    });

    describe("revenue by plan", () => {
      it("calculates revenue breakdown by plan", async () => {
        mockAuth.mockResolvedValue({ user: { id: "admin-1" } });
        mockDb.user.findUnique.mockResolvedValue({ role: "ADMIN" });

        mockDb.subscription.findMany.mockResolvedValue([
          { stripePriceId: "price_plus_monthly", status: "ACTIVE" },
          { stripePriceId: "price_plus_monthly", status: "ACTIVE" },
          { stripePriceId: "price_pro_monthly", status: "ACTIVE" },
        ]);

        mockDb.subscription.groupBy.mockResolvedValue([]);
        mockDb.$queryRaw.mockResolvedValue([]);

        const result = await getAdminAnalytics();

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.revenue.byPlan.FREE).toBe(0);
          expect(result.data.revenue.byPlan.PLUS).toBe(38); // 2 * 19
          expect(result.data.revenue.byPlan.PRO).toBe(99);
        }
      });
    });

    describe("LTV calculation", () => {
      it("calculates LTV correctly based on ARPU and churn", async () => {
        mockAuth.mockResolvedValue({ user: { id: "admin-1" } });
        mockDb.user.findUnique.mockResolvedValue({ role: "ADMIN" });

        // 2 paying customers, $100 MRR total → ARPU = $50
        mockDb.subscription.findMany.mockResolvedValue([
          { stripePriceId: "price_pro_monthly", status: "ACTIVE" },
        ]);

        // 10% churn (1 canceled out of 10 total at month start)
        mockDb.subscription.groupBy.mockResolvedValue([
          { status: "ACTIVE", _count: { id: 9 } },
          { status: "CANCELED", _count: { id: 1 } },
        ]);

        mockDb.$queryRaw.mockResolvedValue([]);

        const result = await getAdminAnalytics();

        expect(result.success).toBe(true);
        if (result.success) {
          // 9 active + 0 trialing = 9 paying customers
          // ARPU = 99 / 9 = 11
          // Churn rate = 1 / 10 * 100 = 10%
          // Monthly churn = 0.1
          // Avg lifetime = 1 / 0.1 = 10 months
          // LTV = 11 * 10 = 110
          expect(result.data.ltv.payingCustomers).toBe(9);
          expect(result.data.ltv.arpu).toBe(11);
          expect(result.data.ltv.avgLifetimeMonths).toBe(10);
          expect(result.data.ltv.value).toBe(110);
        }
      });

      it("returns 0 ARPU when no paying customers", async () => {
        mockAuth.mockResolvedValue({ user: { id: "admin-1" } });
        mockDb.user.findUnique.mockResolvedValue({ role: "ADMIN" });

        mockDb.subscription.findMany.mockResolvedValue([]);
        mockDb.subscription.groupBy.mockResolvedValue([]);
        mockDb.$queryRaw.mockResolvedValue([]);

        const result = await getAdminAnalytics();

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.ltv.payingCustomers).toBe(0);
          expect(result.data.ltv.arpu).toBe(0);
        }
      });

      it("uses 12 months default lifetime when zero churn", async () => {
        mockAuth.mockResolvedValue({ user: { id: "admin-1" } });
        mockDb.user.findUnique.mockResolvedValue({ role: "ADMIN" });

        // 1 paying customer, $19 MRR
        mockDb.subscription.findMany.mockResolvedValue([
          { stripePriceId: "price_plus_monthly", status: "ACTIVE" },
        ]);

        // Zero churn (only active, no canceled)
        mockDb.subscription.groupBy.mockResolvedValue([
          { status: "ACTIVE", _count: { id: 1 } },
        ]);

        mockDb.$queryRaw.mockResolvedValue([]);

        const result = await getAdminAnalytics();

        expect(result.success).toBe(true);
        if (result.success) {
          // Zero churn → default 12 months lifetime
          expect(result.data.ltv.avgLifetimeMonths).toBe(12);
          // LTV = ARPU * 12 = 19 * 12 = 228
          expect(result.data.ltv.value).toBe(228);
        }
      });

      it("includes trialing customers in paying count", async () => {
        mockAuth.mockResolvedValue({ user: { id: "admin-1" } });
        mockDb.user.findUnique.mockResolvedValue({ role: "ADMIN" });

        mockDb.subscription.findMany.mockResolvedValue([
          { stripePriceId: "price_plus_monthly", status: "ACTIVE" },
          { stripePriceId: "price_plus_monthly", status: "TRIALING" },
        ]);

        mockDb.subscription.groupBy.mockResolvedValue([
          { status: "ACTIVE", _count: { id: 5 } },
          { status: "TRIALING", _count: { id: 3 } },
        ]);

        mockDb.$queryRaw.mockResolvedValue([]);

        const result = await getAdminAnalytics();

        expect(result.success).toBe(true);
        if (result.success) {
          // Active + Trialing = 5 + 3 = 8 paying customers
          expect(result.data.ltv.payingCustomers).toBe(8);
        }
      });
    });

    describe("trends", () => {
      it("returns signup trends for last 12 months", async () => {
        mockAuth.mockResolvedValue({ user: { id: "admin-1" } });
        mockDb.user.findUnique.mockResolvedValue({ role: "ADMIN" });

        mockDb.subscription.findMany.mockResolvedValue([]);
        mockDb.subscription.groupBy.mockResolvedValue([]);

        mockDb.$queryRaw.mockResolvedValue([
          { month: "2024-01", count: BigInt(10) },
          { month: "2024-02", count: BigInt(15) },
          { month: "2024-03", count: BigInt(20) },
        ]);

        const result = await getAdminAnalytics();

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.trends.signups).toHaveLength(3);
          expect(result.data.trends.signups[0]).toEqual({
            month: "2024-01",
            count: 10,
          });
        }
      });
    });

    describe("caching", () => {
      it("uses cache key with correct TTL", async () => {
        mockAuth.mockResolvedValue({ user: { id: "admin-1" } });
        mockDb.user.findUnique.mockResolvedValue({ role: "ADMIN" });

        mockDb.subscription.findMany.mockResolvedValue([]);
        mockDb.subscription.groupBy.mockResolvedValue([]);
        mockDb.$queryRaw.mockResolvedValue([]);

        await getAdminAnalytics();

        expect(mockGetCachedData).toHaveBeenCalledWith(
          "analytics:admin:metrics",
          expect.any(Function),
          60
        );
      });
    });

    describe("error handling", () => {
      it("handles database errors gracefully", async () => {
        mockAuth.mockResolvedValue({ user: { id: "admin-1" } });
        mockDb.user.findUnique.mockResolvedValue({ role: "ADMIN" });
        mockDb.subscription.findMany.mockRejectedValue(new Error("DB Error"));

        const result = await getAdminAnalytics();

        expect(result.success).toBe(false);
        expect(result.error).toBe("Failed to get analytics");
      });
    });
  describe("MRR Movement calculation", () => {
    describe("New MRR", () => {
      it("calculates new MRR for subscriptions created this month", async () => {
        mockAuth.mockResolvedValue({ user: { id: "admin-1" } });
        mockDb.user.findUnique.mockResolvedValue({ role: "ADMIN" });

        const now = new Date();
        const currentMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

        // Active subscriptions (for overall MRR)
        mockDb.subscription.findMany.mockResolvedValueOnce([]);

        // New subscriptions this month (second call)
        mockDb.subscription.findMany.mockResolvedValueOnce([
          { stripePriceId: "price_plus_monthly", status: "ACTIVE" },
          { stripePriceId: "price_pro_monthly", status: "TRIALING" },
        ]);

        // Churned subscriptions (third call)
        mockDb.subscription.findMany.mockResolvedValueOnce([]);

        mockDb.subscription.groupBy.mockResolvedValue([]);
        mockDb.$queryRaw.mockResolvedValue([]);

        const result = await getAdminAnalytics();

        expect(result.success).toBe(true);
        if (result.success) {
          // New MRR = 19 (PLUS) + 99 (PRO) = 118
          expect(result.data.mrrMovement.new).toBe(118);
        }

        // Verify findMany was called with correct date range
        expect(mockDb.subscription.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              createdAt: expect.objectContaining({
                gte: expect.any(Date),
                lt: expect.any(Date),
              }),
              status: { in: ["ACTIVE", "TRIALING"] },
            }),
          })
        );
      });

      it("excludes subscriptions created in previous months", async () => {
        mockAuth.mockResolvedValue({ user: { id: "admin-1" } });
        mockDb.user.findUnique.mockResolvedValue({ role: "ADMIN" });

        // Active subscriptions (overall MRR)
        mockDb.subscription.findMany.mockResolvedValueOnce([
          { stripePriceId: "price_plus_monthly", status: "ACTIVE" },
        ]);

        // New subscriptions this month (none)
        mockDb.subscription.findMany.mockResolvedValueOnce([]);

        // Churned subscriptions
        mockDb.subscription.findMany.mockResolvedValueOnce([]);

        mockDb.subscription.groupBy.mockResolvedValue([]);
        mockDb.$queryRaw.mockResolvedValue([]);

        const result = await getAdminAnalytics();

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.mrrMovement.new).toBe(0);
        }
      });

      it("handles null stripePriceId in new subscriptions", async () => {
        mockAuth.mockResolvedValue({ user: { id: "admin-1" } });
        mockDb.user.findUnique.mockResolvedValue({ role: "ADMIN" });

        mockDb.subscription.findMany.mockResolvedValueOnce([]);

        // New subscriptions with null priceId (FREE plan)
        mockDb.subscription.findMany.mockResolvedValueOnce([
          { stripePriceId: null, status: "ACTIVE" },
          { stripePriceId: "price_plus_monthly", status: "ACTIVE" },
        ]);

        mockDb.subscription.findMany.mockResolvedValueOnce([]);

        mockDb.subscription.groupBy.mockResolvedValue([]);
        mockDb.$queryRaw.mockResolvedValue([]);

        const result = await getAdminAnalytics();

        expect(result.success).toBe(true);
        if (result.success) {
          // Only counts the PLUS subscription
          expect(result.data.mrrMovement.new).toBe(19);
        }
      });
    });

    describe("Churned MRR", () => {
      it("calculates churned MRR for subscriptions canceled this month", async () => {
        mockAuth.mockResolvedValue({ user: { id: "admin-1" } });
        mockDb.user.findUnique.mockResolvedValue({ role: "ADMIN" });

        mockDb.subscription.findMany.mockResolvedValueOnce([]);
        mockDb.subscription.findMany.mockResolvedValueOnce([]);

        // Churned subscriptions this month
        mockDb.subscription.findMany.mockResolvedValueOnce([
          { stripePriceId: "price_plus_monthly", status: "CANCELED" },
          { stripePriceId: "price_pro_monthly", status: "CANCELED" },
        ]);

        mockDb.subscription.groupBy.mockResolvedValue([]);
        mockDb.$queryRaw.mockResolvedValue([]);

        const result = await getAdminAnalytics();

        expect(result.success).toBe(true);
        if (result.success) {
          // Churned MRR = 19 (PLUS) + 99 (PRO) = 118
          expect(result.data.mrrMovement.churned).toBe(118);
        }

        // Verify findMany was called with correct filters
        expect(mockDb.subscription.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              status: "CANCELED",
              updatedAt: expect.objectContaining({
                gte: expect.any(Date),
                lt: expect.any(Date),
              }),
            }),
          })
        );
      });

      it("returns 0 churned MRR when no cancellations this month", async () => {
        mockAuth.mockResolvedValue({ user: { id: "admin-1" } });
        mockDb.user.findUnique.mockResolvedValue({ role: "ADMIN" });

        mockDb.subscription.findMany.mockResolvedValueOnce([]);
        mockDb.subscription.findMany.mockResolvedValueOnce([]);
        mockDb.subscription.findMany.mockResolvedValueOnce([]);

        mockDb.subscription.groupBy.mockResolvedValue([]);
        mockDb.$queryRaw.mockResolvedValue([]);

        const result = await getAdminAnalytics();

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.mrrMovement.churned).toBe(0);
        }
      });
    });

    describe("Net MRR Movement", () => {
      it("calculates net MRR correctly (new - churned)", async () => {
        mockAuth.mockResolvedValue({ user: { id: "admin-1" } });
        mockDb.user.findUnique.mockResolvedValue({ role: "ADMIN" });

        mockDb.subscription.findMany.mockResolvedValueOnce([]);

        // New: +$118
        mockDb.subscription.findMany.mockResolvedValueOnce([
          { stripePriceId: "price_plus_monthly", status: "ACTIVE" },
          { stripePriceId: "price_pro_monthly", status: "ACTIVE" },
        ]);

        // Churned: -$19
        mockDb.subscription.findMany.mockResolvedValueOnce([
          { stripePriceId: "price_plus_monthly", status: "CANCELED" },
        ]);

        mockDb.subscription.groupBy.mockResolvedValue([]);
        mockDb.$queryRaw.mockResolvedValue([]);

        const result = await getAdminAnalytics();

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.mrrMovement.new).toBe(118);
          expect(result.data.mrrMovement.churned).toBe(19);
          // Net = 118 - 19 = 99
          expect(result.data.mrrMovement.net).toBe(99);
        }
      });

      it("handles negative net MRR (more churn than new)", async () => {
        mockAuth.mockResolvedValue({ user: { id: "admin-1" } });
        mockDb.user.findUnique.mockResolvedValue({ role: "ADMIN" });

        mockDb.subscription.findMany.mockResolvedValueOnce([]);

        // New: +$19
        mockDb.subscription.findMany.mockResolvedValueOnce([
          { stripePriceId: "price_plus_monthly", status: "ACTIVE" },
        ]);

        // Churned: -$99
        mockDb.subscription.findMany.mockResolvedValueOnce([
          { stripePriceId: "price_pro_monthly", status: "CANCELED" },
        ]);

        mockDb.subscription.groupBy.mockResolvedValue([]);
        mockDb.$queryRaw.mockResolvedValue([]);

        const result = await getAdminAnalytics();

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.mrrMovement.new).toBe(19);
          expect(result.data.mrrMovement.churned).toBe(99);
          // Net = 19 - 99 = -80
          expect(result.data.mrrMovement.net).toBe(-80);
        }
      });
    });

    describe("Expansion and Contraction MRR", () => {
      it("returns 0 for expansion and contraction (future enhancement)", async () => {
        mockAuth.mockResolvedValue({ user: { id: "admin-1" } });
        mockDb.user.findUnique.mockResolvedValue({ role: "ADMIN" });

        mockDb.subscription.findMany.mockResolvedValueOnce([]);
        mockDb.subscription.findMany.mockResolvedValueOnce([]);
        mockDb.subscription.findMany.mockResolvedValueOnce([]);

        mockDb.subscription.groupBy.mockResolvedValue([]);
        mockDb.$queryRaw.mockResolvedValue([]);

        const result = await getAdminAnalytics();

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.mrrMovement.expansion).toBe(0);
          expect(result.data.mrrMovement.contraction).toBe(0);
        }
      });
    });
  });
});
});
