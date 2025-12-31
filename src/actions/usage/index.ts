"use server";

/**
 * Usage Server Actions
 * Get and manage usage data for authenticated users
 */

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserUsage } from "@/lib/usage";

import type { Plan } from "@prisma/client";

/**
 * Get current user's usage data with plan limits
 */
export async function getCurrentUsage() {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" } as const;
  }

  try {
    // Get user's subscription plan
    const subscription = await db.subscription.findUnique({
      where: { userId: session.user.id },
      select: { plan: true },
    });

    const plan: Plan = subscription?.plan ?? "FREE";
    const usage = await getUserUsage(session.user.id, plan);

    // Convert BigInt to number for serialization
    return {
      success: true,
      data: {
        plan,
        usage: {
          apiCalls: usage.apiCalls,
          projects: usage.projects,
          storage: {
            used: Number(usage.storage.used),
            limit: usage.storage.limit,
          },
          teamMembers: usage.teamMembers,
        },
      },
    } as const;
  } catch (error) {
    console.error("[getCurrentUsage]", error);
    return { success: false, error: "Failed to get usage data" } as const;
  }
}
