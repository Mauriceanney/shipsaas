import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe, PORTAL_RETURN_URL } from "@/lib/stripe";
import type { PortalRequestBody, PortalResponse, StripeApiError } from "@/lib/stripe/types";

/**
 * POST /api/stripe/portal
 * Creates a Stripe Customer Portal session
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

    // Get user's subscription with Stripe customer ID
    const subscription = await db.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json<StripeApiError>(
        { error: "No active subscription found", code: "NO_SUBSCRIPTION" },
        { status: 400 }
      );
    }

    // Parse request body
    const body = (await request.json().catch(() => ({}))) as PortalRequestBody;
    const { returnUrl } = body;

    const baseUrl = process.env["NEXT_PUBLIC_APP_URL"] || "http://localhost:3000";

    // Create portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${baseUrl}${returnUrl || PORTAL_RETURN_URL}`,
    });

    return NextResponse.json<PortalResponse>({
      url: portalSession.url,
    });
  } catch (error) {
    console.error("Portal session error:", error);
    return NextResponse.json<StripeApiError>(
      { error: "Failed to create portal session", code: "PORTAL_FAILED" },
      { status: 500 }
    );
  }
}
