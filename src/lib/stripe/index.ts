/**
 * Stripe Integration
 *
 * Exports all Stripe-related functionality.
 */

// Stripe client
export { stripe } from "./client";

// Types
export type {
  BillingCycle,
  PlanConfig,
  CreateCheckoutInput,
  CheckoutResult,
  PortalResult,
  Invoice,
  InvoicesResult,
  SubscriptionData,
  SubscriptionResult,
  RetryPaymentResult,
  ValidatePromoResult,
  DunningStatus,
  DunningStatusResult,
  UsageData,
  PlanLimits,
  UsageWithLimits,
} from "./types";

// Configuration
export {
  PLAN_CONFIGS,
  FREE_PLAN_CONFIG,
  ALL_PLANS,
  PLAN_LIMITS,
  getPriceId,
  getPlanFromPriceId,
  getBillingCycleFromPriceId,
  formatPrice,
  DUNNING_SCHEDULE,
  SUSPENSION_GRACE_PERIOD_DAYS,
  TRIAL_PERIOD_DAYS,
} from "./config";

// Utilities
export {
  mapStripeStatus,
  getStatusLabel,
  getStatusColor,
  mapStripeInvoice,
  formatDate,
  formatBillingDate,
  daysUntil,
  daysSince,
  isInGracePeriod,
  getPlanLabel,
  isPlanHigher,
  formatCurrency,
  getBillingPeriodLabel,
  calculateDiscount,
} from "./utils";

// Webhook handlers
export {
  isEventProcessed,
  markEventProcessed,
  handleCheckoutCompleted,
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaid,
  handleInvoicePaymentFailed,
  handleChargeRefunded,
} from "./webhooks";
