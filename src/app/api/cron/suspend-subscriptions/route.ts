import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { sendSubscriptionSuspendedEmail } from "@/lib/email";
import { stripe } from "@/lib/stripe/client";

/**
 * Cron job to suspend subscriptions past due for 10+ days.
 *
 * - Day 10+: Cancels subscription in Stripe and sends suspension email
 *
 * This endpoint should be called by a cron scheduler (e.g., Vercel Cron, external cron service)
 * at regular intervals (e.g., daily).
 *
 * Security: Protected by CRON_SECRET header verification.
 */
export async function GET() {
  try {
    // Verify cron secret to prevent unauthorized access
    const headersList = await headers();
    const cronSecret = headersList.get("x-cron-secret");
    const expectedSecret = process.env["CRON_SECRET"];

    // Allow in development without secret, require in production
    if (process.env.NODE_ENV === "production" && cronSecret !== expectedSecret) {
      console.warn("[cron/suspend-subscriptions] Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find all PAST_DUE subscriptions with user data
    const pastDueSubscriptions = await db.subscription.findMany({
      where: {
        status: "PAST_DUE",
        statusChangedAt: { not: null },
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
        dunningEmails: {
          select: {
            emailType: true,
          },
        },
      },
    });

    if (pastDueSubscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No past due subscriptions to suspend",
        suspended: 0,
      });
    }

    let suspended = 0;
    const errors: { subscriptionId: string; error: string }[] = [];

    const now = new Date();

    for (const subscription of pastDueSubscriptions) {
      if (!subscription.statusChangedAt) continue;

      // Calculate days since status changed to PAST_DUE
      const daysSinceFailed = Math.floor(
        (now.getTime() - subscription.statusChangedAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Check if subscription should be suspended (10+ days)
      const hasDay10Email = subscription.dunningEmails.some(
        (e) => e.emailType === "DAY_10_SUSPENDED"
      );

      if (daysSinceFailed >= 10 && !hasDay10Email) {
        try {
          // Cancel subscription in Stripe
          if (subscription.stripeSubscriptionId) {
            await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
          }

          // Update local subscription status to CANCELED
          await db.subscription.update({
            where: { id: subscription.id },
            data: { status: "CANCELED" },
          });

          // Subscription is now suspended - count it
          suspended++;
          console.log(
            `[cron/suspend-subscriptions] Subscription suspended: ${subscription.id}`
          );

          // Send suspension email (graceful degradation)
          const emailResult = await sendSubscriptionSuspendedEmail(
            subscription.user.email,
            {
              name: subscription.user.name ?? undefined,
              planName: subscription.plan,
              daysOverdue: daysSinceFailed,
            }
          );

          // Create dunning email record
          await db.dunningEmail.create({
            data: {
              subscriptionId: subscription.id,
              emailType: "DAY_10_SUSPENDED",
              recipientEmail: subscription.user.email,
              emailStatus: emailResult.success ? "SENT" : "FAILED",
              errorMessage: emailResult.success ? undefined : emailResult.error,
            },
          });

          if (!emailResult.success) {
            errors.push({
              subscriptionId: subscription.id,
              error: emailResult.error ?? "Email failed",
            });
            console.error(
              `[cron/suspend-subscriptions] Failed to send email for ${subscription.id}:`,
              emailResult.error
            );
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          errors.push({ subscriptionId: subscription.id, error: errorMessage });
          console.error(
            `[cron/suspend-subscriptions] Error processing ${subscription.id}:`,
            error
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${pastDueSubscriptions.length} past due subscriptions`,
      suspended,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("[cron/suspend-subscriptions] Critical error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
