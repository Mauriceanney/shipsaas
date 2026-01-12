import { z } from "zod";

/**
 * GDPR Compliance Validation Schemas
 *
 * Validation schemas for GDPR-related actions including
 * data export requests, account deletion, and email preferences.
 */

// Account deletion confirmation schema
export const deleteAccountSchema = z.object({
  confirmation: z
    .string()
    .min(1, "Confirmation is required")
    .refine((val) => val === "DELETE", {
      message: "Please type DELETE to confirm",
    }),
  reason: z
    .string()
    .max(500, "Reason must be 500 characters or less")
    .optional(),
});

export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;

// Email preferences schema
export const emailPreferencesSchema = z.object({
  emailMarketingOptIn: z.boolean().optional(),
  emailProductUpdates: z.boolean().optional(),
  emailSecurityAlerts: z.boolean().optional(),
});

export type EmailPreferencesInput = z.infer<typeof emailPreferencesSchema>;

// Data export request status
export const dataExportStatusSchema = z.enum([
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "EXPIRED",
]);

export type DataExportStatus = z.infer<typeof dataExportStatusSchema>;
