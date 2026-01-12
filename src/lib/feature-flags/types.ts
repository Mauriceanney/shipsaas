/**
 * Feature Flags Types
 * Type definitions for PostHog-based feature flags
 */

/**
 * Options for feature flag evaluation
 */
export interface FeatureFlagOptions {
  /** Default value if flag cannot be resolved */
  defaultValue?: boolean;
  /** User properties to send to PostHog for targeting */
  userProperties?: Record<string, string | number | boolean | undefined>;
}

/**
 * Result of a feature flag evaluation
 */
export interface FeatureFlagResult {
  /** Whether the flag is enabled */
  enabled: boolean;
  /** Source of the flag value */
  source: "posthog" | "default";
}

/**
 * Feature flag with metadata
 */
export interface FeatureFlagInfo {
  /** Flag key/name */
  key: string;
  /** Whether the flag is enabled */
  enabled: boolean;
  /** Source of the flag value */
  source: "posthog" | "default";
  /** Timestamp when the flag was evaluated */
  evaluatedAt: Date;
}
