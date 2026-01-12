/**
 * Send Dunning Emails Cron Job
 *
 * Sends dunning emails to users with past due subscriptions.
 * Should be called once per day.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createId } from "@paralleldrive/cuid2";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import {
  renderPaymentFailedEmail,
  renderDunningReminderEmail,
  renderDunningFinalWarningEmail,
} from "@/lib/email/templates";
import { subscription, user, dunningEmail } from "@/lib/schema";
import type { DunningEmailType } from "@/lib/schema";
import { formatPrice, PLAN_CONFIGS, DUNNING_SCHEDULE } from "@/lib/stripe/config";
import { daysSince } from "@/lib/stripe/utils";

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
 * GET /api/cron/send-dunning-emails
 *
 * Process and send dunning emails for past due subscriptions
 */
export async function GET() {
  const headersList = await headers();

  // Verify authorization
  if (!verifyCronSecret(headersList)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const updatePaymentUrl = `${appUrl}/settings/billing`;

  try {
    // Get all past due subscriptions
    const pastDueSubscriptions = await db
      .select({
        id: subscription.id,
        userId: subscription.userId,
        plan: subscription.plan,
        statusChangedAt: subscription.statusChangedAt,
        stripePriceId: subscription.stripePriceId,
        userEmail: user.email,
        userName: user.name,
      })
      .from(subscription)
      .innerJoin(user, eq(subscription.userId, user.id))
      .where(
        and(
          eq(subscription.status, "PAST_DUE"),
          isNull(subscription.deletedAt)
        )
      );

    let emailsSent = 0;
    let errors = 0;

    for (const sub of pastDueSubscriptions) {
      const daysSinceFailure = daysSince(sub.statusChangedAt) ?? 0;

      // Determine which email to send based on days since failure
      let emailType: DunningEmailType | null = null;

      if (daysSinceFailure >= DUNNING_SCHEDULE.DAY_10_SUSPENDED) {
        emailType = "DAY_10_SUSPENDED";
      } else if (daysSinceFailure >= DUNNING_SCHEDULE.DAY_7_FINAL_WARNING) {
        emailType = "DAY_7_FINAL_WARNING";
      } else if (daysSinceFailure >= DUNNING_SCHEDULE.DAY_3_REMINDER) {
        emailType = "DAY_3_REMINDER";
      } else if (daysSinceFailure >= DUNNING_SCHEDULE.DAY_0_PAYMENT_FAILED) {
        emailType = "DAY_0_PAYMENT_FAILED";
      }

      if (!emailType) continue;

      // Check if this email type was already sent
      const [existingEmail] = await db
        .select({ id: dunningEmail.id })
        .from(dunningEmail)
        .where(
          and(
            eq(dunningEmail.subscriptionId, sub.id),
            eq(dunningEmail.emailType, emailType)
          )
        )
        .limit(1);

      if (existingEmail) continue;

      // Get plan config for pricing
      const planConfig = sub.plan !== "FREE" ? PLAN_CONFIGS[sub.plan] : null;
      const isMonthly = planConfig?.monthlyPriceId === sub.stripePriceId;
      const amount = planConfig
        ? formatPrice(isMonthly ? planConfig.monthlyPrice : planConfig.yearlyPrice)
        : "$0.00";

      try {
        let html: string;
        let text: string;
        let subject: string;

        if (emailType === "DAY_0_PAYMENT_FAILED") {
          const rendered = await renderPaymentFailedEmail({
            name: sub.userName,
            planName: planConfig?.name ?? "Premium",
            amount,
            updatePaymentUrl,
          });
          html = rendered.html;
          text = rendered.text;
          subject = "Action Required: Your payment failed";
        } else if (emailType === "DAY_3_REMINDER" || emailType === "DAY_7_FINAL_WARNING") {
          const dayNumber = emailType === "DAY_3_REMINDER" ? 3 : 7;
          const daysRemaining = 10 - daysSinceFailure;
          const rendered = await renderDunningReminderEmail({
            name: sub.userName,
            planName: planConfig?.name ?? "Premium",
            amount,
            dayNumber,
            daysRemaining,
            updatePaymentUrl,
          });
          html = rendered.html;
          text = rendered.text;
          subject = dayNumber === 7
            ? `Urgent: ${daysRemaining} days left to update payment`
            : "Reminder: Your payment is still pending";
        } else {
          const rendered = await renderDunningFinalWarningEmail({
            name: sub.userName,
            planName: planConfig?.name ?? "Premium",
            amount,
            updatePaymentUrl,
          });
          html = rendered.html;
          text = rendered.text;
          subject = "Your subscription has been suspended";
        }

        // Send email
        await sendEmail({
          to: sub.userEmail,
          subject,
          html,
          text,
        });

        // Record that email was sent
        await db.insert(dunningEmail).values({
          id: createId(),
          subscriptionId: sub.id,
          emailType,
          recipientEmail: sub.userEmail,
          emailStatus: "SENT",
        });

        emailsSent++;
        console.log(`[Cron] Sent ${emailType} email to ${sub.userEmail}`);
      } catch (error) {
        console.error(`[Cron] Failed to send ${emailType} email:`, error);

        // Record failed email
        await db.insert(dunningEmail).values({
          id: createId(),
          subscriptionId: sub.id,
          emailType,
          recipientEmail: sub.userEmail,
          emailStatus: "FAILED",
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        });

        errors++;
      }
    }

    console.log(`[Cron] Dunning emails complete: ${emailsSent} sent, ${errors} errors`);

    return NextResponse.json({
      success: true,
      emailsSent,
      errors,
      processed: pastDueSubscriptions.length,
    });
  } catch (error) {
    console.error("[Cron] Dunning emails failed:", error);
    return NextResponse.json(
      { error: "Failed to process dunning emails" },
      { status: 500 }
    );
  }
}
