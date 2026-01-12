/**
 * Stripe Utility Functions
 *
 * Helper functions for Stripe integration.
 */

import type { SubscriptionStatus, Plan } from "@/lib/schema";
import type { Invoice } from "./types";
import type Stripe from "stripe";

/**
 * Map Stripe subscription status to our status enum
 */
export function mapStripeStatus(
  stripeStatus: Stripe.Subscription.Status
): SubscriptionStatus {
  switch (stripeStatus) {
    case "active":
      return "ACTIVE";
    case "past_due":
      return "PAST_DUE";
    case "canceled":
      return "CANCELED";
    case "trialing":
      return "TRIALING";
    case "incomplete":
    case "incomplete_expired":
    case "unpaid":
    case "paused":
    default:
      return "INACTIVE";
  }
}

/**
 * Map our status enum to human-readable text
 */
export function getStatusLabel(status: SubscriptionStatus): string {
  switch (status) {
    case "ACTIVE":
      return "Active";
    case "PAST_DUE":
      return "Past Due";
    case "CANCELED":
      return "Canceled";
    case "TRIALING":
      return "Trial";
    case "INACTIVE":
    default:
      return "Inactive";
  }
}

/**
 * Get status color for UI
 */
export function getStatusColor(
  status: SubscriptionStatus
): "default" | "destructive" | "secondary" {
  switch (status) {
    case "ACTIVE":
    case "TRIALING":
      return "default";
    case "PAST_DUE":
      return "destructive";
    case "CANCELED":
    case "INACTIVE":
    default:
      return "secondary";
  }
}

/**
 * Map Stripe invoice to our invoice type
 */
export function mapStripeInvoice(invoice: Stripe.Invoice): Invoice {
  return {
    id: invoice.id,
    number: invoice.number,
    amountPaid: invoice.amount_paid,
    amountDue: invoice.amount_due,
    currency: invoice.currency,
    status: invoice.status,
    created: new Date(invoice.created * 1000),
    hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
    pdfUrl: invoice.invoice_pdf ?? null,
  };
}

/**
 * Format date for display
 */
export function formatDate(date: Date | null): string {
  if (!date) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/**
 * Format date for billing (shorter format)
 */
export function formatBillingDate(date: Date | null): string {
  if (!date) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/**
 * Calculate days until a date
 */
export function daysUntil(date: Date | null): number | null {
  if (!date) return null;
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Calculate days since a date
 */
export function daysSince(date: Date | null): number | null {
  if (!date) return null;
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Check if subscription is in grace period (can be recovered)
 */
export function isInGracePeriod(
  status: SubscriptionStatus,
  statusChangedAt: Date | null,
  gracePeriodDays: number = 10
): boolean {
  if (status !== "PAST_DUE") return false;
  if (!statusChangedAt) return true;

  const days = daysSince(statusChangedAt);
  return days !== null && days < gracePeriodDays;
}

/**
 * Get human-readable plan name
 */
export function getPlanLabel(plan: Plan): string {
  switch (plan) {
    case "FREE":
      return "Free";
    case "PLUS":
      return "Plus";
    case "PRO":
      return "Pro";
    default:
      return plan;
  }
}

/**
 * Check if a plan is higher than another
 */
export function isPlanHigher(plan: Plan, compareTo: Plan): boolean {
  const planOrder: Record<Plan, number> = {
    FREE: 0,
    PLUS: 1,
    PRO: 2,
  };
  return planOrder[plan] > planOrder[compareTo];
}

/**
 * Format currency amount
 */
export function formatCurrency(
  amount: number,
  currency = "usd"
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

/**
 * Get billing period description
 */
export function getBillingPeriodLabel(
  currentPeriodEnd: Date | null,
  cancelAtPeriodEnd: boolean
): string {
  if (!currentPeriodEnd) return "";

  const daysLeft = daysUntil(currentPeriodEnd);
  if (daysLeft === null) return "";

  if (cancelAtPeriodEnd) {
    return `Cancels in ${daysLeft} days`;
  }

  return `Renews in ${daysLeft} days`;
}

/**
 * Calculate discount amount from promotion code
 */
export function calculateDiscount(
  subtotal: number,
  discountType: "percentage" | "fixed",
  discountValue: number
): number {
  if (discountType === "percentage") {
    return Math.round(subtotal * (discountValue / 100));
  }
  return Math.min(discountValue, subtotal);
}
