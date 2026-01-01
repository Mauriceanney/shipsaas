/**
 * Analytics module exports
 */

// Configuration
export { analyticsConfig, isAnalyticsEnabled } from "./config";

// Event constants
export {
  ADMIN_EVENTS,
  ANALYTICS_EVENTS,
  AUTH_EVENTS,
  DASHBOARD_EVENTS,
  ERROR_EVENTS,
  EXPORT_EVENTS,
  FEATURE_EVENTS,
  NAVIGATION_EVENTS,
  ONBOARDING_EVENTS,
  SEARCH_EVENTS,
  SETTINGS_EVENTS,
  SUBSCRIPTION_EVENTS,
  UPGRADE_PROMPT_EVENTS,
} from "./events";
export type { AnalyticsEvent } from "./events";

// Server-side helpers
export {
  getPostHogClient,
  identifyUserServer,
  shutdownAnalytics,
  trackServerEvent,
} from "./server";

// Client-side helpers
export {
  getPostHog,
  identifyUser,
  initPostHog,
  optInAnalytics,
  optOutAnalytics,
  resetAnalytics,
  setUserProperties,
  trackEvent,
  trackPageView,
} from "./client";

// Web Vitals tracking
export { reportWebVitals } from "./web-vitals";
