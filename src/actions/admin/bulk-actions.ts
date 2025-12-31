"use server";

/**
 * Admin Bulk Actions
 * Server actions for performing operations on multiple users at once
 */

import { auth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { sendAdminMessage } from "@/lib/email";
import {
  bulkChangeRoleSchema,
  bulkSendEmailSchema,
  bulkUserIdsSchema,
} from "@/lib/validations/bulk-actions";

import type { BulkOperationResult } from "@/lib/validations/bulk-actions";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Bulk disable user accounts
 * Security: Cannot disable admins or self
 */
export async function bulkDisableUsers(
  input: unknown
): Promise<ActionResult<BulkOperationResult>> {
  // 1. Authentication
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  // 2. Authorization - must be admin
  if (session.user.role !== "ADMIN") {
    return { success: false, error: "Forbidden" };
  }

  // 3. Validation
  const parsed = bulkUserIdsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Invalid input",
    };
  }

  // 4. Filter out current admin
  const userIds = parsed.data.userIds.filter((id) => id !== session.user.id);

  if (userIds.length === 0) {
    return {
      success: true,
      data: { successCount: 0, failureCount: 0, errors: [] },
    };
  }

  try {
    // 5. Get users (excluding admins)
    const users = await db.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: { id: true, email: true, role: true, disabled: true },
    });

    // 6. Filter to only non-admin, non-disabled users
    const usersToDisable = users.filter(
      (user) => user.role !== "ADMIN" && !user.disabled
    );

    const result: BulkOperationResult = {
      successCount: 0,
      failureCount: 0,
      errors: [],
    };

    // 7. Process in transaction
    await db.$transaction(async (tx) => {
      for (const user of usersToDisable) {
        try {
          await tx.user.update({
            where: { id: user.id },
            data: { disabled: true },
          });

          await createAuditLog({
            entityType: "User",
            entityId: user.id,
            action: "UPDATE",
            changes: { disabled: { old: false, new: true } },
            userId: session.user.id,
            userEmail: session.user.email ?? "",
          });

          result.successCount++;
        } catch (error) {
          result.failureCount++;
          result.errors.push({
            userId: user.id,
            email: user.email,
            reason: "Failed to disable user",
          });
        }
      }
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("[bulkDisableUsers]", error);
    return { success: false, error: "Failed to disable users" };
  }
}

/**
 * Bulk enable user accounts
 * Security: Cannot enable admins (they should never be disabled)
 */
export async function bulkEnableUsers(
  input: unknown
): Promise<ActionResult<BulkOperationResult>> {
  // 1. Authentication
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  // 2. Authorization - must be admin
  if (session.user.role !== "ADMIN") {
    return { success: false, error: "Forbidden" };
  }

  // 3. Validation
  const parsed = bulkUserIdsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Invalid input",
    };
  }

  const userIds = parsed.data.userIds.filter((id) => id !== session.user.id);

  if (userIds.length === 0) {
    return {
      success: true,
      data: { successCount: 0, failureCount: 0, errors: [] },
    };
  }

  try {
    // 4. Get users (excluding admins)
    const users = await db.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: { id: true, email: true, role: true, disabled: true },
    });

    // 5. Filter to only non-admin, disabled users
    const usersToEnable = users.filter(
      (user) => user.role !== "ADMIN" && user.disabled
    );

    const result: BulkOperationResult = {
      successCount: 0,
      failureCount: 0,
      errors: [],
    };

    // 6. Process in transaction
    await db.$transaction(async (tx) => {
      for (const user of usersToEnable) {
        try {
          await tx.user.update({
            where: { id: user.id },
            data: { disabled: false },
          });

          await createAuditLog({
            entityType: "User",
            entityId: user.id,
            action: "UPDATE",
            changes: { disabled: { old: true, new: false } },
            userId: session.user.id,
            userEmail: session.user.email ?? "",
          });

          result.successCount++;
        } catch (error) {
          result.failureCount++;
          result.errors.push({
            userId: user.id,
            email: user.email,
            reason: "Failed to enable user",
          });
        }
      }
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("[bulkEnableUsers]", error);
    return { success: false, error: "Failed to enable users" };
  }
}

