"use server";

/**
 * Admin Impersonation Server Actions
 * Allows admins to temporarily view the application as another user
 */

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  calculateExpiresAt,
  clearImpersonationCookie,
  getImpersonationSession,
  setImpersonationCookie,
} from "@/lib/impersonation";
import { logger } from "@/lib/logger";
import { startImpersonationSchema } from "@/lib/validations/impersonation";

import type { StartImpersonationInput } from "@/lib/validations/impersonation";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Start impersonating a user
 * Only accessible by admin users
 */
export async function startImpersonation(
  input: StartImpersonationInput
): Promise<ActionResult<{ redirectUrl: string }>> {
  // 1. Authentication check
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  // 2. Authorization check - must be admin
  if (session.user.role !== "ADMIN") {
    return { success: false, error: "Forbidden" };
  }

  // 3. Validation
  const parsed = startImpersonationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Invalid input",
    };
  }

  const { targetUserId, reason } = parsed.data;

  // 4. Cannot impersonate yourself
  if (targetUserId === session.user.id) {
    return { success: false, error: "Cannot impersonate yourself" };
  }

  try {
    // 5. Get target user
    const targetUser = await db.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        disabled: true,
      },
    });

    if (!targetUser) {
      return { success: false, error: "User not found" };
    }

    // 6. Cannot impersonate admin users
    if (targetUser.role === "ADMIN") {
      return { success: false, error: "Cannot impersonate admin users" };
    }

    // 7. Cannot impersonate disabled users
    if (targetUser.disabled) {
      return { success: false, error: "Cannot impersonate disabled users" };
    }

    // 8. Get request metadata
    const headersList = await headers();
    const ipAddress = headersList.get("x-forwarded-for") ?? null;
    const userAgent = headersList.get("user-agent") ?? null;

    // 9. Calculate expiration (1 hour)
    const expiresAt = calculateExpiresAt();

    // 10. Create impersonation log
    const impersonationLog = await db.impersonationLog.create({
      data: {
        adminId: session.user.id,
        targetUserId,
        reason,
        ipAddress,
        userAgent,
        expiresAt,
      },
    });

    // 11. Set impersonation cookie
    await setImpersonationCookie({
      originalAdminId: session.user.id,
      originalAdminEmail: session.user.email ?? "",
      targetUserId,
      impersonationLogId: impersonationLog.id,
      expiresAt: expiresAt.toISOString(),
    });

    // 12. Revalidate affected paths
    revalidatePath("/admin/users");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: { redirectUrl: "/dashboard" },
    };
  } catch (error) {
    logger.error(
      { err: error, userId: session?.user?.id },
      "startImpersonation error"
    );
    return { success: false, error: "Failed to start impersonation" };
  }
}

/**
 * End impersonation session
 */
export async function endImpersonation(): Promise<ActionResult<{ redirectUrl: string }>> {
  try {
    // 1. Get current impersonation session
    const impersonationSession = await getImpersonationSession();

    if (!impersonationSession) {
      return { success: false, error: "Not currently impersonating" };
    }

    // 2. Update impersonation log with end time
    await db.impersonationLog.update({
      where: { id: impersonationSession.impersonationLogId },
      data: { endedAt: new Date() },
    });

    // 3. Clear the impersonation cookie
    await clearImpersonationCookie();

    // 4. Revalidate affected paths
    revalidatePath("/admin/users");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: { redirectUrl: "/admin/users" },
    };
  } catch (error) {
    logger.error(
      { err: error, userId: session?.user?.id },
      "endImpersonation error"
    );
    return { success: false, error: "Failed to end impersonation" };
  }
}

/**
 * Get current impersonation status
 */
export async function getImpersonationStatus(): Promise<
  ActionResult<{
    isImpersonating: boolean;
    impersonation: {
      originalAdminEmail: string;
      targetUserEmail: string;
      targetUserName: string | null;
      expiresAt: string;
    } | null;
  }>
> {
  try {
    const impersonationSession = await getImpersonationSession();

    if (!impersonationSession) {
      return {
        success: true,
        data: {
          isImpersonating: false,
          impersonation: null,
        },
      };
    }

    // Get target user details
    const targetUser = await db.user.findUnique({
      where: { id: impersonationSession.targetUserId },
      select: { email: true, name: true },
    });

    return {
      success: true,
      data: {
        isImpersonating: true,
        impersonation: {
          originalAdminEmail: impersonationSession.originalAdminEmail,
          targetUserEmail: targetUser?.email ?? "",
          targetUserName: targetUser?.name ?? null,
          expiresAt: impersonationSession.expiresAt,
        },
      },
    };
  } catch (error) {
    logger.error(
      { err: error, userId: session?.user?.id },
      "getImpersonationStatus error"
    );
    return {
      success: true,
      data: {
        isImpersonating: false,
        impersonation: null,
      },
    };
  }
}
