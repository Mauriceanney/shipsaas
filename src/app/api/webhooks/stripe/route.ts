import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe, processWebhookEvent } from "@/lib/stripe";

/**
 * POST /api/webhooks/stripe
 * Handles incoming Stripe webhook events
 *
 * IMPORTANT: This route must NOT use any body parsing middleware.
 * The raw body is required for signature verification.
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text();

    // Get Stripe signature header
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      console.error("Missing Stripe signature header");
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );
    }

    // Get webhook secret
    const webhookSecret = process.env["STRIPE_WEBHOOK_SECRET"];
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET is not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    // Verify signature and construct event
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Process the event
    const result = await processWebhookEvent(event);

    if (!result.success) {
      console.error(`Webhook processing failed: ${result.error}`);
      // Return 500 so Stripe will retry
      return NextResponse.json(
        { error: "Processing failed", eventId: result.eventId },
        { status: 500 }
      );
    }

    // Acknowledge receipt
    return NextResponse.json({
      received: true,
      eventId: result.eventId,
      eventType: result.eventType,
    });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

/**
 * Stripe webhooks only use POST
 */
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}
