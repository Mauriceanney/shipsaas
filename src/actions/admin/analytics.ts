"use server";

/**
 * Admin Analytics Server Actions
 * Get revenue metrics, churn data, and trends for admin dashboard
 */

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getCachedData, CACHE_KEYS, CACHE_TTL } from "@/lib/redis";
import { STRIPE_PRICE_IDS, PLAN_PRICING } from "@/lib/stripe/config";

/**
 * Analytics data types
 */
export type AnalyticsData = {
  revenue: {
    mrr: number;
    arr: number;
    byPlan: {
      FREE: number;
      PLUS: number;
      PRO: number;
    };
  };
  churn: {
    rate: number;
    count: number;
    total: number;
  };
  trends: {
    signups: Array<{
      month: string;
      count: number;
    }>;
  };
  subscriptions: {
    active: number;
    trialing: number;
    pastDue: number;
    canceled: number;
  };
  // Advanced revenue metrics
  ltv: {
    value: number;           // Lifetime Value in dollars
    arpu: number;            // Average Revenue Per User (monthly)
    avgLifetimeMonths: number; // Average customer lifetime in months
    payingCustomers: number; // Number of paying customers
  };
};

/**
 * Map price IDs to monthly revenue amounts
 */
function getPriceToMonthlyMap(): Record<string, { amount: number; plan: "PLUS" | "PRO" }> {
  return {
    [STRIPE_PRICE_IDS.PLUS.monthly]: { amount: PLAN_PRICING.PLUS.monthly, plan: "PLUS" },
    [STRIPE_PRICE_IDS.PLUS.yearly]: { amount: PLAN_PRICING.PLUS.yearly / 12, plan: "PLUS" },
    [STRIPE_PRICE_IDS.PRO.monthly]: { amount: PLAN_PRICING.PRO.monthly, plan: "PRO" },
    [STRIPE_PRICE_IDS.PRO.yearly]: { amount: PLAN_PRICING.PRO.yearly / 12, plan: "PRO" },
  };
}

/**
 * Get analytics for admin dashboard
 */
export async function getAdminAnalytics() {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" } as const;
  }

  // Verify admin role
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    return { success: false, error: "Forbidden" } as const;
  }

  try {
    const analytics = await getCachedData(
      CACHE_KEYS.adminAnalytics(),
      async () => {
        const priceToMonthly = getPriceToMonthlyMap();

        // Get active subscriptions for MRR calculation
        const activeSubscriptions = await db.subscription.findMany({
          where: {
            status: { in: ["ACTIVE", "TRIALING"] },
            stripePriceId: { not: null },
          },
          select: { stripePriceId: true },
        });

        // Calculate MRR and revenue by plan
        let mrr = 0;
        const revenueByPlan = { FREE: 0, PLUS: 0, PRO: 0 };

        for (const sub of activeSubscriptions) {
          if (sub.stripePriceId) {
            const priceInfo = priceToMonthly[sub.stripePriceId];
            if (priceInfo) {
              mrr += priceInfo.amount;
              revenueByPlan[priceInfo.plan] += priceInfo.amount;
            }
          }
        }

        const arr = mrr * 12;

        // Get subscription status counts for churn calculation
        const subscriptionStats = await db.subscription.groupBy({
          by: ["status"],
          _count: { id: true },
        });

        let activeCount = 0;
        let trialingCount = 0;
        let pastDueCount = 0;
        let canceledCount = 0;

        for (const stat of subscriptionStats) {
          const count = stat._count.id;
          if (stat.status === "ACTIVE") {
            activeCount = count;
          } else if (stat.status === "TRIALING") {
            trialingCount = count;
          } else if (stat.status === "PAST_DUE") {
            pastDueCount = count;
          } else if (stat.status === "CANCELED") {
            canceledCount = count;
          }
        }

        // Calculate churn rate
        const totalAtMonthStart = activeCount + trialingCount + canceledCount;
        const churnRate = totalAtMonthStart > 0
          ? (canceledCount / totalAtMonthStart) * 100
          : 0;

        // Calculate LTV metrics
        const payingCustomers = activeCount + trialingCount;
        const arpu = payingCustomers > 0 ? mrr / payingCustomers : 0;
        const monthlyChurnRate = churnRate / 100; // Convert to decimal

        // LTV = ARPU / Monthly Churn Rate
        // If churn is 0, use a conservative estimate (12 months lifetime)
        const avgLifetimeMonths = monthlyChurnRate > 0
          ? 1 / monthlyChurnRate
          : 12; // Default to 12 months if no churn
        const ltv = arpu * avgLifetimeMonths;

        /**
         * SECURITY: Raw SQL query for signup trends.
         * - Uses $queryRaw with template literal for PostgreSQL-specific TO_CHAR function
         * - All values are parameterized by Prisma (no string interpolation)
         * - Table and column names are hard-coded (never dynamic)
         * - No user input is incorporated in query structure
         * - OWASP A03:2021 - Injection: Mitigated via parameterization
         * @see https://www.prisma.io/docs/orm/prisma-client/using-raw-sql/raw-queries#sql-injection
         */
        const signupTrends = await db.$queryRaw<
          Array<{ month: string; count: bigint }>
        >`
          SELECT
            TO_CHAR("createdAt", 'YYYY-MM') as month,
            COUNT(*) as count
          FROM "User"
          WHERE "createdAt" >= NOW() - INTERVAL '12 months'
            AND "deletedAt" IS NULL
          GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
          ORDER BY month ASC
        `;

        const signups = signupTrends.map((row) => ({
          month: row.month,
          count: Number(row.count),
        }));

        const analytics: AnalyticsData = {
          revenue: {
            mrr,
            arr,
            byPlan: revenueByPlan,
          },
          churn: {
            rate: churnRate,
            count: canceledCount,
            total: totalAtMonthStart,
          },
          trends: {
            signups,
          },
          subscriptions: {
            active: activeCount,
            trialing: trialingCount,
            pastDue: pastDueCount,
            canceled: canceledCount,
          },
          ltv: {
            value: ltv,
            arpu,
            avgLifetimeMonths,
            payingCustomers,
          },
        };

        return analytics;
      },
      CACHE_TTL.adminAnalytics
    );

    return { success: true, data: analytics } as const;
  } catch (error) {
    logger.error(
      { err: error, userId: session?.user?.id },
      "getAdminAnalytics error"
    );
    return { success: false, error: "Failed to get analytics" } as const;
  }
}
