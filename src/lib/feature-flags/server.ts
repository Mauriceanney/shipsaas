/**
 * Server-side feature flag utilities
 * Uses PostHog with database fallback
 */

import { db } from "@/lib/db";

import { getPostHogClient } from "../analytics/server";

import type { FeatureFlagOptions, FeatureFlagResult } from "./types";

/**
 * Check if a feature flag is enabled (server-side)
 *
 * Evaluation order:
 * 1. Try PostHog (if configured and userId provided)
 * 2. Fall back to database (AppConfig table)
 * 3. Use default value
 *
 * @param flagKey - The feature flag key
 * @param userId - Optional user ID for user-specific flags
 * @param options - Optional flag evaluation options
 * @returns Feature flag result with value and source
 */
export async function isFeatureFlagEnabled(
  flagKey: string,
  userId?: string,
  options: FeatureFlagOptions = {}
): Promise<FeatureFlagResult> {
  const { defaultValue = false, userProperties } = options;

  // 1. Try PostHog if user ID is provided
  if (userId) {
    const posthogResult = await checkPostHogFlag(flagKey, userId, userProperties);
    if (posthogResult !== null) {
      return { enabled: posthogResult, source: "posthog" };
    }
  }

  // 2. Fall back to database
  const dbResult = await checkDatabaseFlag(flagKey);
  if (dbResult !== null) {
    return { enabled: dbResult, source: "database" };
  }

  // 3. Use default value
  return { enabled: defaultValue, source: "default" };
}

/**
 * Check feature flag in PostHog
 */
async function checkPostHogFlag(
  flagKey: string,
  userId: string,
  userProperties?: Record<string, string | number | boolean | undefined>
): Promise<boolean | null> {
  try {
    const client = getPostHogClient();
    if (!client) {
      return null;
    }

    const result = await client.isFeatureEnabled(flagKey, userId, {
      personProperties: userProperties,
    });

    // PostHog returns boolean or undefined
    if (typeof result === "boolean") {
      return result;
    }

    return null;
  } catch (error) {
    console.error("[FeatureFlag] PostHog check failed:", error);
    return null;
  }
}

/**
 * Check feature flag in database (AppConfig table)
 */
async function checkDatabaseFlag(flagKey: string): Promise<boolean | null> {
  try {
    const config = await db.appConfig.findUnique({
      where: { key: `feature_flag_${flagKey}` },
      select: { value: true },
    });

    if (!config) {
      return null;
    }

    // Value is stored as string "true" or "false"
    return config.value === "true";
  } catch (error) {
    console.error("[FeatureFlag] Database check failed:", error);
    return null;
  }
}

/**
 * Simple boolean check for feature flag (convenience function)
 *
 * @param flagKey - The feature flag key
 * @param userId - Optional user ID for user-specific flags
 * @param defaultValue - Default value if flag cannot be resolved
 * @returns Whether the flag is enabled
 */
export async function isFeatureEnabled(
  flagKey: string,
  userId?: string,
  defaultValue = false
): Promise<boolean> {
  const result = await isFeatureFlagEnabled(flagKey, userId, { defaultValue });
  return result.enabled;
}

/**
 * Get all feature flags for a user (server-side)
 * Useful for passing to client-side context
 */
export async function getAllFeatureFlags(
  userId?: string,
  flagKeys: string[] = []
): Promise<Record<string, boolean>> {
  const flags: Record<string, boolean> = {};

  for (const key of flagKeys) {
    const result = await isFeatureFlagEnabled(key, userId);
    flags[key] = result.enabled;
  }

  return flags;
}
