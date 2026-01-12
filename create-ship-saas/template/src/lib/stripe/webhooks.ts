/**
 * Stripe Webhook Handlers
 *
 * Event handlers for Stripe webhooks.
 */

import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import {
  renderSubscriptionConfirmEmail,
  renderSubscriptionCancelledEmail,
} from "@/lib/email/templates";
import {
  subscription,
  webhookEvent,
  user,
  dunningEmail,
} from "@/lib/schema";
import { getPlanFromPriceId, formatPrice, PLAN_CONFIGS } from "./config";
import { mapStripeStatus } from "./utils";
import type Stripe from "stripe";

/**
 * Check if webhook event was already processed (idempotency)
 */
export async function isEventProcessed(eventId: string): Promise<boolean> {
  const [existing] = await db
    .select({ id: webhookEvent.id })
    .from(webhookEvent)
    .where(eq(webhookEvent.stripeEventId, eventId))
    .limit(1);

  return !!existing;
}

/**
 * Mark webhook event as processed
 */
export async function markEventProcessed(
  eventId: string,
  eventType: string,
  apiVersion?: string
): Promise<void> {
  await db.insert(webhookEvent).values({
    id: createId(),
    stripeEventId: eventId,
    eventType,
    processed: true,
    processedAt: new Date(),
    apiVersion,
  });
}

/**
 * Handle checkout.session.completed event
 */
export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  const userId = session.client_reference_id;

  if (!userId || !customerId) {
    console.error("[Webhook] Missing userId or customerId in checkout session");
    return;
  }

  // Check if subscription record exists
  const [existingSub] = await db
    .select({ id: subscription.id })
    .from(subscription)
    .where(eq(subscription.userId, userId))
    .limit(1);

  if (existingSub) {
    // Update existing subscription
    await db
      .update(subscription)
      .set({
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        status: "ACTIVE",
        statusChangedAt: new Date(),
      })
      .where(eq(subscription.userId, userId));
  } else {
    // Create new subscription
    await db.insert(subscription).values({
      id: createId(),
      userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      status: "ACTIVE",
      plan: "FREE", // Will be updated by subscription.created event
      statusChangedAt: new Date(),
    });
  }

  console.log(`[Webhook] Checkout completed for user ${userId}`);
}

/**
 * Handle customer.subscription.created event
 */
export async function handleSubscriptionCreated(
  stripeSubscription: Stripe.Subscription
): Promise<void> {
  const customerId = stripeSubscription.customer as string;
  const priceId = stripeSubscription.items.data[0]?.price.id;
  const plan = priceId ? getPlanFromPriceId(priceId) : null;

  // Find subscription by customer ID
  const [sub] = await db
    .select({
      id: subscription.id,
      userId: subscription.userId,
    })
    .from(subscription)
    .where(eq(subscription.stripeCustomerId, customerId))
    .limit(1);

  if (!sub) {
    console.error(`[Webhook] No subscription found for customer ${customerId}`);
    return;
  }

  // Get subscription details
  const subData = stripeSubscription as unknown as {
    current_period_end: number;
    trial_end: number | null;
    cancel_at_period_end: boolean;
  };

  // Update subscription with plan and status
  await db
    .update(subscription)
    .set({
      stripeSubscriptionId: stripeSubscription.id,
      stripePriceId: priceId,
      plan: plan ?? "FREE",
      status: mapStripeStatus(stripeSubscription.status),
      stripeCurrentPeriodEnd: new Date(subData.current_period_end * 1000),
      stripeTrialEnd: subData.trial_end
        ? new Date(subData.trial_end * 1000)
        : null,
      cancelAtPeriodEnd: subData.cancel_at_period_end,
      statusChangedAt: new Date(),
    })
    .where(eq(subscription.id, sub.id));

  // Get user for email
  const [userData] = await db
    .select({ email: user.email, name: user.name })
    .from(user)
    .where(eq(user.id, sub.userId))
    .limit(1);

  if (userData && plan) {
    const planConfig = plan !== "FREE" ? PLAN_CONFIGS[plan] : null;
    if (planConfig) {
      const billingCycle = planConfig.monthlyPriceId === priceId ? "monthly" : "yearly";
      const price = billingCycle === "monthly" ? planConfig.monthlyPrice : planConfig.yearlyPrice;

      const { html, text } = await renderSubscriptionConfirmEmail({
        name: userData.name,
        planName: planConfig.name,
        amount: formatPrice(price),
        billingCycle,
        nextBillingDate: new Date(
          subData.current_period_end * 1000
        ).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
        manageUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
      });

      await sendEmail({
        to: userData.email,
        subject: `Welcome to ${planConfig.name}!`,
        html,
        text,
      });
    }
  }

  console.log(`[Webhook] Subscription created for customer ${customerId}`);
}

/**
 * Handle customer.subscription.updated event
 */
