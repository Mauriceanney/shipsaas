/**
 * Stripe utility functions
 */

import { STRIPE_PRICE_IDS } from "./config";

import type { Plan, SubscriptionStatus } from "@prisma/client";
import type Stripe from "stripe";

// ============================================
// STATUS MAPPING
// ============================================

/**
 * Map Stripe subscription status to app subscription status
 */
export function mapStripeStatus(
  stripeStatus: Stripe.Subscription.Status
): SubscriptionStatus {
  const statusMap: Record<Stripe.Subscription.Status, SubscriptionStatus> = {
    active: "ACTIVE",
    trialing: "TRIALING",
    past_due: "PAST_DUE",
    canceled: "CANCELED",
    unpaid: "INACTIVE",
    incomplete: "INACTIVE",
    incomplete_expired: "INACTIVE",
    paused: "INACTIVE",
  };

  return statusMap[stripeStatus] ?? "INACTIVE";
}

// ============================================
// PLAN DETECTION
// ============================================

/**
 * Determine plan from Stripe price ID
 */
export function getPlanFromPriceId(priceId: string): Plan {
  // Check Plus prices
  if (
    priceId === STRIPE_PRICE_IDS.PLUS.monthly ||
    priceId === STRIPE_PRICE_IDS.PLUS.yearly
  ) {
    return "PLUS";
  }

  // Check Pro prices
  if (
    priceId === STRIPE_PRICE_IDS.PRO.monthly ||
    priceId === STRIPE_PRICE_IDS.PRO.yearly
  ) {
    return "PRO";
  }

  // Default to FREE for unknown prices
  return "FREE";
}

/**
 * Check if plan is paid
 */
export function isPaidPlan(plan: Plan): boolean {
  return plan !== "FREE";
}

/**
 * Check if subscription is active or trialing
 */
export function isActiveSubscription(status: SubscriptionStatus): boolean {
  return status === "ACTIVE" || status === "TRIALING";
}

// ============================================
// STRIPE DATA EXTRACTION
// ============================================

/**
 * Extract price ID from Stripe subscription
 */
export function extractPriceId(subscription: Stripe.Subscription): string | null {
  const item = subscription.items.data[0];
  return item?.price.id ?? null;
}

/**
 * Extract customer ID from various Stripe objects
 */
export function extractCustomerId(
  obj: { customer: string | Stripe.Customer | Stripe.DeletedCustomer | null }
): string | null {
  if (!obj.customer) return null;

  if (typeof obj.customer === "string") {
    return obj.customer;
  }

  return obj.customer.id;
}

/**
 * Extract subscription ID from checkout session
 */
export function extractSubscriptionId(
  session: Stripe.Checkout.Session
): string | null {
  if (!session.subscription) return null;

  if (typeof session.subscription === "string") {
    return session.subscription;
  }

  return session.subscription.id;
}

// ============================================
// DATE UTILITIES
// ============================================

/**
 * Convert Unix timestamp to Date
 */
export function unixToDate(timestamp: number): Date {
  return new Date(timestamp * 1000);
}

/**
 * Check if subscription period has ended
 */
export function hasSubscriptionExpired(periodEnd: Date | null): boolean {
  if (!periodEnd) return true;
  return periodEnd < new Date();
}

// ============================================
// VALIDATION
// ============================================

/**
 * Validate checkout metadata
 */
export function validateCheckoutMetadata(
  metadata: Stripe.Metadata | null
): { userId: string } | null {
  if (!metadata?.["userId"]) {
    return null;
  }
  return { userId: metadata["userId"] };
}

/**
 * Validate webhook signature (wrapper for error handling)
 */
export function validateWebhookSignature(
  body: string,
  signature: string,
  secret: string,
  stripe: Stripe
): Stripe.Event | null {
  try {
    return stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    return null;
  }
}
