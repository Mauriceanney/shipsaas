"use client";

/**
 * Client-side analytics helpers
 * PostHog tracking for browser-based events
 */

import posthog from "posthog-js";
import { analyticsConfig } from "./config";

// Module-level flag to prevent double initialization
let isInitialized = false;

/**
 * Session type for analytics - matches Better Auth session structure
 */
type AnalyticsSession = {
  user?: {
    id: string;
  } | null;
  subscription?: {
    plan: string;
  } | null;
};

/**
 * Initialize PostHog client
 * Called once in PostHogProvider
 */
export function initPostHog(): void {
  if (typeof window === "undefined") return;
  if (!analyticsConfig.posthogKey) return;

  // Prevent double initialization using module-level flag
  if (isInitialized) return;
  isInitialized = true;

  posthog.init(analyticsConfig.posthogKey, {
    api_host: analyticsConfig.posthogHost,
    person_profiles: "identified_only",
    capture_pageview: false, // Manual pageview tracking
    capture_pageleave: true,
    opt_out_capturing_by_default: true, // GDPR: Require explicit opt-in
    loaded: (ph) => {
      if (analyticsConfig.debug) {
        ph.debug();
      }
    },
  });
}

/**
 * Identify authenticated user
 * Call this on login or when session is available
 * Note: We only track plan for analytics, not PII (email/name) for privacy
 */
export function identifyUser(session: AnalyticsSession): void {
  if (!analyticsConfig.posthogKey) return;
  if (!session?.user?.id) return;

  posthog.identify(session.user.id, {
    plan: session.subscription?.plan || "FREE",
  });
}

/**
 * Track a custom event
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>
): void {
  if (!analyticsConfig.posthogKey) return;

  posthog.capture(eventName, properties);
}

/**
 * Track page view
 */
export function trackPageView(url: string): void {
  if (!analyticsConfig.posthogKey) return;

  posthog.capture("$pageview", { $current_url: url });
}

/**
 * Update user properties
 */
export function setUserProperties(properties: Record<string, unknown>): void {
  if (!analyticsConfig.posthogKey) return;

  posthog.setPersonProperties(properties);
}

/**
 * Reset analytics on logout
 */
export function resetAnalytics(): void {
  if (!analyticsConfig.posthogKey) return;

  posthog.reset();
}

/**
 * Opt user in to analytics (after cookie consent)
 */
export function optInAnalytics(): void {
  if (!analyticsConfig.posthogKey) return;

  posthog.opt_in_capturing();
}

/**
 * Opt user out of analytics
 */
export function optOutAnalytics(): void {
  if (!analyticsConfig.posthogKey) return;

  posthog.opt_out_capturing();
}

/**
 * Get PostHog instance for advanced usage
 */
export function getPostHog(): typeof posthog {
  return posthog;
}