export async function handleSubscriptionUpdated(
  stripeSubscription: Stripe.Subscription
): Promise<void> {
  const subscriptionId = stripeSubscription.id;
  const priceId = stripeSubscription.items.data[0]?.price.id;
  const plan = priceId ? getPlanFromPriceId(priceId) : null;
  const previousStatus = (stripeSubscription as Stripe.Subscription & { previous_attributes?: { status?: string } })
    .previous_attributes?.status;
  const newStatus = mapStripeStatus(stripeSubscription.status);

  // Find subscription by Stripe subscription ID
  const [sub] = await db
    .select({ id: subscription.id, status: subscription.status })
    .from(subscription)
    .where(eq(subscription.stripeSubscriptionId, subscriptionId))
    .limit(1);

  if (!sub) {
    console.error(`[Webhook] No subscription found for ${subscriptionId}`);
    return;
  }

  // Track status change time
  const statusChanged = sub.status !== newStatus;

  // Get subscription details with proper typing
  const subData = stripeSubscription as unknown as {
    current_period_end: number;
    trial_end: number | null;
    cancel_at_period_end: boolean;
  };

  // Update subscription
  await db
    .update(subscription)
    .set({
      stripePriceId: priceId,
      plan: plan ?? undefined,
      status: newStatus,
      stripeCurrentPeriodEnd: new Date(
        subData.current_period_end * 1000
      ),
      stripeTrialEnd: subData.trial_end
        ? new Date(subData.trial_end * 1000)
        : null,
      cancelAtPeriodEnd: subData.cancel_at_period_end,
      ...(statusChanged ? { statusChangedAt: new Date() } : {}),
    })
    .where(eq(subscription.id, sub.id));

  // If status changed from past_due to active, clear dunning state
  if (previousStatus === "past_due" && newStatus === "ACTIVE") {
    // Mark payment recovered in dunning emails
    await db.insert(dunningEmail).values({
      id: createId(),
      subscriptionId: sub.id,
      emailType: "PAYMENT_RECOVERED",
      recipientEmail: "", // Will be filled by the recovery flow
      emailStatus: "SENT",
    }).onConflictDoNothing();
  }

  console.log(`[Webhook] Subscription updated: ${subscriptionId}`);
}

/**
 * Handle customer.subscription.deleted event
 */
export async function handleSubscriptionDeleted(
  stripeSubscription: Stripe.Subscription
): Promise<void> {
  const subscriptionId = stripeSubscription.id;

  // Find subscription and user
  const [sub] = await db
    .select({
      id: subscription.id,
      userId: subscription.userId,
    })
    .from(subscription)
    .where(eq(subscription.stripeSubscriptionId, subscriptionId))
    .limit(1);

  if (!sub) {
    console.error(`[Webhook] No subscription found for ${subscriptionId}`);
    return;
  }

  // Update subscription to canceled
  await db
    .update(subscription)
    .set({
      status: "CANCELED",
      plan: "FREE",
      statusChangedAt: new Date(),
    })
    .where(eq(subscription.id, sub.id));

  // Get user for email
  const [userData] = await db
    .select({ email: user.email, name: user.name })
    .from(user)
    .where(eq(user.id, sub.userId))
    .limit(1);

  if (userData) {
    const { html, text } = await renderSubscriptionCancelledEmail({
      name: userData.name,
      planName: "Premium",
      endDate: new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      resubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    });

    await sendEmail({
      to: userData.email,
      subject: "Your subscription has been cancelled",
      html,
      text,
    });
  }

  console.log(`[Webhook] Subscription deleted: ${subscriptionId}`);
}

/**
 * Handle invoice.paid event
 */
export async function handleInvoicePaid(
  invoice: Stripe.Invoice
): Promise<void> {
  const invoiceData = invoice as unknown as { subscription: string | null };
  const subscriptionId = invoiceData.subscription;

  if (!subscriptionId) return;

  // Update subscription status if it was past due
  await db
    .update(subscription)
    .set({
      status: "ACTIVE",
      statusChangedAt: new Date(),
    })
    .where(eq(subscription.stripeSubscriptionId, subscriptionId));

  console.log(`[Webhook] Invoice paid for subscription ${subscriptionId}`);
}

/**
 * Handle invoice.payment_failed event
 */
export async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice
): Promise<void> {
  const invoiceData = invoice as unknown as { subscription: string | null };
  const subscriptionId = invoiceData.subscription;

  if (!subscriptionId) return;

  // Find subscription
  const [sub] = await db
    .select({
      id: subscription.id,
      userId: subscription.userId,
      status: subscription.status,
    })
    .from(subscription)
    .where(eq(subscription.stripeSubscriptionId, subscriptionId))
    .limit(1);

  if (!sub) {
    console.error(`[Webhook] No subscription found for ${subscriptionId}`);
    return;
  }

  // Update subscription to past due
  await db
    .update(subscription)
    .set({
      status: "PAST_DUE",
      statusChangedAt: new Date(),
    })
    .where(eq(subscription.id, sub.id));

  // Get user email for dunning
  const [userData] = await db
    .select({ email: user.email })
    .from(user)
    .where(eq(user.id, sub.userId))
    .limit(1);

  // Record initial dunning email (Day 0)
  if (userData) {
    await db
      .insert(dunningEmail)
      .values({
        id: createId(),
        subscriptionId: sub.id,
        emailType: "DAY_0_PAYMENT_FAILED",
        recipientEmail: userData.email,
        emailStatus: "PENDING",
      })
      .onConflictDoNothing();
  }

  console.log(`[Webhook] Payment failed for subscription ${subscriptionId}`);
}

/**
 * Handle charge.refunded event
 */
export async function handleChargeRefunded(
  charge: Stripe.Charge
): Promise<void> {
  // Log refund for audit trail
  console.log(`[Webhook] Charge refunded: ${charge.id}, amount: ${charge.amount_refunded}`);

  // Additional refund handling can be added here
  // e.g., update internal records, send notification, etc.
}
