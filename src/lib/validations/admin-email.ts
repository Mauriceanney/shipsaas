import { z } from "zod";

/**
 * Schema for sending email to a specific user
 */
export const sendEmailToUserSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(200, "Subject must not exceed 200 characters")
    .transform((val) => val.trim()),
  body: z
    .string()
    .min(1, "Message body is required")
    .max(10000, "Message must not exceed 10000 characters"),
});

// Type exports
export type SendEmailToUserInput = z.infer<typeof sendEmailToUserSchema>;
