"use server";

/**
 * Retry Payment
 *
 * Retries a failed payment for a subscription.
 */

import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimiters, getClientIpFromHeaders } from "@/lib/rate-limit";
import { subscription } from "@/lib/schema";
import { stripe } from "@/lib/stripe/client";
import type { RetryPaymentResult } from "@/lib/stripe/types";

/**
 * Retry the latest failed payment for the current user's subscription
 */
export async function retryPayment(): Promise<RetryPaymentResult> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = session.user.id;

  // Rate limit check
  const ip = await getClientIpFromHeaders();
  const { success: rateLimitOk } = await rateLimiters.retryPayment(ip);

  if (!rateLimitOk) {
    return {
      success: false,
      error: "Too many retry attempts. Please try again later.",
    };
  }

  // Get subscription
  const [sub] = await db
    .select({
      stripeCustomerId: subscription.stripeCustomerId,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      status: subscription.status,
    })
    .from(subscription)
    .where(eq(subscription.userId, userId))
    .limit(1);

  if (!sub?.stripeCustomerId || !sub.stripeSubscriptionId) {
    return { success: false, error: "No active subscription found" };
  }

  if (sub.status !== "PAST_DUE") {
    return { success: false, error: "No failed payment to retry" };
  }

  try {
    // Get the latest unpaid invoice
    const invoices = await stripe.invoices.list({
      customer: sub.stripeCustomerId,
      subscription: sub.stripeSubscriptionId,
      status: "open",
      limit: 1,
    });

    const invoice = invoices.data[0];

    if (!invoice) {
      return { success: false, error: "No open invoice found" };
    }

    // Attempt to pay the invoice
    const paidInvoice = await stripe.invoices.pay(invoice.id);

    if (paidInvoice.status === "paid") {
      return { success: true, paid: true };
    }

    return {
      success: true,
      paid: false,
    };
  } catch (error) {
    console.error("[retryPayment] Error:", error);

    // Check for specific Stripe errors
    if (error instanceof stripe.errors.StripeCardError) {
      return {
        success: false,
        error: error.message ?? "Card was declined. Please update your payment method.",
      };
    }

    return { success: false, error: "Failed to retry payment" };
  }
}
