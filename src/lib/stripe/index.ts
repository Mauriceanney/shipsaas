/**
 * Stripe integration module
 *
 * This module provides:
 * - Stripe client singleton
 * - Plan and pricing configuration
 * - Utility functions for Stripe data
 * - Webhook handlers
 */

// Client
export { stripe, getStripeClient } from "./client";

// Configuration
export {
  STRIPE_PRICE_IDS,
  PLAN_FEATURES,
  PLAN_PRICING,
  PLAN_CONFIGS,
  CHECKOUT_URLS,
  PORTAL_RETURN_URL,
  getPlanConfig,
  getPriceId,
  getAllPriceIds,
  isValidPriceId,
  calculateYearlySavings,
} from "./config";

// Utilities
export {
  mapStripeStatus,
  getPlanFromPriceId,
  isPaidPlan,
  isActiveSubscription,
  extractPriceId,
  extractCustomerId,
  extractSubscriptionId,
  unixToDate,
  hasSubscriptionExpired,
  validateCheckoutMetadata,
  validateWebhookSignature,
} from "./utils";

// Webhook handlers
export {
  handleCheckoutCompleted,
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaid,
  handleInvoicePaymentFailed,
  processWebhookEvent,
} from "./webhooks";

// Types
export type * from "./types";
