/**
 * Analytics configuration
 * PostHog settings and environment validation
 */

export const analyticsConfig = {
  posthogKey: process.env["NEXT_PUBLIC_POSTHOG_KEY"],
  posthogHost:
    process.env["NEXT_PUBLIC_POSTHOG_HOST"] || "https://us.i.posthog.com",
  enabled:
    process.env.NODE_ENV === "production" &&
    !!process.env["NEXT_PUBLIC_POSTHOG_KEY"],
  debug: process.env["NEXT_PUBLIC_POSTHOG_DEBUG"] === "true",
} as const;

/**
 * Check if analytics is enabled
 */
export function isAnalyticsEnabled(): boolean {
  return analyticsConfig.enabled;
}
