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
 *
 * Performance: Uses optimized database queries to filter by date range
 * and exclude already-sent emails at the database level.
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

    const now = new Date();
    const errors: { subscriptionId: string; error: string }[] = [];

    // Calculate date thresholds
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // ============================================
    // OPTIMIZED: Day 3 Reminder Query
    // Fetch only subscriptions that:
    // - Are PAST_DUE
    // - Status changed 3-7 days ago
    // - Have NOT received DAY_3_REMINDER email
    // ============================================
    const day3Candidates = await db.subscription.findMany({
      where: {
        status: "PAST_DUE",
        statusChangedAt: {
          lte: threeDaysAgo,
          gt: sevenDaysAgo,
        },
        dunningEmails: {
          none: { emailType: "DAY_3_REMINDER" },
        },
      },
      select: {
        id: true,
        plan: true,
        statusChangedAt: true,
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    // ============================================
    // OPTIMIZED: Day 7 Final Warning Query
    // Fetch only subscriptions that:
    // - Are PAST_DUE
    // - Status changed 7+ days ago
    // - Have NOT received DAY_7_FINAL_WARNING email
    // ============================================
    const day7Candidates = await db.subscription.findMany({
      where: {
        status: "PAST_DUE",
        statusChangedAt: {
          lte: sevenDaysAgo,
        },
        dunningEmails: {
          none: { emailType: "DAY_7_FINAL_WARNING" },
        },
      },
      select: {
        id: true,
        plan: true,
        statusChangedAt: true,
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    const totalCandidates = day3Candidates.length + day7Candidates.length;

    if (totalCandidates === 0) {
      return NextResponse.json({
        success: true,
        message: "No dunning emails to send",
        day3Sent: 0,
        day7Sent: 0,
      });
    }

    let day3Sent = 0;
    let day7Sent = 0;

    // Process Day 3 reminders
    for (const subscription of day3Candidates) {
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

    // Process Day 7 final warnings
    for (const subscription of day7Candidates) {
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

    return NextResponse.json({
      success: true,
      message: `Processed ${totalCandidates} dunning candidates`,
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
