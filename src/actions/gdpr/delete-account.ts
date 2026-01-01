"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

/**
 * Account Deletion Actions
 *
 * GDPR Article 17 - Right to Erasure
 * Allows users to request deletion of their account with a 30-day grace period.
 */

const DELETION_GRACE_PERIOD_DAYS = 30;

export interface DeleteAccountInput {
  confirmation: string; // Must type "DELETE" to confirm
  reason?: string;
}

export interface DeleteAccountResult {
  success: boolean;
  scheduledFor?: Date;
  error?: string;
}

/**
 * Request account deletion with 30-day grace period
 */
export async function requestAccountDeletion(
  input: DeleteAccountInput
): Promise<DeleteAccountResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  if (input.confirmation !== "DELETE") {
    return { success: false, error: "Please type DELETE to confirm" };
  }

  const userId = session.user.id;

  // Check for existing deletion request
  const existingRequest = await db.accountDeletionRequest.findUnique({
    where: { userId },
  });

  if (existingRequest && !existingRequest.canceledAt) {
    return {
      success: false,
      error: "Account deletion already scheduled",
    };
  }

  // Calculate scheduled deletion date
  const scheduledFor = new Date();
  scheduledFor.setDate(scheduledFor.getDate() + DELETION_GRACE_PERIOD_DAYS);

  // Create or update deletion request
  await db.accountDeletionRequest.upsert({
    where: { userId },
    create: {
      userId,
      reason: input.reason,
      scheduledFor,
    },
    update: {
      reason: input.reason,
      scheduledFor,
      canceledAt: null,
    },
  });

  // Mark user as disabled to prevent further actions
  await db.user.update({
    where: { id: userId },
    data: { disabled: true },
  });

  // Cancel active Stripe subscription if exists
  try {
    const subscription = await db.subscription.findUnique({
      where: { userId },
    });

    if (subscription?.stripeSubscriptionId) {
      // Cancel subscription immediately to stop billing
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);

      // Update subscription status in database
      await db.subscription.update({
        where: { userId },
        data: {
          status: "CANCELED",
          cancelAtPeriodEnd: false,
        },
      });

      console.log(
        `[deleteAccount] Cancelled Stripe subscription ${subscription.stripeSubscriptionId} for user ${userId}`
      );
    }
  } catch (stripeError) {
    // Log error but don't fail the deletion request
    console.error("[deleteAccount] Failed to cancel Stripe subscription:", stripeError);
  }

  // TODO: Send confirmation email

  // Revalidate settings page
  revalidatePath("/settings/account");

  return { success: true, scheduledFor };
}

/**
 * Cancel a pending account deletion request
 */
export async function cancelAccountDeletion(): Promise<{
  success: boolean;
  error?: string;
}> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = session.user.id;

  const request = await db.accountDeletionRequest.findUnique({
    where: { userId },
  });

  if (!request || request.canceledAt) {
    return { success: false, error: "No active deletion request found" };
  }

  // Cancel the deletion request
  await db.accountDeletionRequest.update({
    where: { userId },
    data: { canceledAt: new Date() },
  });

  // Re-enable the user
  await db.user.update({
    where: { id: userId },
    data: { disabled: false },
  });

  // Revalidate settings page
  revalidatePath("/settings/account");

  return { success: true };
}

/**
 * Get account deletion status
 */
export async function getAccountDeletionStatus(): Promise<{
  success: boolean;
  data?: {
    scheduledFor: Date;
    reason: string | null;
    createdAt: Date;
  };
  error?: string;
}> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const request = await db.accountDeletionRequest.findUnique({
    where: { userId: session.user.id },
  });

  if (!request || request.canceledAt) {
    return { success: false, error: "No active deletion request" };
  }

  return {
    success: true,
    data: {
      scheduledFor: request.scheduledFor,
      reason: request.reason,
      createdAt: request.createdAt,
    },
  };
}
