/**
 * Stripe type definitions
 */

import type { Plan, SubscriptionStatus } from "@prisma/client";
import type Stripe from "stripe";

// ============================================
// PLAN & PRICING TYPES
// ============================================

/**
 * Billing interval for subscriptions
 */
export type BillingInterval = "monthly" | "yearly";

/**
 * Stripe price IDs for a plan
 */
export interface PlanPrices {
  monthly: string;
  yearly: string;
}

/**
 * Plan configuration with pricing and features
 */
export interface PlanConfig {
  id: Plan;
  name: string;
  description: string;
  prices: PlanPrices;
  features: string[];
  highlighted?: boolean;
  badge?: string;
}

/**
 * Pricing display configuration
 */
export interface PricingDisplay {
  monthly: number;
  yearly: number;
  yearlySavingsPercent: number;
}

// ============================================
// CHECKOUT TYPES
// ============================================

/**
 * Input for creating a checkout session
 */
export interface CreateCheckoutInput {
  priceId: string;
  userId: string;
  userEmail: string;
  successUrl?: string;
  cancelUrl?: string;
}

/**
 * Result of checkout session creation
 */
export interface CreateCheckoutResult {
  sessionId: string;
  url: string;
}

/**
 * Checkout session metadata stored in Stripe
 */
export interface CheckoutMetadata {
  userId: string;
}

// ============================================
// PORTAL TYPES
// ============================================

/**
 * Input for creating a portal session
 */
export interface CreatePortalInput {
  customerId: string;
  returnUrl?: string;
}

/**
 * Result of portal session creation
 */
export interface CreatePortalResult {
  url: string;
}

// ============================================
// SUBSCRIPTION TYPES
// ============================================

/**
 * Subscription data for UI display
 */
export interface SubscriptionInfo {
  status: SubscriptionStatus;
  plan: Plan;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

/**
 * Stripe subscription status to app status mapping
 */
export type StripeSubscriptionStatus = Stripe.Subscription.Status;

// ============================================
// WEBHOOK TYPES
// ============================================

/**
 * Supported webhook event types
 */
export type SupportedWebhookEvent =
  | "checkout.session.completed"
  | "customer.subscription.created"
  | "customer.subscription.updated"
  | "customer.subscription.deleted"
  | "invoice.paid"
  | "invoice.payment_failed";

/**
 * Webhook handler function signature
 */
export type WebhookHandler<T = unknown> = (
  event: Stripe.Event,
  data: T
) => Promise<void>;

/**
 * Webhook processing result
 */
export interface WebhookResult {
  success: boolean;
  eventId: string;
  eventType: string;
  error?: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

/**
 * Checkout API request body
 */
export interface CheckoutRequestBody {
  priceId: string;
  successUrl?: string;
  cancelUrl?: string;
}

/**
 * Checkout API response
 */
export interface CheckoutResponse {
  url: string;
  sessionId: string;
}

/**
 * Portal API request body
 */
export interface PortalRequestBody {
  returnUrl?: string;
}

/**
 * Portal API response
 */
export interface PortalResponse {
  url: string;
}

/**
 * Subscription status API response
 */
export interface SubscriptionStatusResponse {
  subscription: SubscriptionInfo | null;
}

/**
 * API error response
 */
export interface StripeApiError {
  error: string;
  code?: string;
}
