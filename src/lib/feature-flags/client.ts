"use client";

/**
 * Client-side feature flag hooks
 * Uses PostHog React SDK with fallback support
 */

import { useCallback, useMemo } from "react";
import { usePostHog, useFeatureFlagEnabled } from "posthog-js/react";

/**
 * Hook to check if a feature flag is enabled (client-side)
 *
 * Uses PostHog's React SDK which automatically:
 * - Bootstraps with any server-provided flag values
 * - Handles loading states
 * - Subscribes to flag changes
 *
 * @param flagKey - The feature flag key
 * @param defaultValue - Default value while loading or if flag not found
 * @returns Whether the flag is enabled
 */
export function useFeatureFlag(flagKey: string, defaultValue = false): boolean {
  const posthogEnabled = useFeatureFlagEnabled(flagKey);

  // PostHog returns undefined while loading, then boolean
  // Use default value if undefined or null
  if (posthogEnabled === undefined || posthogEnabled === null) {
    return defaultValue;
  }

  return posthogEnabled;
}

/**
 * Hook to check multiple feature flags at once
 *
 * @param flagKeys - Array of feature flag keys
 * @param defaults - Default values for each flag
 * @returns Object with flag keys and their boolean values
 */
export function useFeatureFlags(
  flagKeys: string[],
  defaults: Record<string, boolean> = {}
): Record<string, boolean> {
  const posthog = usePostHog();

  return useMemo(() => {
    const flags: Record<string, boolean> = {};

    for (const key of flagKeys) {
      const value = posthog?.isFeatureEnabled(key);
      flags[key] = typeof value === "boolean" ? value : (defaults[key] ?? false);
    }

    return flags;
  }, [flagKeys, defaults, posthog]);
}

/**
 * Hook to get the PostHog feature flag with loading state
 *
 * @param flagKey - The feature flag key
 * @param defaultValue - Default value
 * @returns Object with enabled state and loading indicator
 */
export function useFeatureFlagWithLoading(
  flagKey: string,
  defaultValue = false
): { enabled: boolean; isLoading: boolean } {
  const posthogEnabled = useFeatureFlagEnabled(flagKey);

  const isLoading = posthogEnabled === undefined;
  const enabled = isLoading ? defaultValue : (posthogEnabled ?? defaultValue);

  return { enabled, isLoading };
}

/**
 * Hook to track when a feature flag is evaluated
 * Useful for analytics on flag usage
 */
export function useFeatureFlagWithTracking(
  flagKey: string,
  defaultValue = false
): boolean {
  const posthog = usePostHog();
  const enabled = useFeatureFlag(flagKey, defaultValue);

  const trackEvaluation = useCallback(() => {
    posthog?.capture("feature_flag_evaluated", {
      flag_key: flagKey,
      flag_value: enabled,
    });
  }, [posthog, flagKey, enabled]);

  // Track on first render (could be enhanced with useEffect)
  useMemo(() => {
    trackEvaluation();
  }, [trackEvaluation]);

  return enabled;
}
