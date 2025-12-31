/**
 * Quota Enforcement Utilities
 * Server-side checks for usage limits
 */

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

import { canUseMetric, type UsageMetric } from "./index";

type QuotaCheckResult =
  | { success: true; allowed: true }
  | { success: true; allowed: false; error: string; current: number; limit: number }
  | { success: false; error: string };

/**
 * Check if user can perform an operation that uses a quota
 * Returns a detailed result with current usage and limits
 */
export async function checkQuota(
  metric: UsageMetric,
  amount: number = 1
): Promise<QuotaCheckResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  // Get user's subscription plan
  const subscription = await db.subscription.findUnique({
    where: { userId: session.user.id },
    select: { plan: true, status: true },
  });

  // Default to FREE plan if no subscription
  const plan = subscription?.plan ?? "FREE";

  // Check if subscription is active (allow ACTIVE, TRIALING, and PAST_DUE with grace)
  const activeStatuses = ["ACTIVE", "TRIALING", "PAST_DUE"];
  if (subscription && !activeStatuses.includes(subscription.status)) {
    return {
      success: true,
      allowed: false,
      error: "Subscription is not active",
      current: 0,
      limit: 0,
    };
  }

  const result = await canUseMetric(session.user.id, plan, metric, amount);

  if (!result.allowed) {
    const metricDisplayNames: Record<UsageMetric, string> = {
      apiCalls: "API calls",
      projectsCount: "projects",
      storageBytes: "storage",
      teamMembers: "team members",
    };

    return {
      success: true,
      allowed: false,
      error: `${metricDisplayNames[metric]} limit reached. Upgrade your plan for more.`,
      current: result.current,
      limit: result.limit,
    };
  }

  return { success: true, allowed: true };
}

/**
 * Require quota to be available - returns error result if not
 * Use this in server actions to enforce limits
 */
export async function requireQuota(
  metric: UsageMetric,
  amount: number = 1
): Promise<
  | { success: true; userId: string }
  | { success: false; error: string }
> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const result = await checkQuota(metric, amount);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  if (!result.allowed) {
    return { success: false, error: result.error };
  }

  return { success: true, userId: session.user.id };
}
