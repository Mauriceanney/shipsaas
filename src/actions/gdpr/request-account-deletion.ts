"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user, subscription, accountDeletionRequest } from "@/lib/schema";
import { deleteAccountSchema, type DeleteAccountInput } from "@/lib/validations/gdpr";

/**
 * GDPR Article 17 - Right to Erasure
 *
 * Server actions for requesting account deletion with a 30-day grace period.
 * Users can cancel the deletion within this period.
 */

const DELETION_GRACE_PERIOD_DAYS = 30;

export type RequestAccountDeletionResult =
  | {
      success: true;
      scheduledFor: Date;
    }
  | {
      success: false;
      error: string;
    };

export type AccountDeletionStatusResult =
  | {
      success: true;
      data: {
        scheduledFor: Date;
        reason: string | null;
        createdAt: Date;
      };
    }
  | {
      success: false;
      error: string;
    };

/**
 * Request account deletion with 30-day grace period
 */
export async function requestAccountDeletion(
  input: DeleteAccountInput
): Promise<RequestAccountDeletionResult> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  // Validate input
  const parsed = deleteAccountSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const userId = session.user.id;

  // Check for existing deletion request
  const [existingRequest] = await db
    .select({
      id: accountDeletionRequest.id,
      canceledAt: accountDeletionRequest.canceledAt,
    })
    .from(accountDeletionRequest)
    .where(eq(accountDeletionRequest.userId, userId))
    .limit(1);

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
  if (existingRequest) {
    await db
      .update(accountDeletionRequest)
      .set({
        reason: parsed.data.reason ?? null,
        scheduledFor,
        canceledAt: null,
      })
      .where(eq(accountDeletionRequest.userId, userId));
  } else {
    await db.insert(accountDeletionRequest).values({
      id: createId(),
      userId,
      reason: parsed.data.reason ?? null,
      scheduledFor,
    });
  }

  // Mark user as disabled to prevent further actions
  await db
    .update(user)
    .set({ disabled: true })
    .where(eq(user.id, userId));

  // Cancel active Stripe subscription if exists
  try {
    const [userSubscription] = await db
      .select({
        stripeSubscriptionId: subscription.stripeSubscriptionId,
      })
      .from(subscription)
      .where(eq(subscription.userId, userId))
      .limit(1);

    if (userSubscription?.stripeSubscriptionId) {
      // Import Stripe lazily to avoid issues if not configured
      try {
        const { stripe } = await import("@/lib/stripe/client");

        // Cancel subscription immediately to stop billing
        await stripe.subscriptions.cancel(userSubscription.stripeSubscriptionId);

        // Update subscription status in database
        await db
          .update(subscription)
          .set({
            status: "CANCELED",
            cancelAtPeriodEnd: false,
          })
          .where(eq(subscription.userId, userId));

        console.log(
          `[requestAccountDeletion] Cancelled Stripe subscription for user ${userId}`
        );
      } catch (stripeImportError) {
        // Stripe not configured, skip cancellation
        console.warn(
          "[requestAccountDeletion] Stripe not configured, skipping subscription cancellation"
        );
      }
    }
  } catch (stripeError) {
    // Log error but don't fail the deletion request
    console.error(
      "[requestAccountDeletion] Failed to cancel Stripe subscription:",
      stripeError
    );
  }

  // Revalidate settings page
  revalidatePath("/settings/privacy");

  return { success: true, scheduledFor };
}

/**
 * Get account deletion status
 */
export async function getAccountDeletionStatus(): Promise<AccountDeletionStatusResult> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const [request] = await db
    .select({
      scheduledFor: accountDeletionRequest.scheduledFor,
      reason: accountDeletionRequest.reason,
      createdAt: accountDeletionRequest.createdAt,
      canceledAt: accountDeletionRequest.canceledAt,
    })
    .from(accountDeletionRequest)
    .where(eq(accountDeletionRequest.userId, session.user.id))
    .limit(1);

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
