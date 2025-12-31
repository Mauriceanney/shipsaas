/**
 * Bulk Actions Validation Schemas
 */

import { z } from "zod";

/**
 * Base schema for bulk user operations
 */
export const bulkUserIdsSchema = z.object({
  userIds: z
    .array(z.string().min(1, "User ID is required"))
    .min(1, "At least one user is required")
    .max(100, "Maximum 100 users per operation"),
});

export type BulkUserIdsInput = z.infer<typeof bulkUserIdsSchema>;

/**
 * Schema for bulk role change
 */
export const bulkChangeRoleSchema = z.object({
  userIds: z
    .array(z.string().min(1))
    .min(1, "At least one user is required")
    .max(100, "Maximum 100 users per operation"),
  role: z.enum(["USER", "ADMIN"], {
    errorMap: () => ({ message: "Role must be USER or ADMIN" }),
  }),
});

export type BulkChangeRoleInput = z.infer<typeof bulkChangeRoleSchema>;

/**
 * Schema for bulk email sending
 */
export const bulkSendEmailSchema = z.object({
  userIds: z
    .array(z.string().min(1))
    .min(1, "At least one user is required")
    .max(100, "Maximum 100 users per operation"),
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(200, "Subject must be 200 characters or less")
    .transform((val) => val.trim()),
  body: z
    .string()
    .min(1, "Message body is required")
    .max(10000, "Message must be 10,000 characters or less"),
});

export type BulkSendEmailInput = z.infer<typeof bulkSendEmailSchema>;

/**
 * Bulk operation result type
 */
export type BulkOperationResult = {
  successCount: number;
  failureCount: number;
  errors: Array<{ userId: string; email: string; reason: string }>;
};
