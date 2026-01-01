/**
 * Analytics module exports
 */

// Configuration
export { analyticsConfig, isAnalyticsEnabled } from "./config";

// Event constants
export {
  ANALYTICS_EVENTS,
  AUTH_EVENTS,
  FEATURE_EVENTS,
  SUBSCRIPTION_EVENTS,
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
