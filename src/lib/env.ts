import { z } from "zod";

/**
 * Environment Variable Validation
 *
 * Validates environment variables at startup to fail fast on misconfigurations.
 * Uses Zod for type-safe validation with helpful error messages.
 */

// Server-side environment schema
const serverEnvSchema = z.object({
  // Application
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Database
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL URL"),

  // Redis (optional for development)
  REDIS_URL: z.string().url("REDIS_URL must be a valid Redis URL").optional(),
  REDIS_PASSWORD: z.string().optional(),

  // Auth
  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET must be at least 32 characters"),
  AUTH_URL: z.string().url("AUTH_URL must be a valid URL").optional(),
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),
  AUTH_GITHUB_ID: z.string().optional(),
  AUTH_GITHUB_SECRET: z.string().optional(),

  // Stripe
  STRIPE_SECRET_KEY: z
    .string()
    .startsWith("sk_", "STRIPE_SECRET_KEY must start with 'sk_'"),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .startsWith("whsec_", "STRIPE_WEBHOOK_SECRET must start with 'whsec_'")
    .optional(),
  STRIPE_PRICE_ID_PRO_MONTHLY: z.string().optional(),
  STRIPE_PRICE_ID_PRO_YEARLY: z.string().optional(),
  STRIPE_PRICE_ID_ENTERPRISE_MONTHLY: z.string().optional(),
  STRIPE_PRICE_ID_ENTERPRISE_YEARLY: z.string().optional(),

  // Email (optional for development)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email("EMAIL_FROM must be a valid email").optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z
    .string()
    .regex(/^\d+$/, "SMTP_PORT must be a number")
    .optional(),
});

// Client-side environment schema (NEXT_PUBLIC_* variables)
const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url("NEXT_PUBLIC_APP_URL must be a valid URL"),
  NEXT_PUBLIC_APP_NAME: z.string().default("ShipSaaS"),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z
    .string()
    .startsWith("pk_", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must start with 'pk_'")
    .optional(),
});

// Combined schema
const envSchema = serverEnvSchema.merge(clientEnvSchema);

export type Env = z.infer<typeof envSchema>;

/**
 * Validates environment variables and provides detailed error reporting.
 * In production, throws on invalid config. In development, warns but continues.
 */
function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.errors
      .map((err) => `  - ${err.path.join(".")}: ${err.message}`)
      .join("\n");

    const errorMessage = `Invalid environment variables:\n${errors}`;

    // Always throw in test environment to catch config issues
    if (process.env.NODE_ENV === "test") {
      throw new Error(errorMessage);
    }

    console.error("\n===========================================");
    console.error("Environment Variable Validation Failed");
    console.error("===========================================\n");
    console.error(
      "The following environment variables are missing or invalid:\n"
    );
    console.error(errors);
    console.error("\n===========================================\n");

    // In production, fail fast
    if (process.env.NODE_ENV === "production") {
      throw new Error(errorMessage);
    }

    // In development, warn but continue with defaults
    console.warn("Continuing with fallback values in development mode...\n");
  }

  return result.data as Env;
}

// Singleton pattern - validate once at module load
export const env = validateEnv();

/**
 * Type-safe environment variable accessor
 */
export function getEnv<K extends keyof Env>(key: K): Env[K] {
  return env[key];
}
