/**
 * Suspend Subscriptions Cron Job
 *
 * Suspends subscriptions that have been past due for too long.
 * Should be called once per day.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { eq, and, isNull, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { renderDunningFinalWarningEmail } from "@/lib/email/templates";
import { subscription, user } from "@/lib/schema";
import { stripe } from "@/lib/stripe/client";
import { formatPrice, PLAN_CONFIGS, SUSPENSION_GRACE_PERIOD_DAYS } from "@/lib/stripe/config";

/**
 * Verify cron secret for authorization
 */
function verifyCronSecret(headersList: Headers): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.warn("[Cron] CRON_SECRET not configured");
    return false;
  }

  const authHeader = headersList.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * GET /api/cron/suspend-subscriptions
 *
 * Suspend subscriptions that have exceeded the grace period
 */
export async function GET() {
  const headersList = await headers();

  // Verify authorization
  if (!verifyCronSecret(headersList)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const updatePaymentUrl = `${appUrl}/settings/billing`;

  // Calculate the cutoff date (grace period days ago)
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - SUSPENSION_GRACE_PERIOD_DAYS);

  try {
    // Get all past due subscriptions that have exceeded grace period
    const subscriptionsToSuspend = await db
      .select({
        id: subscription.id,
        userId: subscription.userId,
        plan: subscription.plan,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
        stripePriceId: subscription.stripePriceId,
        userEmail: user.email,
        userName: user.name,
      })
      .from(subscription)
      .innerJoin(user, eq(subscription.userId, user.id))
      .where(
        and(
          eq(subscription.status, "PAST_DUE"),
          isNull(subscription.deletedAt),
          lte(subscription.statusChangedAt, cutoffDate)
        )
      );

    let suspended = 0;
    let errors = 0;

    for (const sub of subscriptionsToSuspend) {
      try {
        // Cancel the Stripe subscription if it exists
        if (sub.stripeSubscriptionId) {
          await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
        }

        // Update subscription to inactive/canceled
        await db
          .update(subscription)
          .set({
            status: "CANCELED",
            plan: "FREE",
            statusChangedAt: new Date(),
          })
          .where(eq(subscription.id, sub.id));

        // Send final suspension email
        const planConfig = sub.plan !== "FREE" ? PLAN_CONFIGS[sub.plan] : null;
        const isMonthly = planConfig?.monthlyPriceId === sub.stripePriceId;
        const amount = planConfig
          ? formatPrice(isMonthly ? planConfig.monthlyPrice : planConfig.yearlyPrice)
          : "$0.00";

        const { html, text } = await renderDunningFinalWarningEmail({
          name: sub.userName,
          planName: planConfig?.name ?? "Premium",
          amount,
          updatePaymentUrl,
        });

        await sendEmail({
          to: sub.userEmail,
          subject: "Your subscription has been suspended",
          html,
          text,
        });

        suspended++;
        console.log(`[Cron] Suspended subscription for user ${sub.userId}`);
      } catch (error) {
        console.error(`[Cron] Failed to suspend subscription ${sub.id}:`, error);
        errors++;
      }
    }

    console.log(`[Cron] Subscription suspension complete: ${suspended} suspended, ${errors} errors`);

    return NextResponse.json({
      success: true,
      suspended,
      errors,
      processed: subscriptionsToSuspend.length,
    });
  } catch (error) {
    console.error("[Cron] Subscription suspension failed:", error);
    return NextResponse.json(
      { error: "Failed to process subscription suspensions" },
      { status: 500 }
    );
  }
}
