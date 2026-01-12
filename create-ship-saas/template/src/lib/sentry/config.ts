/**
 * Sentry configuration
 * Error monitoring and performance tracking settings
 *
 * Sample Rate Guidelines:
 * - Errors: 100% capture (not sampled) - all errors are always captured
 * - Traces: 10% production / 100% development - balance cost vs visibility
 * - Profiles: 10% production / 100% development - CPU profiling overhead
 * - Session Replays: 10% all environments - high storage cost
 * - Error Replays: 100% - always record session on error for debugging
 *
 * Cost Optimization:
 * - Reduce replaysSessionSampleRate to 0.01 (1%) if costs are high
 * - Adjust traces via NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE env var
 */

const hasDsn = !!process.env["NEXT_PUBLIC_SENTRY_DSN"];
const isProduction = process.env.NODE_ENV === "production";
const isDevelopment = process.env.NODE_ENV === "development";
// NEXT_PUBLIC_ prefix required for client-side access
const isDebugMode = process.env["NEXT_PUBLIC_SENTRY_DEBUG"] === "true";
const shouldEnable = (isProduction || isDebugMode) && hasDsn;

/**
 * Parse sample rate from environment variable with fallback
 */
function parseSampleRate(
  envVar: string | undefined,
  defaultValue: number
): number {
  if (!envVar) return defaultValue;
  const parsed = parseFloat(envVar);
  if (isNaN(parsed) || parsed < 0 || parsed > 1) return defaultValue;
  return parsed;
}

/**
 * Get sample rates based on environment
 * Development: Higher rates for testing (1.0 = 100%)
 * Production: Lower rates to control costs (0.1 = 10%)
 */
function getSampleRates() {
  // Development defaults to 100% sampling for testing
  const defaultTracesRate = isDevelopment ? 1.0 : 0.1;
  const defaultProfilesRate = isDevelopment ? 1.0 : 0.1;
  const defaultReplaysSessionRate = isDevelopment ? 0.1 : 0.1;
  const defaultReplaysErrorRate = isDevelopment ? 1.0 : 1.0;

  return {
    traces: parseSampleRate(
      process.env["NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE"],
      defaultTracesRate
    ),
    profiles: parseSampleRate(
      process.env["NEXT_PUBLIC_SENTRY_PROFILES_SAMPLE_RATE"],
      defaultProfilesRate
    ),
    replaysSession: parseSampleRate(
      process.env["NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE"],
      defaultReplaysSessionRate
    ),
    replaysError: parseSampleRate(
      process.env["NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE"],
      defaultReplaysErrorRate
    ),
  };
}

const sampleRates = getSampleRates();

/**
 * Get release identifier for tracking deployments
 * Priority: NEXT_PUBLIC_APP_VERSION > VERCEL_GIT_COMMIT_SHA > "local"
 */
function getRelease(): string | undefined {
  // Explicit version from environment (Docker, manual deploys)
  if (process.env["NEXT_PUBLIC_APP_VERSION"]) {
    return process.env["NEXT_PUBLIC_APP_VERSION"];
  }

  // Vercel automatic git SHA
  if (process.env["VERCEL_GIT_COMMIT_SHA"]) {
    return process.env["VERCEL_GIT_COMMIT_SHA"];
  }

  // Development/local - don't track releases
  if (isDevelopment) {
    return undefined;
  }

  return "unknown";
}

export const sentryConfig = {
  dsn: process.env["NEXT_PUBLIC_SENTRY_DSN"],
  environment:
    process.env["NEXT_PUBLIC_SENTRY_ENVIRONMENT"] || "development",
  // Enable in production OR when SENTRY_DEBUG=true for testing
  enabled: shouldEnable,
  // Release tracking for deployment monitoring
  release: getRelease(),
  // Performance monitoring sample rates (environment-based)
  tracesSampleRate: sampleRates.traces,
  profilesSampleRate: sampleRates.profiles,
  replaysSessionSampleRate: sampleRates.replaysSession,
  replaysOnErrorSampleRate: sampleRates.replaysError,
  // Ignore common Next.js errors that are not actionable
  ignoreErrors: [
    "NEXT_REDIRECT",
    "NEXT_NOT_FOUND",
    "Network request failed",
    "NetworkError",
    "Failed to fetch",
    // Ignore browser extension errors
    "chrome-extension://",
    "moz-extension://",
  ],
} as const;

/**
 * Check if Sentry is enabled
 */
export function isSentryEnabled(): boolean {
  return sentryConfig.enabled;
}

/**
 * Sensitive field patterns to redact from Sentry events
 */
const SENSITIVE_FIELDS = [
  "password",
  "token",
  "secret",
  "apiKey",
  "api_key",
  "authorization",
  "cookie",
  "creditCard",
  "credit_card",
  "ssn",
  "cvv",
];

/**
 * Sanitize an object by redacting sensitive fields
 */
export function sanitizeData(
  data: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (!data || typeof data !== "object") return data;

  const sanitized = { ...data };

  for (const key of Object.keys(sanitized)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_FIELDS.some((field) => lowerKey.includes(field))) {
      sanitized[key] = "[REDACTED]";
    }
  }

  return sanitized;
}

/**
 * Sanitize URL by removing sensitive query parameters
 */
export function sanitizeUrl(url: string | undefined): string | undefined {
  if (!url) return url;

  let sanitized = url;
  for (const param of SENSITIVE_FIELDS) {
    const regex = new RegExp(`([?&])${param}=[^&]*`, "gi");
    sanitized = sanitized.replace(regex, `$1${param}=[REDACTED]`);
  }

  return sanitized;
}
