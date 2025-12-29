"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

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

  // TODO: Send confirmation email
  // TODO: Cancel active subscriptions via Stripe

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
