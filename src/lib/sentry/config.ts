/**
 * Sentry configuration
 * Error monitoring and performance tracking settings
 */

export const sentryConfig = {
  dsn: process.env["NEXT_PUBLIC_SENTRY_DSN"],
  environment:
    process.env["NEXT_PUBLIC_SENTRY_ENVIRONMENT"] || "development",
  enabled:
    process.env.NODE_ENV === "production" &&
    !!process.env["NEXT_PUBLIC_SENTRY_DSN"],
  // Disable tracing and replays by default to minimize costs
  // Enable in production if needed
  tracesSampleRate: 0,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
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
