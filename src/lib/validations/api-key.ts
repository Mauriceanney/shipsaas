import { z } from "zod";

/**
 * Validation schema for creating an API key
 */
export const createApiKeySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  environment: z.enum(["live", "test"]).default("live"),
  scopes: z
    .array(z.enum(["read", "write", "admin"]))
    .min(1, "At least one scope is required")
    .default(["read"])
    .refine((scopes) => new Set(scopes).size === scopes.length, {
      message: "Duplicate scopes are not allowed",
    }),
});

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;

/**
 * Validation schema for revoking an API key
 */
export const revokeApiKeySchema = z.object({
  id: z.string().min(1, "ID is required"),
});

export type RevokeApiKeyInput = z.infer<typeof revokeApiKeySchema>;
