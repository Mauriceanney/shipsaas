/**
 * Usage Metering Service
 * Tracks and enforces usage limits per subscription plan
 */

import { db } from "@/lib/db";
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

  if (metric === "storageBytes") {
    return db.usage.update({
      where: { id: usage.id },
      data: {
        storageBytes: { increment: BigInt(amount) },
      },
    });
  }

  return db.usage.update({
    where: { id: usage.id },
    data: {
      [metric]: { increment: amount },
    },
  });
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

  if (metric === "storageBytes") {
    const newValue = usage.storageBytes - BigInt(amount);
    return db.usage.update({
      where: { id: usage.id },
      data: {
        storageBytes: newValue < BigInt(0) ? BigInt(0) : newValue,
      },
    });
  }

  const currentValue = usage[metric] as number;
  const newValue = Math.max(0, currentValue - amount);

  return db.usage.update({
    where: { id: usage.id },
    data: {
      [metric]: newValue,
    },
  });
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

/**
 * Check if usage is approaching limit (80% threshold)
 */
export function isApproachingLimit(used: number, limit: number): boolean {
  if (isUnlimited(limit)) return false;
  return used >= limit * 0.8;
}

/**
 * Calculate usage percentage
 */
export function getUsagePercentage(used: number, limit: number): number {
  if (isUnlimited(limit)) return 0;
  if (limit === 0) return 100;
  return Math.min(100, Math.round((used / limit) * 100));
}
