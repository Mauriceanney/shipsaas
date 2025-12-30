import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { sendDunningReminderEmail, sendDunningFinalWarningEmail } from "@/lib/email";

/**
 * Cron job to send dunning emails for past due subscriptions.
 *
 * - Day 3: Sends friendly reminder email
 * - Day 7: Sends final warning email about service suspension
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
      console.warn("[cron/send-dunning-emails] Unauthorized access attempt");
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
        message: "No past due subscriptions",
        day3Sent: 0,
        day7Sent: 0,
      });
    }

    let day3Sent = 0;
    let day7Sent = 0;
    const errors: { subscriptionId: string; error: string }[] = [];

    const now = new Date();

    for (const subscription of pastDueSubscriptions) {
      if (!subscription.statusChangedAt) continue;

      // Calculate days since status changed to PAST_DUE
      const daysSinceFailed = Math.floor(
        (now.getTime() - subscription.statusChangedAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Check if Day 3 reminder should be sent
      const hasDay3Email = subscription.dunningEmails.some(
        (e) => e.emailType === "DAY_3_REMINDER"
      );

      if (daysSinceFailed >= 3 && !hasDay3Email) {
        try {
          const result = await sendDunningReminderEmail(subscription.user.email, {
            name: subscription.user.name ?? undefined,
            planName: subscription.plan,
            daysSinceFailed: 3,
          });

          await db.dunningEmail.create({
            data: {
              subscriptionId: subscription.id,
              emailType: "DAY_3_REMINDER",
              recipientEmail: subscription.user.email,
              emailStatus: result.success ? "SENT" : "FAILED",
              errorMessage: result.success ? undefined : result.error,
            },
          });

          if (result.success) {
            day3Sent++;
            console.log(
              `[cron/send-dunning-emails] Day 3 reminder sent for subscription ${subscription.id}`
            );
          } else {
            errors.push({
              subscriptionId: subscription.id,
              error: result.error ?? "Unknown error",
            });
            console.error(
              `[cron/send-dunning-emails] Failed to send Day 3 email for ${subscription.id}:`,
              result.error
            );
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          errors.push({ subscriptionId: subscription.id, error: errorMessage });
          console.error(
            `[cron/send-dunning-emails] Error sending Day 3 email for ${subscription.id}:`,
            error
          );
        }
      }

      // Check if Day 7 final warning should be sent
      const hasDay7Email = subscription.dunningEmails.some(
        (e) => e.emailType === "DAY_7_FINAL_WARNING"
      );

      if (daysSinceFailed >= 7 && !hasDay7Email) {
        try {
          // Calculate suspension date (e.g., 3 days from now)
          const suspensionDate = new Date();
          suspensionDate.setDate(suspensionDate.getDate() + 3);
          const formattedSuspensionDate = suspensionDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });

          const result = await sendDunningFinalWarningEmail(subscription.user.email, {
            name: subscription.user.name ?? undefined,
            planName: subscription.plan,
            daysSinceFailed: 7,
            suspensionDate: formattedSuspensionDate,
          });

          await db.dunningEmail.create({
            data: {
              subscriptionId: subscription.id,
              emailType: "DAY_7_FINAL_WARNING",
              recipientEmail: subscription.user.email,
              emailStatus: result.success ? "SENT" : "FAILED",
              errorMessage: result.success ? undefined : result.error,
            },
          });

          if (result.success) {
            day7Sent++;
            console.log(
              `[cron/send-dunning-emails] Day 7 final warning sent for subscription ${subscription.id}`
            );
          } else {
            errors.push({
              subscriptionId: subscription.id,
              error: result.error ?? "Unknown error",
            });
            console.error(
              `[cron/send-dunning-emails] Failed to send Day 7 email for ${subscription.id}:`,
              result.error
            );
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          errors.push({ subscriptionId: subscription.id, error: errorMessage });
          console.error(
            `[cron/send-dunning-emails] Error sending Day 7 email for ${subscription.id}:`,
            error
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${pastDueSubscriptions.length} past due subscriptions`,
      day3Sent,
      day7Sent,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("[cron/send-dunning-emails] Critical error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
