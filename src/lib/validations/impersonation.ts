/**
 * Impersonation Validation Schemas
 */

import { z } from "zod";

/**
 * Schema for starting impersonation
 */
export const startImpersonationSchema = z.object({
  targetUserId: z.string().min(1, "Target user ID is required"),
  reason: z.string().max(500, "Reason must be 500 characters or less").optional(),
});

export type StartImpersonationInput = z.infer<typeof startImpersonationSchema>;
