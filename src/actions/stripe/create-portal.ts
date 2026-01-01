"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { redirectTo } from "@/lib/navigation";
import { PORTAL_RETURN_URL, stripe } from "@/lib/stripe";

import type { Result } from "@/types";
export interface CreatePortalInput {
  returnUrl?: string;
}

const baseUrl = process.env["NEXT_PUBLIC_APP_URL"] || "http://localhost:3000";

/**
 * Server action to create a Stripe Customer Portal session
 */
export async function createPortalAction(
  input?: CreatePortalInput
): Promise<Result<{ url: string }, string>> {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Authentication required" };
    }

    // Get user's subscription
    const subscription = await db.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (!subscription?.stripeCustomerId) {
      return { success: false, error: "No active subscription found" };
    }

    // Create portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${baseUrl}${input?.returnUrl || PORTAL_RETURN_URL}`,
    });

    return { success: true, data: { url: portalSession.url } };
  } catch (error) {
    logger.error(
      { err: error, userId: session?.user?.id },
      "Failed to create Stripe portal session"
    );
    return { success: false, error: "Failed to create portal session" };
  }
}

/**
 * Server action that redirects to Stripe Customer Portal
 */
export async function redirectToPortal(returnUrl?: string): Promise<never> {
  const result = await createPortalAction({ returnUrl });

  if (result.success) {
    // External URL redirect - Stripe portal URL
    return redirectTo(result.data.url);
  }

  // Redirect to billing with error
  const errorUrl = `/settings/billing?error=${encodeURIComponent(result.error)}`;
  return redirectTo(errorUrl);
}
