/**
 * Stripe Configuration
 *
 * Plan configurations and pricing information.
 */

import type { Plan } from "@/lib/schema";
import type { PlanConfig, PlanLimits, BillingCycle } from "./types";

/**
 * Plan configurations with pricing
 * Prices are in cents (USD)
 */
export const PLAN_CONFIGS: Record<Exclude<Plan, "FREE">, PlanConfig> = {
  PLUS: {
    plan: "PLUS",
    name: "Plus",
    description: "For growing teams and professionals",
    monthlyPrice: 1900, // $19.00
    yearlyPrice: 19000, // $190.00 (2 months free)
    monthlyPriceId: process.env.STRIPE_PRICE_ID_PLUS_MONTHLY ?? null,
    yearlyPriceId: process.env.STRIPE_PRICE_ID_PLUS_YEARLY ?? null,
    features: [
      "10,000 API calls/month",
      "10 projects",
      "10 GB storage",
      "5 team members",
      "Email support",
      "Basic analytics",
    ],
  },
  PRO: {
    plan: "PRO",
    name: "Pro",
    description: "For enterprises and power users",
    monthlyPrice: 4900, // $49.00
    yearlyPrice: 49000, // $490.00 (2 months free)
    monthlyPriceId: process.env.STRIPE_PRICE_ID_PRO_MONTHLY ?? null,
    yearlyPriceId: process.env.STRIPE_PRICE_ID_PRO_YEARLY ?? null,
    features: [
      "Unlimited API calls",
      "Unlimited projects",
      "100 GB storage",
      "Unlimited team members",
      "Priority support",
      "Advanced analytics",
      "Custom integrations",
      "SLA guarantee",
    ],
    isPopular: true,
  },
};

/**
 * Free plan configuration (not in Stripe, but for UI)
 */
export const FREE_PLAN_CONFIG: PlanConfig = {
  plan: "FREE",
  name: "Free",
  description: "For individuals getting started",
  monthlyPrice: 0,
  yearlyPrice: 0,
  monthlyPriceId: null,
  yearlyPriceId: null,
  features: [
    "1,000 API calls/month",
    "3 projects",
    "1 GB storage",
    "1 team member",
    "Community support",
  ],
};

/**
 * All plan configurations including free
 */
export const ALL_PLANS: PlanConfig[] = [
  FREE_PLAN_CONFIG,
  PLAN_CONFIGS.PLUS,
  PLAN_CONFIGS.PRO,
];

/**
 * Plan limits for usage tracking
 */
export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  FREE: {
    apiCalls: 1000,
    projects: 3,
    storageGB: 1,
    teamMembers: 1,
  },
  PLUS: {
    apiCalls: 10000,
    projects: 10,
    storageGB: 10,
    teamMembers: 5,
  },
  PRO: {
    apiCalls: Infinity,
    projects: Infinity,
    storageGB: 100,
    teamMembers: Infinity,
  },
};

/**
 * Get price ID for a plan and billing cycle
 */
export function getPriceId(
  plan: Exclude<Plan, "FREE">,
  billingCycle: BillingCycle
): string | null {
  const config = PLAN_CONFIGS[plan];
  return billingCycle === "monthly"
    ? config.monthlyPriceId
    : config.yearlyPriceId;
}

/**
 * Get plan from Stripe price ID
 */
export function getPlanFromPriceId(priceId: string): Plan | null {
  for (const [plan, config] of Object.entries(PLAN_CONFIGS)) {
    if (config.monthlyPriceId === priceId || config.yearlyPriceId === priceId) {
      return plan as Plan;
    }
  }
  return null;
}

/**
 * Get billing cycle from price ID
 */
export function getBillingCycleFromPriceId(
  priceId: string
): BillingCycle | null {
  for (const config of Object.values(PLAN_CONFIGS)) {
    if (config.monthlyPriceId === priceId) return "monthly";
    if (config.yearlyPriceId === priceId) return "yearly";
  }
  return null;
}

/**
 * Format price for display
 */
export function formatPrice(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

/**
 * Dunning schedule configuration
 * Days after payment failure to send each email
 */
export const DUNNING_SCHEDULE = {
  DAY_0_PAYMENT_FAILED: 0,
  DAY_3_REMINDER: 3,
  DAY_7_FINAL_WARNING: 7,
  DAY_10_SUSPENDED: 10,
} as const;

/**
 * Number of days to wait before suspending subscription
 */
export const SUSPENSION_GRACE_PERIOD_DAYS = 10;

/**
 * Trial period in days (if applicable)
 */
export const TRIAL_PERIOD_DAYS = 14;
