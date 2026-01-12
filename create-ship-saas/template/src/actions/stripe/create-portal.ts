"use server";

/**
 * Create Customer Portal Session
 *
 * Creates a Stripe customer portal session for subscription management.
 */

import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { subscription } from "@/lib/schema";
import { stripe } from "@/lib/stripe/client";
import type { PortalResult } from "@/lib/stripe/types";

/**
 * Create a Stripe customer portal session
 */
export async function createPortalSession(): Promise<PortalResult> {
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
    return {
      success: false,
      error: "No billing account found. Please subscribe to a plan first.",
    };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const returnUrl = `${appUrl}/settings/billing`;

  try {
    // Create Stripe customer portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: returnUrl,
    });

    return { success: true, url: portalSession.url };
  } catch (error) {
    console.error("[createPortalSession] Error:", error);
    return { success: false, error: "Failed to create billing portal session" };
  }
}
