"use server";

/**
 * Get Dunning Status
 *
 * Retrieves the dunning status for a subscription.
 */

import { headers } from "next/headers";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { subscription, dunningEmail } from "@/lib/schema";
import type { DunningStatusResult, DunningStatus } from "@/lib/stripe/types";
import { daysSince } from "@/lib/stripe/utils";

/**
 * Get dunning status for the current user's subscription
 */
export async function getDunningStatus(): Promise<DunningStatusResult> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = session.user.id;

  // Get subscription
  const [sub] = await db
    .select({
      id: subscription.id,
      status: subscription.status,
      statusChangedAt: subscription.statusChangedAt,
    })
    .from(subscription)
    .where(eq(subscription.userId, userId))
    .limit(1);

  if (!sub) {
    // No subscription, no dunning
    const status: DunningStatus = {
      isInDunning: false,
      daysSinceFailure: 0,
      failedAt: null,
      lastEmailType: null,
      lastEmailSentAt: null,
    };
    return { success: true, status };
  }

  // If not past due, no dunning
  if (sub.status !== "PAST_DUE") {
    const status: DunningStatus = {
      isInDunning: false,
      daysSinceFailure: 0,
      failedAt: null,
      lastEmailType: null,
      lastEmailSentAt: null,
    };
    return { success: true, status };
  }

  // Get latest dunning email
  const [lastEmail] = await db
    .select({
      emailType: dunningEmail.emailType,
      sentAt: dunningEmail.sentAt,
    })
    .from(dunningEmail)
    .where(eq(dunningEmail.subscriptionId, sub.id))
    .orderBy(desc(dunningEmail.sentAt))
    .limit(1);

  const failedAt = sub.statusChangedAt;
  const days = daysSince(failedAt);

  const status: DunningStatus = {
    isInDunning: true,
    daysSinceFailure: days ?? 0,
    failedAt,
    lastEmailType: lastEmail?.emailType ?? null,
    lastEmailSentAt: lastEmail?.sentAt ?? null,
  };

  return { success: true, status };
}
