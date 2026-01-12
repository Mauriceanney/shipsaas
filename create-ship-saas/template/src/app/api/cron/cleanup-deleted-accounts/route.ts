import { NextRequest, NextResponse } from "next/server";
import { eq, lt, isNull, and } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  user,
  account,
  session,
  userSession,
  loginHistory,
  trustedDevice,
  subscription,
  dataExportRequest,
  accountDeletionRequest,
} from "@/lib/schema";

/**
 * Cron Job: Cleanup Deleted Accounts
 *
 * This endpoint should be called by a cron job (e.g., daily) to:
 * 1. Find accounts scheduled for deletion that have passed their grace period
 * 2. Permanently delete user data
 *
 * Security: Requires CRON_SECRET header for authentication
 */

export async function GET(request: NextRequest) {
  // Verify cron secret
  const cronSecret = request.headers.get("x-cron-secret");
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // Find accounts scheduled for deletion that have passed their grace period
    const accountsToDelete = await db
      .select({
        userId: accountDeletionRequest.userId,
        scheduledFor: accountDeletionRequest.scheduledFor,
      })
      .from(accountDeletionRequest)
      .where(
        and(
          lt(accountDeletionRequest.scheduledFor, now),
          isNull(accountDeletionRequest.canceledAt)
        )
      );

    const deletedUserIds: string[] = [];
    const errors: Array<{ userId: string; error: string }> = [];

    for (const request of accountsToDelete) {
      try {
        // Delete all user data in order (respecting foreign key constraints)
        // Note: Most tables have ON DELETE CASCADE, but we explicitly delete for clarity

        // Delete login history
        await db
          .delete(loginHistory)
          .where(eq(loginHistory.userId, request.userId));

        // Delete trusted devices
        await db
          .delete(trustedDevice)
          .where(eq(trustedDevice.userId, request.userId));

        // Delete user sessions
        await db
          .delete(userSession)
          .where(eq(userSession.userId, request.userId));

        // Delete Better Auth sessions
        await db
          .delete(session)
          .where(eq(session.userId, request.userId));

        // Delete accounts (OAuth providers)
        await db
          .delete(account)
          .where(eq(account.userId, request.userId));

        // Delete data export requests
        await db
          .delete(dataExportRequest)
          .where(eq(dataExportRequest.userId, request.userId));

        // Delete subscription (if exists)
        await db
          .delete(subscription)
          .where(eq(subscription.userId, request.userId));

        // Delete account deletion request
        await db
          .delete(accountDeletionRequest)
          .where(eq(accountDeletionRequest.userId, request.userId));

        // Finally, delete the user
        await db
          .delete(user)
          .where(eq(user.id, request.userId));

        deletedUserIds.push(request.userId);
        console.log(`[cleanup-deleted-accounts] Deleted user ${request.userId}`);
      } catch (error) {
        console.error(
          `[cleanup-deleted-accounts] Failed to delete user ${request.userId}:`,
          error
        );
        errors.push({
          userId: request.userId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: accountsToDelete.length,
      deleted: deletedUserIds.length,
      deletedUserIds,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("[cleanup-deleted-accounts] Error:", error);
    return NextResponse.json(
      { error: "Failed to process deleted accounts" },
      { status: 500 }
    );
  }
}
