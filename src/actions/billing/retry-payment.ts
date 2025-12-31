"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

import type { Result } from "@/types";

/**
 * Server action to retry payment for a PAST_DUE subscription
 * Finds the latest unpaid invoice and attempts to pay it
 */
export async function retryPaymentAction(): Promise<Result<void, string>> {
  try {
    // 1. Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // 2. Find user's PAST_DUE subscription
    const subscription = await db.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: "PAST_DUE",
      },
    });

    if (!subscription) {
      return { success: false, error: "No past due subscription found" };
    }

    if (!subscription.stripeSubscriptionId) {
      return { success: false, error: "No Stripe subscription found" };
    }

    // 3. Get the latest unpaid invoice from Stripe
    const invoices = await stripe.invoices.list({
      subscription: subscription.stripeSubscriptionId,
      status: "open",
      limit: 1,
    });

    const invoice = invoices.data[0];
    if (!invoice) {
      return { success: false, error: "No open invoice found" };
    }

    // 4. Retry payment
    try {
      await stripe.invoices.pay(invoice.id);
      return { success: true, data: undefined };
    } catch (error) {
      // Handle Stripe payment errors gracefully
      if (error instanceof Error) {
        // Don't expose internal Stripe errors
        return {
          success: false,
          error: "Payment failed. Please update your payment method.",
        };
      }
      return { success: false, error: "Payment failed" };
    }
  } catch (error) {
    console.error("[retryPaymentAction]", error);
    return { success: false, error: "Failed to retry payment" };
  }
}
