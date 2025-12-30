/**
 * Feature gating utilities for plan-based access control
 *
 * @example Basic usage in a server action
 * ```typescript
 * import { requirePlan } from "@/lib/auth/feature-gate";
 *
 * export async function premiumAction() {
 *   const result = await requirePlan("PRO");
 *   if (!result.success) {
 *     return { success: false, error: result.error };
 *   }
 *
 *   const session = result.data;
 *   // ... premium feature logic
 * }
 * ```
 *
 * @example Checking access without enforcement
 * ```typescript
 * import { auth } from "@/lib/auth";
 * import { canAccessFeature } from "@/lib/auth/feature-gate";
 *
 * const session = await auth();
 * const { canAccess, reason } = canAccessFeature(session, "ENTERPRISE");
 *
 * if (!canAccess) {
 *   // Show upgrade prompt based on reason
 * }
 * ```
 */

import { auth } from "@/lib/auth";

import type { Session } from "next-auth";

export type Plan = "FREE" | "PRO" | "ENTERPRISE";
export type SubscriptionStatus = "ACTIVE" | "INACTIVE" | "PAST_DUE" | "CANCELED" | "TRIALING";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

const PLAN_HIERARCHY = {
  FREE: 0,
  PRO: 1,
  ENTERPRISE: 2,
} as const;

const PAST_DUE_GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const ACTIVE_STATUSES: SubscriptionStatus[] = ["ACTIVE", "TRIALING"];

/**
 * Get plan hierarchy tier number
 * @param plan - Plan name
 * @returns Tier number (0=FREE, 1=PRO, 2=ENTERPRISE)
 */
export function getPlanHierarchy(plan: Plan): number {
  return PLAN_HIERARCHY[plan];
}

/**
 * Check if user has access based on plan and subscription status
 * Pure function - no side effects
 *
 * @param session - User session with subscription data
 * @param requiredPlan - Minimum plan required
 * @returns true if user has access, false otherwise
 */
export function hasAccess(session: Session, requiredPlan: Plan): boolean {
  const userPlanTier = getPlanHierarchy(session.subscription.plan);
  const requiredPlanTier = getPlanHierarchy(requiredPlan);

  // Check if user's plan tier is sufficient
  if (userPlanTier < requiredPlanTier) {
    return false;
  }

  // Check subscription status
  const { status, statusChangedAt } = session.subscription;

  // ACTIVE and TRIALING always grant access
  if (ACTIVE_STATUSES.includes(status)) {
    return true;
  }

  // PAST_DUE: check grace period
  if (status === "PAST_DUE") {
    // Must have statusChangedAt to calculate grace period
    if (!statusChangedAt) {
      return false;
    }

    const statusChangedTime = new Date(statusChangedAt).getTime();
    const now = Date.now();
    const timeSinceChange = now - statusChangedTime;

    // Within grace period
    if (timeSinceChange <= PAST_DUE_GRACE_PERIOD_MS) {
      return true;
    }
  }

  // INACTIVE, CANCELED, or PAST_DUE beyond grace period
  return false;
}

/**
 * Check if user can access a feature and return detailed reason
 *
 * @param session - User session with subscription data
 * @param requiredPlan - Minimum plan required
 * @returns Object with canAccess boolean and optional reason
 */
export function canAccessFeature(
  session: Session,
  requiredPlan: Plan
): { canAccess: boolean; reason?: string } {
  const userPlanTier = getPlanHierarchy(session.subscription.plan);
  const requiredPlanTier = getPlanHierarchy(requiredPlan);

  // Check plan tier
  if (userPlanTier < requiredPlanTier) {
    return {
      canAccess: false,
      reason: "upgrade_required",
    };
  }

  // Check subscription status
  const { status, statusChangedAt } = session.subscription;

  // ACTIVE and TRIALING always grant access
  if (ACTIVE_STATUSES.includes(status)) {
    return { canAccess: true };
  }

  // PAST_DUE: check grace period
  if (status === "PAST_DUE") {
    if (!statusChangedAt) {
      return {
        canAccess: false,
        reason: "payment_overdue",
      };
    }

    const statusChangedTime = new Date(statusChangedAt).getTime();
    const now = Date.now();
    const timeSinceChange = now - statusChangedTime;

    // Within grace period
    if (timeSinceChange <= PAST_DUE_GRACE_PERIOD_MS) {
      return { canAccess: true };
    }

    return {
      canAccess: false,
      reason: "payment_overdue",
    };
  }

  // INACTIVE or CANCELED
  return {
    canAccess: false,
    reason: "subscription_inactive",
  };
}

/**
 * Server-side enforcement of plan requirements
 * Similar to requireAdmin() pattern
 *
 * @param requiredPlan - Minimum plan required
 * @returns ActionResult with session or error
 */
export async function requirePlan(
  requiredPlan: Plan
): Promise<ActionResult<Session>> {
  // 1. Check authentication
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  // 2. Check plan access
  if (!hasAccess(session, requiredPlan)) {
    const userPlanTier = getPlanHierarchy(session.subscription.plan);
    const requiredPlanTier = getPlanHierarchy(requiredPlan);

    // Plan tier insufficient
    if (userPlanTier < requiredPlanTier) {
      return {
        success: false,
        error: `Upgrade to ${requiredPlan} required`,
      };
    }

    // Subscription status issue
    const { status } = session.subscription;

    if (status === "PAST_DUE") {
      // Past grace period
      return {
        success: false,
        error: "Payment overdue",
      };
    }

    // INACTIVE or CANCELED
    return {
      success: false,
      error: "Active subscription required",
    };
  }

  // 3. Access granted
  return { success: true, data: session };
}
