/**
 * Usage Metering Service
 * Tracks and enforces usage limits per subscription plan
 */

import { db } from "@/lib/db";
import { invalidateUserDashboard } from "@/lib/redis";
import { getPlanLimits, isUnlimited } from "@/lib/stripe/config";

import type { Plan } from "@prisma/client";

/**
 * Get current billing period in YYYY-MM format
 */
export function getCurrentPeriod(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Usage metric types
 */
export type UsageMetric = "apiCalls" | "projectsCount" | "storageBytes" | "teamMembers";

/**
 * Usage data for display
 */
export type UsageData = {
  apiCalls: { used: number; limit: number };
  projects: { used: number; limit: number };
  storage: { used: bigint; limit: number };
  teamMembers: { used: number; limit: number };
};

/**
 * Get or create usage record for a user and period
 */
export async function getOrCreateUsage(userId: string, period: string = getCurrentPeriod()) {
  const existing = await db.usage.findUnique({
    where: { userId_period: { userId, period } },
  });

  if (existing) {
    return existing;
  }

  // Create new usage record for this period
  return db.usage.create({
    data: {
      userId,
      period,
      apiCalls: 0,
      projectsCount: 0,
      storageBytes: BigInt(0),
      teamMembers: 0,
    },
  });
}

/**
 * Get usage data for a user with plan limits
 */
export async function getUserUsage(userId: string, plan: Plan): Promise<UsageData> {
  const usage = await getOrCreateUsage(userId);
  const limits = getPlanLimits(plan);

  return {
    apiCalls: { used: usage.apiCalls, limit: limits.apiCalls },
    projects: { used: usage.projectsCount, limit: limits.projects },
    storage: { used: usage.storageBytes, limit: limits.storageBytes },
    teamMembers: { used: usage.teamMembers, limit: limits.teamMembers },
  };
}

/**
 * Increment a usage metric
 */
export async function incrementUsage(
  userId: string,
  metric: UsageMetric,
  amount: number = 1
) {
  const period = getCurrentPeriod();
  const usage = await getOrCreateUsage(userId, period);

  const result = metric === "storageBytes"
    ? await db.usage.update({
        where: { id: usage.id },
        data: {
          storageBytes: { increment: BigInt(amount) },
        },
      })
    : await db.usage.update({
        where: { id: usage.id },
        data: {
          [metric]: { increment: amount },
        },
      });

  // Invalidate user dashboard cache after usage update
  await invalidateUserDashboard(userId);

  return result;
}

/**
 * Decrement a usage metric (for when resources are deleted)
 */
export async function decrementUsage(
  userId: string,
  metric: UsageMetric,
  amount: number = 1
) {
  const period = getCurrentPeriod();
  const usage = await getOrCreateUsage(userId, period);

  const result = metric === "storageBytes"
    ? await db.usage.update({
        where: { id: usage.id },
        data: {
          storageBytes: usage.storageBytes - BigInt(amount) < BigInt(0) ? BigInt(0) : usage.storageBytes - BigInt(amount),
        },
      })
    : await db.usage.update({
        where: { id: usage.id },
        data: {
          [metric]: Math.max(0, (usage[metric] as number) - amount),
        },
      });

  // Invalidate user dashboard cache after usage update
  await invalidateUserDashboard(userId);

  return result;
}

/**
 * Check if a user can use a specific metric (within quota)
 */
export async function canUseMetric(
  userId: string,
  plan: Plan,
  metric: UsageMetric,
  amountToAdd: number = 1
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const usage = await getOrCreateUsage(userId);
  const limits = getPlanLimits(plan);

  // Map metric to limit key
  const limitKey = metric === "projectsCount" ? "projects" : metric;
  const limit = limits[limitKey as keyof typeof limits];

  // Unlimited
  if (isUnlimited(limit)) {
    const currentValue = metric === "storageBytes"
      ? Number(usage.storageBytes)
      : (usage[metric] as number);
    return { allowed: true, current: currentValue, limit: -1 };
  }

  if (metric === "storageBytes") {
    const current = Number(usage.storageBytes);
    return {
      allowed: current + amountToAdd <= limit,
      current,
      limit,
    };
  }

  const current = usage[metric] as number;
  return {
    allowed: current + amountToAdd <= limit,
    current,
    limit,
  };
}

// Re-export utility functions for convenience
export { isApproachingLimit, getUsagePercentage } from "./utils";
