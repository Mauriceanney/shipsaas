/**
 * Stripe webhook event handlers
 */

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { sendSubscriptionConfirmationEmail, sendSubscriptionCancelledEmail, sendPaymentFailedEmail } from "@/lib/email";

import { stripe } from "./client";
import { extractCustomerId, extractPriceId, extractSubscriptionId, getPlanFromPriceId, mapStripeStatus, unixToDate, validateCheckoutMetadata } from "./utils";

import type { SupportedWebhookEvent, WebhookResult } from "./types";
import type Stripe from "stripe";

// ============================================
// CHECKOUT HANDLERS
// ============================================

/**
 * Handle checkout.session.completed event
 * Creates or updates subscription after successful checkout
 */
export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  // Only handle subscription checkouts
  if (session.mode !== "subscription") {
    console.log("Skipping non-subscription checkout:", session.id);
    return;
  }

  // Validate metadata
  const metadata = validateCheckoutMetadata(session.metadata);
  if (!metadata) {
    console.error("Missing userId in checkout metadata:", session.id);
    return;
  }

  const customerId = extractCustomerId(session);
  const subscriptionId = extractSubscriptionId(session);

  if (!customerId || !subscriptionId) {
    console.error("Missing customer or subscription ID:", session.id);
    return;
  }

  // Fetch full subscription details from Stripe
  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = extractPriceId(stripeSubscription);
  const plan = priceId ? getPlanFromPriceId(priceId) : "FREE";

  // Upsert subscription in database
  await db.subscription.upsert({
    where: { userId: metadata.userId },
    create: {
      userId: metadata.userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId,
      stripeCurrentPeriodEnd: unixToDate(stripeSubscription.current_period_end),
      status: mapStripeStatus(stripeSubscription.status),
      plan,
    },
    update: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId,
      stripeCurrentPeriodEnd: unixToDate(stripeSubscription.current_period_end),
      status: mapStripeStatus(stripeSubscription.status),
      plan,
    },
  });

  // Revalidate cached pages that display subscription data
  revalidatePath("/pricing");
  revalidatePath("/settings/billing");

  console.log(`Subscription created/updated for user: ${metadata.userId}`);

  // Send subscription confirmation email (graceful degradation)
  try {
    // Fetch user details for email
    const user = await db.user.findUnique({
      where: { id: metadata.userId },
      select: { email: true, name: true },
    });

    if (user?.email) {
      // Determine billing cycle from subscription interval
      const interval = stripeSubscription.items.data[0]?.price?.recurring?.interval;
      const billingCycle: "monthly" | "yearly" = interval === "year" ? "yearly" : "monthly";

      // Get amount from subscription
      const amount = stripeSubscription.items.data[0]?.price?.unit_amount;
      const currency = stripeSubscription.items.data[0]?.price?.currency?.toUpperCase() ?? "USD";
      const formattedAmount = amount
        ? `${currency} ${(amount / 100).toFixed(2)}`
        : "N/A";

      await sendSubscriptionConfirmationEmail(user.email, {
        name: user.name ?? undefined,
        planName: plan,
        amount: formattedAmount,
        billingCycle,
        nextBillingDate: unixToDate(stripeSubscription.current_period_end).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      });
    }
  } catch (emailError) {
    console.error("Failed to send subscription confirmation email:", emailError);
    // Don't throw - subscription was created successfully
  }
}

// ============================================
// SUBSCRIPTION HANDLERS
// ============================================

/**
 * Handle customer.subscription.created event
 */
export async function handleSubscriptionCreated(
  subscription: Stripe.Subscription
): Promise<void> {
  const metadata = subscription.metadata;
  const userId = metadata?.["userId"];

  if (!userId) {
    console.log("No userId in subscription metadata, skipping:", subscription.id);
    return;
  }

  const customerId = extractCustomerId(subscription);
  const priceId = extractPriceId(subscription);
  const plan = priceId ? getPlanFromPriceId(priceId) : "FREE";

  await db.subscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      stripeCurrentPeriodEnd: unixToDate(subscription.current_period_end),
      status: mapStripeStatus(subscription.status),
      plan,
    },
    update: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      stripeCurrentPeriodEnd: unixToDate(subscription.current_period_end),
      status: mapStripeStatus(subscription.status),
      plan,
    },
  });

  console.log(`Subscription created for user: ${userId}`);
}

/**
 * Partial type for Stripe's previous_attributes in subscription update events
 */
interface SubscriptionPreviousAttributes {
  cancel_at_period_end?: boolean;
  [key: string]: unknown;
}

