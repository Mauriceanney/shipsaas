"use server";

import { redirect } from "next/navigation";

import { trackServerEvent, SUBSCRIPTION_EVENTS } from "@/lib/analytics";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CHECKOUT_URLS, isValidPriceId, stripe } from "@/lib/stripe";

import type { Result } from "@/types";

export interface CreateCheckoutInput {
  priceId: string;
  successUrl?: string;
  cancelUrl?: string;
}

const baseUrl = process.env["NEXT_PUBLIC_APP_URL"] || "http://localhost:3000";

/**
 * Server action to create a Stripe Checkout session and redirect
 */
export async function createCheckoutAction(
  input: CreateCheckoutInput
): Promise<Result<{ url: string }, string>> {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Authentication required" };
    }

    const { priceId, successUrl, cancelUrl } = input;

    // Validate price ID
    if (!priceId || !isValidPriceId(priceId)) {
      return { success: false, error: "Invalid price ID" };
    }

    // Get existing subscription for customer ID
    const subscription = await db.subscription.findUnique({
      where: { userId: session.user.id },
    });

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      ...(subscription?.stripeCustomerId
        ? { customer: subscription.stripeCustomerId }
        : { customer_email: session.user.email ?? undefined }),
      success_url: `${baseUrl}${successUrl || CHECKOUT_URLS.success}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}${cancelUrl || CHECKOUT_URLS.cancel}`,
      metadata: {
        userId: session.user.id,
      },
      subscription_data: {
        metadata: {
          userId: session.user.id,
        },
      },
      allow_promotion_codes: true,
    });

    if (!checkoutSession.url) {
      return { success: false, error: "Failed to create checkout session" };
    }

    // Track checkout started event
    trackServerEvent(session.user.id, SUBSCRIPTION_EVENTS.CHECKOUT_STARTED, {
      priceId,
    });

    return { success: true, data: { url: checkoutSession.url } };
  } catch (error) {
    console.error("Create checkout error:", error);
    return { success: false, error: "Failed to create checkout session" };
  }
}

/**
 * Server action that redirects to Stripe Checkout
 * Returns the checkout URL, external redirect is handled by the caller
 */
export async function redirectToCheckout(priceId: string): Promise<never> {
  const result = await createCheckoutAction({ priceId });

  if (result.success) {
    // External URL redirect - Stripe checkout URL
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return redirect(result.data.url as any);
  }

  // Redirect to pricing with error
  const errorUrl = `/pricing?error=${encodeURIComponent(result.error)}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return redirect(errorUrl as any);
}
