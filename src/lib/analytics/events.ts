/**
 * Analytics event constants
 * Centralized event names for consistency and type safety
 *
 * Event naming convention: category.action (e.g., "dashboard.viewed")
 */

// ============================================
// AUTHENTICATION EVENTS
// ============================================
export const AUTH_EVENTS = {
  SIGNUP_COMPLETED: "signup_completed",
  LOGIN_SUCCESS: "login_success",
  LOGOUT: "logout",
  TWO_FACTOR_ENABLED: "two_factor_enabled",
  TWO_FACTOR_DISABLED: "two_factor_disabled",
  PASSWORD_RESET_REQUESTED: "password_reset_requested",
  PASSWORD_RESET_COMPLETED: "password_reset_completed",
  EMAIL_VERIFIED: "email_verified",
} as const;

// ============================================
// SUBSCRIPTION EVENTS
// ============================================
export const SUBSCRIPTION_EVENTS = {
  CHECKOUT_STARTED: "checkout_started",
  SUBSCRIPTION_CREATED: "subscription_created",
  SUBSCRIPTION_UPDATED: "subscription_updated",
  SUBSCRIPTION_CANCELED: "subscription_canceled",
  PAYMENT_FAILED: "payment_failed",
  PAYMENT_SUCCEEDED: "payment_succeeded",
  TRIAL_STARTED: "trial_started",
  TRIAL_ENDED: "trial_ended",
} as const;

// ============================================
// UPGRADE PROMPT EVENTS
// ============================================
export const UPGRADE_PROMPT_EVENTS = {
  UPGRADE_PROMPT_SHOWN: "upgrade_prompt_shown",
  UPGRADE_PROMPT_CLICKED: "upgrade_prompt_clicked",
  UPGRADE_PROMPT_DISMISSED: "upgrade_prompt_dismissed",
  UPGRADE_LIMIT_BLOCKED: "upgrade_limit_blocked",
} as const;

// ============================================
// FEATURE USAGE EVENTS
// ============================================
export const FEATURE_EVENTS = {
  FEATURE_USED: "feature_used",
  FEATURE_GATE_HIT: "feature_gate_hit",
  SETTINGS_UPDATED: "settings_updated",
  DATA_EXPORTED: "data_exported",
} as const;

// ============================================
// DASHBOARD EVENTS
// ============================================
export const DASHBOARD_EVENTS = {
  VIEWED: "dashboard.viewed",
  METRICS_LOADED: "dashboard.metrics_loaded",
  QUICK_ACTION_CLICKED: "dashboard.quick_action_clicked",
  WIDGET_EXPANDED: "dashboard.widget_expanded",
  WIDGET_COLLAPSED: "dashboard.widget_collapsed",
} as const;

// ============================================
// SETTINGS EVENTS
// ============================================
export const SETTINGS_EVENTS = {
  PAGE_VIEWED: "settings.page_viewed",
  PROFILE_UPDATED: "settings.profile_updated",
  SECURITY_UPDATED: "settings.security_updated",
  NOTIFICATIONS_UPDATED: "settings.notifications_updated",
  APPEARANCE_UPDATED: "settings.appearance_updated",
  API_KEY_CREATED: "settings.api_key_created",
  API_KEY_REVOKED: "settings.api_key_revoked",
} as const;

// ============================================
// ADMIN EVENTS
// ============================================
export const ADMIN_EVENTS = {
  DASHBOARD_VIEWED: "admin.dashboard_viewed",
  USER_LIST_VIEWED: "admin.user_list_viewed",
  USER_DETAIL_VIEWED: "admin.user_detail_viewed",
  USER_ROLE_CHANGED: "admin.user_role_changed",
  USER_DISABLED: "admin.user_disabled",
  USER_ENABLED: "admin.user_enabled",
  IMPERSONATION_STARTED: "admin.impersonation_started",
  IMPERSONATION_ENDED: "admin.impersonation_ended",
  BULK_ACTION_PERFORMED: "admin.bulk_action_performed",
  COUPON_CREATED: "admin.coupon_created",
  COUPON_UPDATED: "admin.coupon_updated",
} as const;

// ============================================
// SEARCH & FILTER EVENTS
// ============================================
export const SEARCH_EVENTS = {
  SEARCH_PERFORMED: "search.performed",
  FILTER_APPLIED: "filter.applied",
  FILTER_CLEARED: "filter.cleared",
  SORT_CHANGED: "sort.changed",
  PAGINATION_CHANGED: "pagination.changed",
} as const;

// ============================================
// EXPORT EVENTS
// ============================================
export const EXPORT_EVENTS = {
  STARTED: "export.started",
  COMPLETED: "export.completed",
  FAILED: "export.failed",
  DOWNLOADED: "export.downloaded",
} as const;

// ============================================
// NAVIGATION EVENTS
// ============================================
export const NAVIGATION_EVENTS = {
  PAGE_VIEWED: "page.viewed",
  EXTERNAL_LINK_CLICKED: "navigation.external_link_clicked",
  CTA_CLICKED: "navigation.cta_clicked",
  HELP_ACCESSED: "navigation.help_accessed",
} as const;

// ============================================
// ONBOARDING EVENTS
// ============================================
export const ONBOARDING_EVENTS = {
  STARTED: "onboarding.started",
  STEP_COMPLETED: "onboarding.step_completed",
  COMPLETED: "onboarding.completed",
  SKIPPED: "onboarding.skipped",
  DISMISSED: "onboarding.dismissed",
} as const;

// ============================================
// ERROR EVENTS
// ============================================
export const ERROR_EVENTS = {
  FORM_VALIDATION_FAILED: "error.form_validation_failed",
  API_ERROR: "error.api_error",
  PAYMENT_ERROR: "error.payment_error",
} as const;

// Export all events
export const ANALYTICS_EVENTS = {
  ...AUTH_EVENTS,
  ...SUBSCRIPTION_EVENTS,
  ...UPGRADE_PROMPT_EVENTS,
  ...FEATURE_EVENTS,
  ...DASHBOARD_EVENTS,
  ...SETTINGS_EVENTS,
  ...ADMIN_EVENTS,
  ...SEARCH_EVENTS,
  ...EXPORT_EVENTS,
  ...NAVIGATION_EVENTS,
  ...ONBOARDING_EVENTS,
  ...ERROR_EVENTS,
} as const;

export type AnalyticsEvent =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];
