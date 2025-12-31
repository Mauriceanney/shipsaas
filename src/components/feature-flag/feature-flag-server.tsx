/**
 * FeatureFlagServer Component (Server-side)
 * Conditionally renders children based on server-side feature flag check
 */

import { isFeatureEnabled } from "@/lib/feature-flags";

import type { ReactNode } from "react";

interface FeatureFlagServerProps {
  /** The feature flag key to check */
  flag: string;
  /** User ID for user-specific flags (optional) */
  userId?: string;
  /** Content to render when flag is enabled */
  children: ReactNode;
  /** Content to render when flag is disabled (optional) */
  fallback?: ReactNode;
  /** Default value if flag cannot be resolved (optional) */
  defaultValue?: boolean;
}

/**
 * Server-side feature flag component
 *
 * Checks PostHog and database for feature flag status.
 * Use this in Server Components for optimal performance.
 *
 * @example
 * ```tsx
 * <FeatureFlagServer flag="admin-panel" userId={session.user.id}>
 *   <AdminDashboard />
 * </FeatureFlagServer>
 * ```
 */
export async function FeatureFlagServer({
  flag,
  userId,
  children,
  fallback = null,
  defaultValue = false,
}: FeatureFlagServerProps) {
  const isEnabled = await isFeatureEnabled(flag, userId, defaultValue);

  if (isEnabled) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
