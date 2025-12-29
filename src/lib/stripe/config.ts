/**
 * Stripe plans and pricing configuration
 */

import type { BillingInterval, PlanConfig, PlanPrices } from "./types";
import type { Plan } from "@prisma/client";

// ============================================
// ENVIRONMENT VALIDATION
// ============================================

/**
 * Get and validate Stripe price IDs from environment
 */
function getStripePriceIds(): Record<Exclude<Plan, "FREE">, PlanPrices> {
  const priceIds = {
    PRO: {
      monthly: process.env["STRIPE_PRICE_ID_PRO_MONTHLY"] ?? "",
      yearly: process.env["STRIPE_PRICE_ID_PRO_YEARLY"] ?? "",
    },
    ENTERPRISE: {
      monthly: process.env["STRIPE_PRICE_ID_ENTERPRISE_MONTHLY"] ?? "",
      yearly: process.env["STRIPE_PRICE_ID_ENTERPRISE_YEARLY"] ?? "",
    },
  };

  // Validate in production
  if (process.env.NODE_ENV === "production") {
    const missing: string[] = [];

    if (!priceIds.PRO.monthly) missing.push("STRIPE_PRICE_ID_PRO_MONTHLY");
    if (!priceIds.PRO.yearly) missing.push("STRIPE_PRICE_ID_PRO_YEARLY");
    if (!priceIds.ENTERPRISE.monthly) missing.push("STRIPE_PRICE_ID_ENTERPRISE_MONTHLY");
    if (!priceIds.ENTERPRISE.yearly) missing.push("STRIPE_PRICE_ID_ENTERPRISE_YEARLY");

    if (missing.length > 0) {
      throw new Error(`Missing Stripe price IDs: ${missing.join(", ")}`);
    }
  }

  return priceIds;
}

/**
 * Stripe price IDs from environment
 */
export const STRIPE_PRICE_IDS = getStripePriceIds();

// ============================================
// PLAN CONFIGURATIONS
// ============================================

/**
 * Plan feature lists
 */
export const PLAN_FEATURES: Record<Plan, string[]> = {
  FREE: [
    "Basic features",
    "Community support",
    "1 project",
    "5GB storage",
  ],
  PRO: [
    "All Free features",
    "Priority email support",
    "Unlimited projects",
    "50GB storage",
    "Advanced analytics",
    "API access",
    "Custom integrations",
  ],
  ENTERPRISE: [
    "All Pro features",
    "24/7 dedicated support",
    "Unlimited storage",
    "Custom SLA",
    "Audit logs",
    "SSO (SAML)",
    "Custom contracts",
    "Dedicated account manager",
  ],
};

/**
 * Plan pricing (in dollars)
 */
export const PLAN_PRICING: Record<Exclude<Plan, "FREE">, { monthly: number; yearly: number }> = {
  PRO: {
    monthly: 19,
    yearly: 190, // ~17% savings
  },
  ENTERPRISE: {
    monthly: 99,
    yearly: 990, // ~17% savings
  },
};

/**
 * Full plan configurations
 */
export const PLAN_CONFIGS: PlanConfig[] = [
  {
    id: "FREE",
    name: "Free",
    description: "For individuals getting started",
    prices: { monthly: "", yearly: "" },
    features: PLAN_FEATURES.FREE,
  },
  {
    id: "PRO",
    name: "Pro",
    description: "For professionals and small teams",
    prices: STRIPE_PRICE_IDS.PRO,
    features: PLAN_FEATURES.PRO,
    highlighted: true,
    badge: "Popular",
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    description: "For large organizations",
    prices: STRIPE_PRICE_IDS.ENTERPRISE,
    features: PLAN_FEATURES.ENTERPRISE,
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get plan config by ID
 */
export function getPlanConfig(planId: Plan): PlanConfig | undefined {
  return PLAN_CONFIGS.find((p) => p.id === planId);
}

/**
 * Get price ID for a plan and interval
 */
export function getPriceId(plan: Plan, interval: BillingInterval): string | null {
  if (plan === "FREE") return null;
  return STRIPE_PRICE_IDS[plan][interval];
}

/**
 * Get all valid price IDs
 */
export function getAllPriceIds(): string[] {
  return [
    STRIPE_PRICE_IDS.PRO.monthly,
    STRIPE_PRICE_IDS.PRO.yearly,
    STRIPE_PRICE_IDS.ENTERPRISE.monthly,
    STRIPE_PRICE_IDS.ENTERPRISE.yearly,
  ].filter(Boolean);
}

/**
 * Check if a price ID is valid
 */
export function isValidPriceId(priceId: string): boolean {
  return getAllPriceIds().includes(priceId);
}

/**
 * Calculate yearly savings percentage
 */
export function calculateYearlySavings(monthly: number, yearly: number): number {
  const monthlyTotal = monthly * 12;
  const savings = ((monthlyTotal - yearly) / monthlyTotal) * 100;
  return Math.round(savings);
}

// ============================================
// URL CONFIGURATIONS
// ============================================

/**
 * Default URLs for checkout flow
 */
export const CHECKOUT_URLS = {
  success: "/checkout/success",
  cancel: "/pricing",
} as const;

/**
 * Default URL for portal return
 */
export const PORTAL_RETURN_URL = "/settings/billing";
