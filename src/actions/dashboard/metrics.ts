"use server";

/**
 * Dashboard Metrics Server Actions
 * Get real metrics for user and admin dashboards
 */

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCachedData, CACHE_KEYS, CACHE_TTL } from "@/lib/redis";
import { getUserUsage } from "@/lib/usage";

import type { Plan, SubscriptionStatus } from "@prisma/client";

/**
 * User dashboard metrics
 */
export type UserDashboardMetrics = {
  account: {
    memberSince: Date;
    lastActive: Date;
  };
  subscription: {
    plan: Plan;
    status: SubscriptionStatus;
    currentPeriodEnd: Date | null;
  } | null;
  usage: {
    apiCalls: { used: number; limit: number };
    projects: { used: number; limit: number };
    storage: { used: number; limit: number };
    teamMembers: { used: number; limit: number };
  };
  activity: {
    recentLogins: number;
    lastLoginAt: Date | null;
  };
};

/**
 * Admin dashboard metrics
 */
export type AdminDashboardMetrics = {
  users: {
    total: number;
    activeThisMonth: number;
    newThisMonth: number;
  };
  subscriptions: {
    active: number;
    trialing: number;
    pastDue: number;
    byPlan: {
      FREE: number;
      PLUS: number;
      PRO: number;
    };
  };
  recentSignups: Array<{
    id: string;
    email: string;
    name: string | null;
    createdAt: Date;
  }>;
};

/**
 * Get dashboard metrics for the current user
 */
export async function getUserDashboardMetrics() {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" } as const;
  }

  try {
    const metrics = await getCachedData(
      CACHE_KEYS.userDashboard(session.user.id),
      async () => {
        // Get user with subscription
        const user = await db.user.findUnique({
          where: { id: session.user.id },
          select: {
            createdAt: true,
            updatedAt: true,
            subscription: {
              select: {
                plan: true,
                status: true,
                stripeCurrentPeriodEnd: true,
              },
            },
          },
        });

        if (!user) {
          throw new Error("User not found");
        }

        // Get usage data
        const plan = user.subscription?.plan ?? "FREE";
        const usage = await getUserUsage(session.user.id, plan);

        // Get recent login count (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [recentLogins, lastLogin] = await Promise.all([
          db.loginHistory.count({
            where: {
              userId: session.user.id,
              success: true,
              createdAt: { gte: thirtyDaysAgo },
            },
          }),
          db.loginHistory.findFirst({
            where: {
              userId: session.user.id,
              success: true,
            },
            orderBy: { createdAt: "desc" },
            select: { createdAt: true },
          }),
        ]);

        const metrics: UserDashboardMetrics = {
          account: {
            memberSince: user.createdAt,
            lastActive: user.updatedAt,
          },
          subscription: user.subscription
            ? {
                plan: user.subscription.plan,
                status: user.subscription.status,
                currentPeriodEnd: user.subscription.stripeCurrentPeriodEnd,
              }
            : null,
          usage: {
            apiCalls: usage.apiCalls,
            projects: usage.projects,
            storage: { used: Number(usage.storage.used), limit: usage.storage.limit },
            teamMembers: usage.teamMembers,
          },
          activity: {
            recentLogins,
            lastLoginAt: lastLogin?.createdAt ?? null,
          },
        };

        return metrics;
      },
      CACHE_TTL.userDashboard
    );

    return { success: true, data: metrics } as const;
  } catch (error) {
    console.error("[getUserDashboardMetrics]", error);

    // Check if it's a "User not found" error
    if (error instanceof Error && error.message === "User not found") {
      return { success: false, error: "User not found" } as const;
    }

    return { success: false, error: "Failed to get dashboard metrics" } as const;
  }
}

/**
 * Get dashboard metrics for admin users
 */
export async function getAdminDashboardMetrics() {
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
    const metrics = await getCachedData(
      CACHE_KEYS.adminDashboard(),
      async () => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        /**
         * SECURITY: Optimized raw SQL query for user metrics.
         * - Uses $queryRaw with template literal for PostgreSQL-specific FILTER clause
         * - All values (startOfMonth) are parameterized by Prisma (no string interpolation)
         * - Table and column names are hard-coded (never dynamic)
         * - No user input is incorporated in query structure
         * - OWASP A03:2021 - Injection: Mitigated via parameterization
         * @see https://www.prisma.io/docs/orm/prisma-client/using-raw-sql/raw-queries#sql-injection
         */
        const userMetrics = await db.$queryRaw<
          Array<{
            total: bigint;
            active_this_month: bigint;
            new_this_month: bigint;
          }>
        >`
          SELECT
            COUNT(*) FILTER (WHERE "deletedAt" IS NULL) as total,
            COUNT(*) FILTER (WHERE "deletedAt" IS NULL AND "updatedAt" >= ${startOfMonth}) as active_this_month,
            COUNT(*) FILTER (WHERE "deletedAt" IS NULL AND "createdAt" >= ${startOfMonth}) as new_this_month
          FROM "User"
        `;

        const userStats = userMetrics[0];
        const totalUsers = Number(userStats?.total ?? 0);
        const activeThisMonth = Number(userStats?.active_this_month ?? 0);
        const newThisMonth = Number(userStats?.new_this_month ?? 0);

        // OPTIMIZED: Single groupBy query for all subscription metrics
        const subscriptionStats = await db.subscription.groupBy({
          by: ["status", "plan"],
          _count: { id: true },
        });

        // Process subscription stats
        let activeSubscriptions = 0;
        let trialingSubscriptions = 0;
        let pastDueSubscriptions = 0;
        let freeCount = 0;
        let plusCount = 0;
        let proCount = 0;

        for (const stat of subscriptionStats) {
          const count = stat._count.id;

          // Count by status
          if (stat.status === "ACTIVE") {
            activeSubscriptions += count;
          } else if (stat.status === "TRIALING") {
            trialingSubscriptions += count;
          } else if (stat.status === "PAST_DUE") {
            pastDueSubscriptions += count;
          }

          // Count by plan (only ACTIVE and TRIALING)
          if (stat.status === "ACTIVE" || stat.status === "TRIALING") {
            if (stat.plan === "FREE") {
              freeCount += count;
            } else if (stat.plan === "PLUS") {
              plusCount += count;
            } else if (stat.plan === "PRO") {
              proCount += count;
            }
          }
        }

        // Get recent signups (last 5)
        const recentSignups = await db.user.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
          },
        });

        const metrics: AdminDashboardMetrics = {
          users: {
            total: totalUsers,
            activeThisMonth,
            newThisMonth,
          },
          subscriptions: {
            active: activeSubscriptions,
            trialing: trialingSubscriptions,
            pastDue: pastDueSubscriptions,
            byPlan: {
              FREE: freeCount,
              PLUS: plusCount,
              PRO: proCount,
            },
          },
          recentSignups,
        };

        return metrics;
      },
      CACHE_TTL.adminDashboard
    );

    return { success: true, data: metrics } as const;
  } catch (error) {
    console.error("[getAdminDashboardMetrics]", error);
    return { success: false, error: "Failed to get admin metrics" } as const;
  }
}
