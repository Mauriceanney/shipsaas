import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name is too long"),
  email: z
    .string()
    .email("Please enter a valid email address")
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
