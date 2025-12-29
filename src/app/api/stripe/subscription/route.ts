import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isActiveSubscription, stripe } from "@/lib/stripe";

import type { StripeApiError, SubscriptionInfo, SubscriptionStatusResponse } from "@/lib/stripe/types";

/**
 * GET /api/stripe/subscription
 * Gets current user's subscription status
 */
export async function GET() {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json<StripeApiError>(
        { error: "Authentication required", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    // Get user's subscription
    const subscription = await db.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (!subscription) {
      return NextResponse.json<SubscriptionStatusResponse>({
        subscription: null,
      });
    }

    // Fetch cancel_at_period_end from Stripe if active subscription
    let cancelAtPeriodEnd = false;
    if (
      subscription.stripeSubscriptionId &&
      isActiveSubscription(subscription.status)
    ) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(
          subscription.stripeSubscriptionId
        );
        cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end;
      } catch {
        // Subscription might not exist in Stripe anymore
        console.warn("Failed to fetch Stripe subscription:", subscription.stripeSubscriptionId);
      }
    }

    const subscriptionInfo: SubscriptionInfo = {
      status: subscription.status,
      plan: subscription.plan,
      currentPeriodEnd: subscription.stripeCurrentPeriodEnd,
      cancelAtPeriodEnd,
      stripeCustomerId: subscription.stripeCustomerId,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
    };

    return NextResponse.json<SubscriptionStatusResponse>({
      subscription: subscriptionInfo,
    });
  } catch (error) {
    console.error("Subscription status error:", error);
    return NextResponse.json<StripeApiError>(
      { error: "Failed to get subscription status", code: "SUBSCRIPTION_ERROR" },
      { status: 500 }
    );
  }
}
