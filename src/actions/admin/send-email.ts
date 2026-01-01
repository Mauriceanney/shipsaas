"use server";

import { revalidatePath } from "next/cache";

import { createAuditLog } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendAdminMessage } from "@/lib/email";
import { logger } from "@/lib/logger";
import { sendEmailToUserSchema } from "@/lib/validations/admin-email";
/**
 * Send an email to a specific user (admin only)
 */
export async function sendEmailToUser(input: unknown) {
  // 1. Authentication
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" } as const;
  }

  // 2. Authorization - verify admin role
  const adminUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (adminUser?.role !== "ADMIN") {
    return { success: false, error: "Forbidden" } as const;
  }

  // 3. Validation
  const parsed = sendEmailToUserSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Invalid input",
    } as const;
  }

  const { userId, subject, body } = parsed.data;

  try {
    // 4. Get target user
    const targetUser = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, disabled: true },
    });

    if (!targetUser) {
      return { success: false, error: "User not found" } as const;
    }

    if (targetUser.disabled) {
      return { success: false, error: "Cannot send email to disabled user" } as const;
    }

    // 5. Send email
    const emailResult = await sendAdminMessage(targetUser.email, {
      recipientName: targetUser.name ?? undefined,
      subject,
      body,
      adminName: session.user.email ?? "Admin",
    });

    if (!emailResult.success) {
      return { success: false, error: "Failed to send email" } as const;
    }

    // 6. Create audit log
    await createAuditLog({
      entityType: "User",
      entityId: userId,
      action: "UPDATE",
      changes: {
        adminEmailSent: {
          old: null,
          new: {
            subject,
            sentBy: session.user.email,
            sentAt: new Date().toISOString(),
          },
        },
      },
      userId: session.user.id,
      userEmail: session.user.email ?? "unknown",
    });

    // 7. Revalidate admin user page
    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);

    return { success: true } as const;
  } catch (error) {
    logger.error(
      { err: error, userId: session?.user?.id },
      "sendEmailToUser error"
    );
    return { success: false, error: "Failed to send email" } as const;
  }
}