/**
 * Handle customer.subscription.updated event
 *
 * @param subscription - The current subscription state from Stripe
 * @param previousAttributes - Optional: fields that changed in this event (from event.data.previous_attributes)
 *                            Using this prevents race conditions when Stripe sends multiple update events
 */
export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  previousAttributes?: SubscriptionPreviousAttributes
): Promise<void> {
  // Find subscription by Stripe subscription ID
  console.log(`[handleSubscriptionUpdated] Looking up subscription with stripeSubscriptionId: ${subscription.id}`);

  const existingSubscription = await db.subscription.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!existingSubscription) {
    console.log(`[handleSubscriptionUpdated] No matching subscription found for stripeSubscriptionId: ${subscription.id}. This may indicate the subscription was created through a different flow or the webhook arrived before checkout completed.`);
    return;
  }

  console.log(`[handleSubscriptionUpdated] Found existing subscription with id: ${existingSubscription.id}, cancelAtPeriodEnd: ${existingSubscription.cancelAtPeriodEnd}`);

  const priceId = extractPriceId(subscription);
  const plan = priceId ? getPlanFromPriceId(priceId) : existingSubscription.plan;

  // Determine if this is a NEW cancellation using Stripe's previous_attributes (preferred)
  // This prevents race conditions and duplicate emails when Stripe sends multiple update events
  let isNewCancellation = false;

  if (previousAttributes !== undefined) {
    // Use previous_attributes from the event (most reliable - prevents race conditions)
    // Only send email if cancel_at_period_end is IN the previous_attributes (meaning it changed)
    // AND it changed from false to true
    const cancelAtPeriodEndChanged = "cancel_at_period_end" in previousAttributes;
    const wasNotCancelled = previousAttributes.cancel_at_period_end === false;
    const isNowCancelled = subscription.cancel_at_period_end === true;

    isNewCancellation = cancelAtPeriodEndChanged && wasNotCancelled && isNowCancelled;

    console.log(`[handleSubscriptionUpdated] Using previous_attributes: cancelAtPeriodEndChanged=${cancelAtPeriodEndChanged}, wasNotCancelled=${wasNotCancelled}, isNowCancelled=${isNowCancelled}, isNewCancellation=${isNewCancellation}`);
  } else {
    // Fallback to database comparison (less reliable due to potential race conditions)
    isNewCancellation = subscription.cancel_at_period_end && !existingSubscription.cancelAtPeriodEnd;
    console.log(`[handleSubscriptionUpdated] Using DB fallback: isNewCancellation=${isNewCancellation}`);
  }

  await db.subscription.update({
    where: { id: existingSubscription.id },
    data: {
      stripePriceId: priceId,
      stripeCurrentPeriodEnd: unixToDate(subscription.current_period_end),
      status: mapStripeStatus(subscription.status),
      plan,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });

  // Revalidate cached pages that display subscription data
  revalidatePath("/pricing");
  revalidatePath("/settings/billing");

  console.log(`Subscription updated: ${subscription.id}`);

  // Send cancellation email ONLY when cancel_at_period_end changes from false to true
  // This prevents duplicate emails when Stripe sends multiple update events
  if (isNewCancellation) {
    console.log(`[handleSubscriptionUpdated] NEW cancellation detected for subscription ${subscription.id}`);

    try {
      // Fetch user details for email
      const user = await db.user.findUnique({
        where: { id: existingSubscription.userId },
        select: { email: true, name: true },
      });

      if (user?.email) {
        // Format end date from subscription (when access will end)
        const endDate = unixToDate(subscription.current_period_end).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        await sendSubscriptionCancelledEmail(user.email, {
          name: user.name ?? undefined,
          planName: plan,
          endDate,
        });

        console.log(`[handleSubscriptionUpdated] Cancellation email sent for subscription ${subscription.id}`);
      }
    } catch (emailError) {
      console.error("Failed to send subscription cancellation email:", emailError);
      // Don't throw - subscription update was completed successfully
    }
  } else if (subscription.cancel_at_period_end) {
    console.log(`[handleSubscriptionUpdated] Skipping email - already sent for this cancellation`);
  }
}

/**
 * Handle customer.subscription.deleted event
 */
