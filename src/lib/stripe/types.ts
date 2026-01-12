/**
 * Stripe Type Definitions
 *
 * TypeScript types for Stripe integration.
 */

import type { Plan, SubscriptionStatus } from "@/lib/schema";

/**
 * Billing cycle options
 */
export type BillingCycle = "monthly" | "yearly";

/**
 * Plan configuration with pricing
 */
export interface PlanConfig {
  plan: Plan;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  monthlyPriceId: string | null;
  yearlyPriceId: string | null;
  features: string[];
  isPopular?: boolean;
}

/**
 * Checkout session input
 */
export interface CreateCheckoutInput {
  plan: Exclude<Plan, "FREE">;
  billingCycle: BillingCycle;
  successUrl?: string;
  cancelUrl?: string;
  promotionCode?: string;
}

/**
 * Checkout session result
 */
export type CheckoutResult =
  | { success: true; url: string }
  | { success: false; error: string };

/**
 * Customer portal result
 */
export type PortalResult =
  | { success: true; url: string }
  | { success: false; error: string };

/**
 * Invoice data
 */
export interface Invoice {
  id: string;
  number: string | null;
  amountPaid: number;
  amountDue: number;
  currency: string;
  status: string | null;
  created: Date;
  hostedInvoiceUrl: string | null;
  pdfUrl: string | null;
}

/**
 * Invoice list result
 */
export type InvoicesResult =
  | { success: true; invoices: Invoice[] }
  | { success: false; error: string };

/**
 * Subscription data for UI
 */
export interface SubscriptionData {
  id: string;
  plan: Plan;
  status: SubscriptionStatus;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  trialEnd: Date | null;
}

/**
 * Subscription status result
 */
export type SubscriptionResult =
  | { success: true; subscription: SubscriptionData | null }
  | { success: false; error: string };

/**
 * Retry payment result
 */
export type RetryPaymentResult =
  | { success: true; paid: boolean }
  | { success: false; error: string };

/**
 * Promotion code validation result
 */
export type ValidatePromoResult =
  | {
      success: true;
      valid: true;
      discount: {
        type: "percentage" | "fixed";
        value: number;
        currency?: string;
      };
    }
  | { success: true; valid: false; reason: string }
  | { success: false; error: string };

/**
 * Dunning status for a subscription
 */
export interface DunningStatus {
  isInDunning: boolean;
  daysSinceFailure: number;
  failedAt: Date | null;
  lastEmailType: string | null;
  lastEmailSentAt: Date | null;
}

/**
 * Dunning status result
 */
export type DunningStatusResult =
  | { success: true; status: DunningStatus }
  | { success: false; error: string };

/**
 * Usage data for metering
 */
export interface UsageData {
  apiCalls: number;
  projectsCount: number;
  storageBytes: bigint;
  teamMembers: number;
  period: string;
}

/**
 * Plan limits for usage comparison
 */
export interface PlanLimits {
  apiCalls: number;
  projects: number;
  storageGB: number;
  teamMembers: number;
}

/**
 * Usage with limits for UI
 */
export interface UsageWithLimits {
  usage: UsageData;
  limits: PlanLimits;
}
