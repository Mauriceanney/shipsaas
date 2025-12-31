"use client";

/**
 * FeatureFlag Component (Client-side)
 * Conditionally renders children based on PostHog feature flag
 */

import { useFeatureFlag } from "@/lib/feature-flags/client";

import type { ReactNode } from "react";

interface FeatureFlagProps {
  /** The feature flag key to check */
  flag: string;
  /** Content to render when flag is enabled */
  children: ReactNode;
  /** Content to render when flag is disabled (optional) */
  fallback?: ReactNode;
  /** Default value while loading (optional) */
  defaultValue?: boolean;
}

/**
 * Client-side feature flag component
 *
 * Uses PostHog to check if a feature flag is enabled.
 * Renders children when enabled, fallback when disabled.
 *
 * @example
 * ```tsx
 * <FeatureFlag flag="new-dashboard" fallback={<OldDashboard />}>
 *   <NewDashboard />
 * </FeatureFlag>
 * ```
 */
export function FeatureFlag({
  flag,
  children,
  fallback = null,
  defaultValue = false,
}: FeatureFlagProps) {
  const isEnabled = useFeatureFlag(flag, defaultValue);

  if (isEnabled) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
