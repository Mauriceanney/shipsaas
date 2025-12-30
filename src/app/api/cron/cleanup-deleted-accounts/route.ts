import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";

/**
 * Cron job to permanently delete accounts after grace period expires.
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
      console.warn("[cron/cleanup] Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find all deletion requests that have passed their scheduled date
    const expiredRequests = await db.accountDeletionRequest.findMany({
      where: {
        scheduledFor: { lte: new Date() },
        canceledAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (expiredRequests.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No accounts to delete",
        deletedCount: 0,
      });
    }

    const deletedUsers: string[] = [];
    const errors: { userId: string; error: string }[] = [];

    for (const request of expiredRequests) {
      try {
        // Permanently delete user and all related data (cascade)
        await db.user.delete({
          where: { id: request.userId },
        });

        deletedUsers.push(request.userId);

        console.log(
          `[cron/cleanup] Permanently deleted user ${request.userId} (${request.user.email})`
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        errors.push({ userId: request.userId, error: errorMessage });

        console.error(
          `[cron/cleanup] Failed to delete user ${request.userId}:`,
          error
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${expiredRequests.length} deletion requests`,
      deletedCount: deletedUsers.length,
      deletedUsers,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("[cron/cleanup] Critical error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