/**
 * Bulk change user roles
 * Security: Cannot change admin roles, cannot change own role
 */
export async function bulkChangeUserRole(
  input: unknown
): Promise<ActionResult<BulkOperationResult>> {
  // 1. Authentication
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  // 2. Authorization - must be admin
  if (session.user.role !== "ADMIN") {
    return { success: false, error: "Forbidden" };
  }

  // 3. Validation
  const parsed = bulkChangeRoleSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Invalid input",
    };
  }

  const { role } = parsed.data;
  const userIds = parsed.data.userIds.filter((id) => id !== session.user.id);

  if (userIds.length === 0) {
    return {
      success: true,
      data: { successCount: 0, failureCount: 0, errors: [] },
    };
  }

  try {
    // 4. Get users
    const users = await db.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: { id: true, email: true, role: true, disabled: true },
    });

    // 5. Filter out users already with target role
    const usersToChange = users.filter((user) => user.role !== role);

    const result: BulkOperationResult = {
      successCount: 0,
      failureCount: 0,
      errors: [],
    };

    // 6. Process in transaction
    await db.$transaction(async (tx) => {
      for (const user of usersToChange) {
        try {
          await tx.user.update({
            where: { id: user.id },
            data: { role },
          });

          await createAuditLog({
            entityType: "User",
            entityId: user.id,
            action: "UPDATE",
            changes: { role: { old: user.role, new: role } },
            userId: session.user.id,
            userEmail: session.user.email ?? "",
          });

          result.successCount++;
        } catch (error) {
          result.failureCount++;
          result.errors.push({
            userId: user.id,
            email: user.email,
            reason: "Failed to change role",
          });
        }
      }
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("[bulkChangeUserRole]", error);
    return { success: false, error: "Failed to change user roles" };
  }
}

/**
 * Bulk send emails to users
 * Security: Cannot email disabled users
 */
export async function bulkSendEmail(
  input: unknown
): Promise<ActionResult<BulkOperationResult>> {
  // 1. Authentication
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  // 2. Authorization - must be admin
  if (session.user.role !== "ADMIN") {
    return { success: false, error: "Forbidden" };
  }

  // 3. Validation
  const parsed = bulkSendEmailSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Invalid input",
    };
  }

  const { subject, body, userIds } = parsed.data;

  try {
    // 4. Get users (non-disabled only)
    const users = await db.user.findMany({
      where: {
        id: { in: userIds },
        disabled: false,
      },
      select: { id: true, email: true, name: true, role: true, disabled: true },
    });

    const result: BulkOperationResult = {
      successCount: 0,
      failureCount: 0,
      errors: [],
    };

    // 5. Send emails (not in transaction as emails are external)
    for (const user of users) {
      try {
        const emailResult = await sendAdminMessage({
          to: user.email,
          recipientName: user.name ?? undefined,
          subject,
          body,
        });

        if (emailResult.success) {
          await createAuditLog({
            entityType: "User",
            entityId: user.id,
            action: "EMAIL_SENT",
            changes: { subject, body: body.substring(0, 100) + "..." },
            userId: session.user.id,
            userEmail: session.user.email ?? "",
          });
          result.successCount++;
        } else {
          result.failureCount++;
          result.errors.push({
            userId: user.id,
            email: user.email,
            reason: emailResult.error ?? "Failed to send email",
          });
        }
      } catch (error) {
        result.failureCount++;
        result.errors.push({
          userId: user.id,
          email: user.email,
          reason: "Failed to send email",
        });
      }
    }

    return { success: true, data: result };
  } catch (error) {
    console.error("[bulkSendEmail]", error);
    return { success: false, error: "Failed to send emails" };
  }
}
