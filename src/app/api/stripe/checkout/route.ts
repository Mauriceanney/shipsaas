import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CHECKOUT_URLS, getTrialDays, isValidPriceId, stripe } from "@/lib/stripe";
import { getPlanFromPriceId } from "@/lib/stripe/utils";

import type { CheckoutRequestBody, CheckoutResponse, StripeApiError } from "@/lib/stripe/types";
import type { NextRequest } from "next/server";

/**
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout session for subscription
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json<StripeApiError>(
        { error: "Authentication required", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = (await request.json()) as CheckoutRequestBody;
    const { priceId, successUrl, cancelUrl } = body;

    if (!priceId) {
      return NextResponse.json<StripeApiError>(
        { error: "Price ID is required", code: "INVALID_PRICE_ID" },
        { status: 400 }
      );
    }

    if (!isValidPriceId(priceId)) {
      return NextResponse.json<StripeApiError>(
        { error: "Invalid price ID", code: "INVALID_PRICE_ID" },
        { status: 400 }
      );
    }

    // Get or create Stripe customer ID
    const subscription = await db.subscription.findUnique({
      where: { userId: session.user.id },
    });

    // Determine if user is eligible for trial
    // Only new customers (no previous subscription) get trials
    const isEligibleForTrial = !subscription?.stripeSubscriptionId;

    // Get plan from price ID to determine trial period
    const plan = getPlanFromPriceId(priceId);
    const trialDays = isEligibleForTrial ? getTrialDays(plan) : 0;

    // Debug logging for trial eligibility
    console.log("[/api/stripe/checkout] Trial eligibility check:", {
      userId: session.user.id,
      priceId,
      plan,
      hasExistingSubscription: !!subscription,
      stripeSubscriptionId: subscription?.stripeSubscriptionId || null,
      isEligibleForTrial,
      trialDays,
      willAddTrial: trialDays > 0,
    });

    // Warn if plan detection failed
    if (plan === "FREE" && isEligibleForTrial) {
      console.warn("[/api/stripe/checkout] WARNING: Plan detected as FREE but user is eligible for trial. Check STRIPE_PRICE_ID_* env vars match the priceId:", priceId);
    }

    const baseUrl = process.env["NEXT_PUBLIC_APP_URL"] || "http://localhost:3000";

    // Build subscription data with trial period if eligible
    const subscriptionData: {
      metadata: { userId: string };
      trial_period_days?: number;
    } = {
      metadata: {
        userId: session.user.id,
      },
    };

    // Add trial period if eligible
    if (trialDays > 0) {
      subscriptionData.trial_period_days = trialDays;
    }

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
      // Use existing customer if available
      ...(subscription?.stripeCustomerId
        ? { customer: subscription.stripeCustomerId }
        : { customer_email: session.user.email ?? undefined }),
      // URLs
      success_url: `${baseUrl}${successUrl || CHECKOUT_URLS.success}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}${cancelUrl || CHECKOUT_URLS.cancel}`,
      // Metadata for webhook processing
      metadata: {
        userId: session.user.id,
      },
      // Subscription data with trial period
      subscription_data: subscriptionData,
      // Allow promotion codes
      allow_promotion_codes: true,
      // Collect billing address
      billing_address_collection: "auto",
    });

    if (!checkoutSession.url) {
      return NextResponse.json<StripeApiError>(
        { error: "Failed to create checkout session", code: "CHECKOUT_FAILED" },
        { status: 500 }
      );
    }

    return NextResponse.json<CheckoutResponse>({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    console.error("Checkout session error:", error);
    return NextResponse.json<StripeApiError>(
      { error: "Failed to create checkout session", code: "CHECKOUT_FAILED" },
      { status: 500 }
    );
  }
}
