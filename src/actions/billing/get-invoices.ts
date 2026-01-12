"use server";

/**
 * Get Invoices
 *
 * Retrieves invoice history for the current user.
 */

import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { subscription } from "@/lib/schema";
import { stripe } from "@/lib/stripe/client";
import type { InvoicesResult } from "@/lib/stripe/types";
import { mapStripeInvoice } from "@/lib/stripe/utils";

/**
 * Get invoice history for the current user
 */
export async function getInvoices(limit: number = 10): Promise<InvoicesResult> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = session.user.id;

  // Get subscription with Stripe customer ID
  const [sub] = await db
    .select({
      stripeCustomerId: subscription.stripeCustomerId,
    })
    .from(subscription)
    .where(eq(subscription.userId, userId))
    .limit(1);

  if (!sub?.stripeCustomerId) {
    return { success: true, invoices: [] };
  }

  try {
    // Fetch invoices from Stripe
    const stripeInvoices = await stripe.invoices.list({
      customer: sub.stripeCustomerId,
      limit,
    });

    const invoices = stripeInvoices.data.map(mapStripeInvoice);

    return { success: true, invoices };
  } catch (error) {
    console.error("[getInvoices] Error:", error);
    return { success: false, error: "Failed to fetch invoices" };
  }
}
