"use server";

/**
 * Create Checkout Session
 *
 * Creates a Stripe checkout session for subscription purchases.
 */

import { headers } from "next/headers";
import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { subscription, promotionCode } from "@/lib/schema";
import { stripe } from "@/lib/stripe/client";
import { getPriceId, PLAN_CONFIGS } from "@/lib/stripe/config";
import type { CreateCheckoutInput, CheckoutResult } from "@/lib/stripe/types";
import type Stripe from "stripe";

/**
 * Create a Stripe checkout session for a subscription
 */
export async function createCheckoutSession(
  input: CreateCheckoutInput
): Promise<CheckoutResult> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = session.user.id;
  const userEmail = session.user.email;

  // Validate plan
  if (!["PLUS", "PRO"].includes(input.plan)) {
    return { success: false, error: "Invalid plan" };
  }

  // Get price ID
  const priceId = getPriceId(input.plan, input.billingCycle);
  if (!priceId) {
    return {
      success: false,
      error: "Price not configured for this plan",
    };
  }

  // Get or create subscription record
  let [sub] = await db
    .select({
      id: subscription.id,
      stripeCustomerId: subscription.stripeCustomerId,
    })
    .from(subscription)
    .where(eq(subscription.userId, userId))
    .limit(1);

  if (!sub) {
    // Create subscription record
    const newSubId = createId();
    await db.insert(subscription).values({
      id: newSubId,
      userId,
      plan: "FREE",
      status: "INACTIVE",
    });
    sub = { id: newSubId, stripeCustomerId: null };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const successUrl = input.successUrl ?? `${appUrl}/settings/billing?success=true`;
  const cancelUrl = input.cancelUrl ?? `${appUrl}/pricing?canceled=true`;

  try {
    // Build checkout session params
    const checkoutParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId,
      ...(sub.stripeCustomerId
        ? { customer: sub.stripeCustomerId }
        : { customer_email: userEmail }),
      metadata: {
        userId,
        plan: input.plan,
        billingCycle: input.billingCycle,
      },
      subscription_data: {
        metadata: {
          userId,
          plan: input.plan,
        },
      },
      allow_promotion_codes: true,
    };

    // Add promotion code if provided
    if (input.promotionCode) {
      const [promo] = await db
        .select({
          stripePromotionId: promotionCode.stripePromotionId,
          active: promotionCode.active,
        })
        .from(promotionCode)
        .where(eq(promotionCode.code, input.promotionCode.toUpperCase()))
        .limit(1);

      if (promo?.active && checkoutParams) {
        (checkoutParams as { discounts?: Array<{ promotion_code: string }> }).discounts = [
          { promotion_code: promo.stripePromotionId },
        ];
        (checkoutParams as { allow_promotion_codes?: boolean }).allow_promotion_codes = false;
      }
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create(checkoutParams!);

    if (!checkoutSession.url) {
      return { success: false, error: "Failed to create checkout session" };
    }

    return { success: true, url: checkoutSession.url };
  } catch (error) {
    console.error("[createCheckoutSession] Error:", error);
    return { success: false, error: "Failed to create checkout session" };
  }
}

/**
 * Get plan details for pricing display
 */
export async function getPlanDetails() {
  return {
    success: true,
    plans: PLAN_CONFIGS,
  };
}
