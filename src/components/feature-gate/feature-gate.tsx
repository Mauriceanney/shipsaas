"use client";

import { useSession } from "next-auth/react";

import { UpgradeCard } from "./upgrade-card";

import type { Plan, SubscriptionStatus } from "@prisma/client";
import type { ReactNode } from "react";

type FeatureGateProps = {
  plan: "PLUS" | "PRO";
  fallback?: ReactNode;
  children: ReactNode;
};

/**
 * Plan hierarchy for access control
 * FREE < PRO < ENTERPRISE
 */
const PLAN_HIERARCHY: Record<Plan, number> = {
  FREE: 0,
  PLUS: 1,
  PRO: 2,
};

/**
 * Valid subscription statuses that grant access
 * ACTIVE and TRIALING grant access
 * PAST_DUE is handled server-side with grace period
 */
const VALID_STATUSES: SubscriptionStatus[] = ["ACTIVE", "TRIALING"];

/**
 * Pure function to check if user has access to a feature based on plan hierarchy
 *
 * @param subscription - User's subscription data (can be null/undefined)
 * @param requiredPlan - The minimum plan required to access the feature
 * @returns true if user has access, false otherwise
 */
export function hasClientAccess(
  subscription: { plan: Plan; status: SubscriptionStatus } | null | undefined,
  requiredPlan: "PLUS" | "PRO"
): boolean {
  // No subscription means FREE plan (no access to paid features)
  if (!subscription) {
    return false;
  }

  // Check if subscription status is valid (ACTIVE or TRIALING)
  if (!VALID_STATUSES.includes(subscription.status)) {
    return false;
  }

  // Check plan hierarchy: user's plan must be >= required plan
  const userPlanLevel = PLAN_HIERARCHY[subscription.plan];
  const requiredPlanLevel = PLAN_HIERARCHY[requiredPlan];

  return userPlanLevel >= requiredPlanLevel;
}

/**
 * FeatureGate component - Client-side feature gating based on subscription plan
 *
 * Renders children if user has the required plan, otherwise shows an upgrade CTA.
 * Uses next-auth/react's useSession for client-side session access.
 *
 * @example
 * ```tsx
 * <FeatureGate plan="PLUS">
 *   <AdvancedAnalyticsDashboard />
 * </FeatureGate>
 * ```
 */
export function FeatureGate({ plan, fallback, children }: FeatureGateProps) {
  const { data: session } = useSession();

  // Check if user has access based on their subscription
  // Session structure has subscription at root level
  const hasAccess = hasClientAccess(
    session?.subscription
      ? {
          plan: session.subscription.plan,
          status: session.subscription.status,
        }
      : null,
    plan
  );

  // Render children if user has access
  if (hasAccess) {
    return <>{children}</>;
  }

  // Render fallback or default UpgradeCard
  return <>{fallback ?? <UpgradeCard requiredPlan={plan} />}</>;
}
