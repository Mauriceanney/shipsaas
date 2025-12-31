"use server";

/**
 * Dashboard Metrics Server Actions
 * Get real metrics for user and admin dashboards
 */

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserUsage, getCurrentPeriod } from "@/lib/usage";
import { getCachedData, CACHE_KEYS, CACHE_TTL } from "@/lib/redis";

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

        // Get user counts
        const [totalUsers, activeThisMonth, newThisMonth] = await Promise.all([
          db.user.count({ where: { deletedAt: null } }),
          db.user.count({
            where: {
              deletedAt: null,
              updatedAt: { gte: startOfMonth },
            },
          }),
          db.user.count({
            where: {
              deletedAt: null,
              createdAt: { gte: startOfMonth },
            },
          }),
        ]);

        // Get subscription counts
        const [activeSubscriptions, trialingSubscriptions, pastDueSubscriptions] = await Promise.all([
          db.subscription.count({ where: { status: "ACTIVE" } }),
          db.subscription.count({ where: { status: "TRIALING" } }),
          db.subscription.count({ where: { status: "PAST_DUE" } }),
        ]);

        // Get subscriptions by plan
        const [freeCount, proCount, enterpriseCount] = await Promise.all([
          db.subscription.count({ where: { plan: "FREE", status: { in: ["ACTIVE", "TRIALING"] } } }),
          db.subscription.count({ where: { plan: "PLUS", status: { in: ["ACTIVE", "TRIALING"] } } }),
          db.subscription.count({ where: { plan: "PLUS", status: { in: ["ACTIVE", "TRIALING"] } } }),
        ]);

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
              PLUS: proCount,
              PRO: enterpriseCount,
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
