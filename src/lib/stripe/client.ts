/**
 * Stripe client singleton
 */

import Stripe from "stripe";

/**
 * Stripe API version
 * Using the latest stable version as of implementation
 */
const STRIPE_API_VERSION = "2025-02-24.acacia" as const;

/**
 * Create Stripe client instance
 * Uses singleton pattern to avoid multiple instances
 */
function createStripeClient(): Stripe {
  const secretKey = process.env["STRIPE_SECRET_KEY"];

  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is not defined in environment variables"
    );
  }

  return new Stripe(secretKey, {
    apiVersion: STRIPE_API_VERSION,
    typescript: true,
    appInfo: {
      name: "ShipSaaS",
      version: "1.0.0",
    },
  });
}

// Singleton instance
let stripeInstance: Stripe | null = null;

/**
 * Get Stripe client instance
 * Creates singleton on first call
 */
export function getStripeClient(): Stripe {
  if (!stripeInstance) {
    stripeInstance = createStripeClient();
  }
  return stripeInstance;
}

/**
 * Direct export for convenience
 * Use this in most cases
 */
export const stripe = getStripeClient();
