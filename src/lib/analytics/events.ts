/**
 * Analytics event constants
 * Centralized event names for consistency and type safety
 */

// Authentication events
export const AUTH_EVENTS = {
  SIGNUP_COMPLETED: "signup_completed",
  LOGIN_SUCCESS: "login_success",
  LOGOUT: "logout",
  TWO_FACTOR_ENABLED: "two_factor_enabled",
  TWO_FACTOR_DISABLED: "two_factor_disabled",
} as const;

// Subscription events
export const SUBSCRIPTION_EVENTS = {
  CHECKOUT_STARTED: "checkout_started",
  SUBSCRIPTION_CREATED: "subscription_created",
  SUBSCRIPTION_UPDATED: "subscription_updated",
  SUBSCRIPTION_CANCELED: "subscription_canceled",
  PAYMENT_FAILED: "payment_failed",
  PAYMENT_SUCCEEDED: "payment_succeeded",
} as const;

// Upgrade prompt events (usage limit tracking)
export const UPGRADE_PROMPT_EVENTS = {
  UPGRADE_PROMPT_SHOWN: "upgrade_prompt_shown",
  UPGRADE_PROMPT_CLICKED: "upgrade_prompt_clicked",
  UPGRADE_PROMPT_DISMISSED: "upgrade_prompt_dismissed",
  UPGRADE_LIMIT_BLOCKED: "upgrade_limit_blocked",
} as const;

// Feature usage events
export const FEATURE_EVENTS = {
  FEATURE_USED: "feature_used",
  FEATURE_GATE_HIT: "feature_gate_hit",
  SETTINGS_UPDATED: "settings_updated",
  DATA_EXPORTED: "data_exported",
} as const;

// Export all events
export const ANALYTICS_EVENTS = {
  ...AUTH_EVENTS,
  ...SUBSCRIPTION_EVENTS,
  ...UPGRADE_PROMPT_EVENTS,
  ...FEATURE_EVENTS,
} as const;

export type AnalyticsEvent =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];
