"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user, accountDeletionRequest } from "@/lib/schema";

/**
 * GDPR Article 17 - Right to Erasure
 *
 * Cancel a pending account deletion request within the grace period.
 */

export type CancelDeletionResult =
  | {
      success: true;
    }
  | {
      success: false;
      error: string;
    };

/**
 * Cancel a pending account deletion request
 */
export async function cancelAccountDeletion(): Promise<CancelDeletionResult> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = session.user.id;

  const [request] = await db
    .select({
      id: accountDeletionRequest.id,
      canceledAt: accountDeletionRequest.canceledAt,
    })
    .from(accountDeletionRequest)
    .where(eq(accountDeletionRequest.userId, userId))
    .limit(1);

  if (!request || request.canceledAt) {
    return { success: false, error: "No active deletion request found" };
  }

  // Cancel the deletion request
  await db
    .update(accountDeletionRequest)
    .set({ canceledAt: new Date() })
    .where(eq(accountDeletionRequest.userId, userId));

  // Re-enable the user
  await db
    .update(user)
    .set({ disabled: false })
    .where(eq(user.id, userId));

  // Revalidate settings page
  revalidatePath("/settings/privacy");

  return { success: true };
}
