"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
/**
 * Dismiss onboarding without completing all steps
 */
export async function dismissOnboarding() {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" } as const;
  }

  try {
    await db.user.update({
      where: { id: session.user.id },
      data: {
        onboardingCompleted: true,
        onboardingDismissedAt: new Date(),
      },
    });

    revalidatePath("/dashboard");

    return { success: true } as const;
  } catch (error) {
    logger.error(
      { err: error, userId: session.user.id },
      "Failed to dismiss onboarding"
    );
    return { success: false, error: "Failed to dismiss onboarding" } as const;
  }
}

/**
 * Mark onboarding as completed (all steps done)
 */
export async function completeOnboarding() {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" } as const;
  }

  try {
    await db.user.update({
      where: { id: session.user.id },
      data: {
        onboardingCompleted: true,
      },
    });

    revalidatePath("/dashboard");

    return { success: true } as const;
  } catch (error) {
    logger.error(
      { err: error, userId: session.user.id },
      "Failed to complete onboarding"
    );
    return { success: false, error: "Failed to complete onboarding" } as const;
  }
}

/**
 * Get onboarding status for a user
 */
export async function getOnboardingStatus() {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" } as const;
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        onboardingCompleted: true,
        onboardingDismissedAt: true,
        name: true,
        image: true,
        subscription: {
          select: {
            status: true,
            plan: true,
          },
        },
      },
    });

    if (!user) {
      return { success: false, error: "User not found" } as const;
    }

    const hasActiveSubscription =
      user.subscription?.status === "ACTIVE" ||
      user.subscription?.status === "TRIALING";

    return {
      success: true,
      data: {
        onboardingCompleted: user.onboardingCompleted,
        onboardingDismissedAt: user.onboardingDismissedAt,
        hasName: !!user.name && user.name.trim().length > 0,
        hasImage: !!user.image,
        hasSubscription: hasActiveSubscription,
      },
    } as const;
  } catch (error) {
    logger.error(
      { err: error, userId: session.user.id },
      "Failed to get onboarding status"
    );
    return { success: false, error: "Failed to get onboarding status" } as const;
  }
}