export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  // Find subscription by Stripe subscription ID
  console.log(`[handleSubscriptionDeleted] Looking up subscription with stripeSubscriptionId: ${subscription.id}`);

  const existingSubscription = await db.subscription.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!existingSubscription) {
    console.log(`[handleSubscriptionDeleted] No matching subscription found for stripeSubscriptionId: ${subscription.id}. This may indicate the subscription was already deleted or was never created in the database.`);
    return;
  }

  console.log(`[handleSubscriptionDeleted] Found existing subscription with id: ${existingSubscription.id}, userId: ${existingSubscription.userId}, plan: ${existingSubscription.plan}`);

  await db.subscription.update({
    where: { id: existingSubscription.id },
    data: {
      status: "CANCELED",
      plan: "FREE", // Reset plan to FREE on cancellation
      stripeSubscriptionId: null, // Clear subscription ID
      cancelAtPeriodEnd: false, // Reset for potential resubscription
      // Keep stripeCustomerId for potential resubscription
    },
  });

  // Revalidate cached pages that display subscription data
  revalidatePath("/pricing");
  revalidatePath("/settings/billing");

  console.log(`Subscription deleted: ${subscription.id}`);
  // Note: Cancellation email is sent in handleSubscriptionUpdated when cancel_at_period_end is set
}

// ============================================
// INVOICE HANDLERS
// ============================================

/**
 * Handle invoice.paid event
 */
export async function handleInvoicePaid(
  invoice: Stripe.Invoice
): Promise<void> {
  const subscriptionId = typeof invoice.subscription === "string"
    ? invoice.subscription
    : invoice.subscription?.id;

  if (!subscriptionId) {
    console.log("No subscription ID in invoice:", invoice.id);
    return;
  }

  // Update subscription status if it was past_due
  const existingSubscription = await db.subscription.findFirst({
    where: {
      stripeSubscriptionId: subscriptionId,
      status: "PAST_DUE",
    },
  });

  if (existingSubscription) {
    await db.subscription.update({
      where: { id: existingSubscription.id },
      data: { status: "ACTIVE" },
    });

    console.log(`Subscription reactivated after payment: ${subscriptionId}`);
  }
}

/**
 * Handle invoice.payment_failed event
 */
export async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice
): Promise<void> {
  const subscriptionId = typeof invoice.subscription === "string"
    ? invoice.subscription
    : invoice.subscription?.id;

  if (!subscriptionId) {
    console.log("No subscription ID in invoice:", invoice.id);
    return;
  }

  // Update subscription status to past_due
  const existingSubscription = await db.subscription.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (existingSubscription) {
    await db.subscription.update({
      where: { id: existingSubscription.id },
      data: { status: "PAST_DUE" },
    });

    console.log(`Subscription marked as past_due: ${subscriptionId}`);

    // Send payment failed notification email (graceful degradation)
    try {
      const user = await db.user.findUnique({
        where: { id: existingSubscription.userId },
        select: { email: true, name: true },
      });

      if (user?.email) {
        // Format amount from invoice
        const amountDue = invoice.amount_due ?? 0;
        const currency = invoice.currency?.toUpperCase() ?? "USD";
        const formattedAmount = `${currency} ${(amountDue / 100).toFixed(2)}`;

        // Format failed date from invoice created timestamp
        const failedDate = unixToDate(invoice.created).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        // Format next retry date if available
        const nextRetryDate = invoice.next_payment_attempt
          ? unixToDate(invoice.next_payment_attempt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : undefined;

        await sendPaymentFailedEmail(user.email, {
          name: user.name ?? undefined,
          planName: existingSubscription.plan,
          amount: formattedAmount,
          failedDate,
          nextRetryDate,
        });

        console.log(`Payment failed email sent for subscription: ${subscriptionId}`);
      }
    } catch (emailError) {
      console.error("Failed to send payment failed email:", emailError);
      // Don't throw - subscription update was completed successfully
    }
  }
}

// ============================================
// MAIN WEBHOOK PROCESSOR
// ============================================

/**
 * Process a Stripe webhook event
 */
export async function processWebhookEvent(
  event: Stripe.Event
): Promise<WebhookResult> {
  const eventType = event.type as SupportedWebhookEvent;

  console.log(`Processing webhook event: ${eventType} (${event.id})`);

  try {
    switch (eventType) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.updated":
        // Pass previous_attributes to enable proper deduplication of cancellation emails
        // This prevents race conditions when Stripe sends multiple update events
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
          event.data.previous_attributes as Record<string, unknown> | undefined
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return {
      success: true,
      eventId: event.id,
      eventType: event.type,
    };
  } catch (error) {
    console.error(`Error processing webhook event ${event.id}:`, error);
    return {
      success: false,
      eventId: event.id,
      eventType: event.type,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
