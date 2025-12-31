import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { processWebhookEvent, stripe } from "@/lib/stripe";

import type { NextRequest } from "next/server";

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
      console.error("[Webhook] Signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    console.log(`[Webhook] Received event: ${event.type} (${event.id})`);

    // Idempotency check: Check if this event has already been processed
    const existingEvent = await db.webhookEvent.findUnique({
      where: { stripeEventId: event.id },
    });

    if (existingEvent?.processed) {
      console.log(`[Webhook] Event already processed: ${event.id}`);
      return NextResponse.json({
        received: true,
        alreadyProcessed: true,
        eventId: event.id,
        eventType: event.type,
      });
    }

    // Create webhook event record with processed=false
    // Handle race condition with unique constraint
    let webhookEventId: string;
    try {
      if (!existingEvent) {
        const webhookEvent = await db.webhookEvent.create({
          data: {
            stripeEventId: event.id,
            eventType: event.type,
            apiVersion: event.api_version ?? null,
            processed: false,
          },
        });
        webhookEventId = webhookEvent.id;
        console.log(`[Webhook] Created event record: ${webhookEventId}`);
      } else {
        webhookEventId = existingEvent.id;
        console.log(`[Webhook] Using existing event record: ${webhookEventId} (retry)`);
      }
    } catch (createError) {
      // Handle race condition - another instance may have created it
      const isPrismaUniqueConstraintError =
        createError instanceof Error &&
        "code" in createError &&
        createError.code === "P2002";

      if (isPrismaUniqueConstraintError) {
        console.log(`[Webhook] Race condition detected, fetching existing event: ${event.id}`);
        const existingEventRetry = await db.webhookEvent.findUnique({
          where: { stripeEventId: event.id },
        });

        if (existingEventRetry?.processed) {
          console.log(`[Webhook] Event already processed (race condition): ${event.id}`);
          return NextResponse.json({
            received: true,
            alreadyProcessed: true,
            eventId: event.id,
            eventType: event.type,
          });
        }

        webhookEventId = existingEventRetry!.id;
      } else {
        console.error("[Webhook] Failed to create event record:", createError);
        throw createError;
      }
    }

    // Process the event
    const result = await processWebhookEvent(event);

    if (!result.success) {
      console.error(`[Webhook] Processing failed: ${result.error}`);

      // Update webhook event with error
      await db.webhookEvent.update({
        where: { id: webhookEventId },
        data: {
          errorMessage: result.error ?? "Unknown error",
        },
      });

      // Return 500 so Stripe will retry
      return NextResponse.json(
        { error: "Processing failed", eventId: result.eventId },
        { status: 500 }
      );
    }

    // Update webhook event to mark as processed
    await db.webhookEvent.update({
      where: { id: webhookEventId },
      data: {
        processed: true,
        processedAt: new Date(),
      },
    });

    console.log(`[Webhook] Successfully processed event: ${event.id}`);

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
