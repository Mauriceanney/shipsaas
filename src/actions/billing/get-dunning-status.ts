"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export interface DunningStatusData {
  showBanner: boolean;
  daysSinceFailed: number;
  statusChangedAt: Date | null;
}

export type DunningStatusResult =
  | { success: true; data: DunningStatusData }
  | { success: false; error: string };

/**
 * Server action to get dunning status for the current user
 * Returns information about whether to show the dunning banner
 */
export async function getDunningStatus(): Promise<DunningStatusResult> {
  try {
    // 1. Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // 2. Get user's subscription
    const subscription = await db.subscription.findUnique({
      where: { userId: session.user.id },
      select: { status: true, statusChangedAt: true },
    });

    // 3. Check if subscription is PAST_DUE
    if (!subscription || subscription.status !== "PAST_DUE") {
      return {
        success: true,
        data: {
          showBanner: false,
          daysSinceFailed: 0,
          statusChangedAt: null,
        },
      };
    }

    // 4. Calculate days since failed
    const daysSinceFailed = subscription.statusChangedAt
      ? Math.floor(
          (Date.now() - subscription.statusChangedAt.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

    return {
      success: true,
      data: {
        showBanner: true,
        daysSinceFailed,
        statusChangedAt: subscription.statusChangedAt,
      },
    };
  } catch (error) {
    logger.error({ err: error }, "Failed to get dunning status");
    return { success: false, error: "Failed to get dunning status" };
  }
}
