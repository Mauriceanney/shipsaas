/**
 * Audit logging for configuration changes
 */

import { db } from "@/lib/db";

import type { Prisma } from "@prisma/client";

interface AuditLogParams {
  entityType: "PlanConfig" | "AppConfig" | "User" | "PromotionCode";
  entityId: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  changes: Record<string, { old: unknown; new: unknown }>;
  userId: string;
  userEmail: string;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(params: AuditLogParams) {
  return db.configAuditLog.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      changes: params.changes as Prisma.InputJsonValue,
      userId: params.userId,
      userEmail: params.userEmail,
    },
  });
}

/**
 * Get audit logs for an entity
 */
export async function getAuditLogs(
  entityType?: string,
  entityId?: string,
  limit = 50
) {
  return db.configAuditLog.findMany({
    where: {
      ...(entityType && { entityType }),
      ...(entityId && { entityId }),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Get recent audit logs
 */
export async function getRecentAuditLogs(limit = 20) {
  return db.configAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Helper to compute changes between old and new objects
 */
export function computeChanges<T extends Record<string, unknown>>(
  oldObj: T | null,
  newObj: T,
  fieldsToTrack: (keyof T)[]
): Record<string, { old: unknown; new: unknown }> {
  const changes: Record<string, { old: unknown; new: unknown }> = {};

  for (const field of fieldsToTrack) {
    const oldValue = oldObj?.[field];
    const newValue = newObj[field];

    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes[field as string] = { old: oldValue, new: newValue };
    }
  }

  return changes;
}
