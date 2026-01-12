/**
 * Server-side Sentry utilities
 * For manual error capture and context in server components/actions
 *
 * Alert Rules (configure in Sentry Dashboard):
 * - Error Spike Detection: Alert when error count exceeds 10x baseline in 5 minutes
 * - New Issue Alert: Alert on first occurrence of new error types
 * - Performance Degradation: Alert when p95 latency exceeds 2s for 5+ minutes
 * - Error Rate Threshold: Alert when error rate exceeds 1% of requests
 */

import * as Sentry from "@sentry/nextjs";
import { getRequestContext } from "@/lib/request-context";
import { sanitizeData, sentryConfig } from "./config";

/**
 * Session type for Sentry - matches Better Auth session structure
 */
type SentrySession = {
  user?: {
    id: string;
    email?: string | null;
  } | null;
} | null;

/**
 * Capture exception on server
 * Use this in try-catch blocks where you want to report errors to Sentry
 * Automatically includes request ID from the current request context
 */
export function captureException(
  error: Error | unknown,
  context?: Record<string, unknown>
): void {
  if (!sentryConfig.enabled) {
    return;
  }

  // Get request context for correlation
  const requestContext = getRequestContext();

  Sentry.withScope((scope) => {
    // Add request ID for correlation with logs
    if (requestContext?.requestId) {
      scope.setTag("requestId", requestContext.requestId);
      scope.setContext("request", {
        requestId: requestContext.requestId,
        path: requestContext.path,
        method: requestContext.method,
        duration: requestContext.startTime
          ? `${Date.now() - requestContext.startTime}ms`
          : undefined,
      });
    }

    // Add any additional context
    if (context) {
      scope.setContext("additional", sanitizeData(context) ?? {});
    }

    Sentry.captureException(error);
  });
}

/**
 * Mask email for privacy (GDPR compliance)
 * Only keeps first 2 chars and domain
 */
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "[MASKED]";
  const maskedLocal = local.slice(0, 2) + "***";
  return `${maskedLocal}@${domain}`;
}

/**
 * Set user context for Sentry
 * Call this after authentication to associate errors with users
 * Note: Email is masked for GDPR compliance
 */
export function setUserContext(session: SentrySession): void {
  if (!sentryConfig.enabled) {
    return;
  }

  if (session?.user?.id) {
    const userContext: { id: string; email?: string } = {
      id: session.user.id,
    };
    if (session.user.email) {
      userContext.email = maskEmail(session.user.email);
    }
    Sentry.setUser(userContext);
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb for debugging
 * Data is automatically sanitized to prevent sensitive data leakage
 */
export function addBreadcrumb(
  message: string,
  data?: Record<string, unknown>
): void {
  if (!sentryConfig.enabled) {
    return;
  }

  const breadcrumb: { message: string; level: "info"; data?: Record<string, unknown> } = {
    message,
    level: "info",
  };
  const sanitized = sanitizeData(data);
  if (sanitized) {
    breadcrumb.data = sanitized;
  }
  Sentry.addBreadcrumb(breadcrumb);
}

/**
 * Set context for the current scope
 * Context is automatically sanitized to prevent sensitive data leakage
 */
export function setContext(
  key: string,
  context: Record<string, unknown>
): void {
  if (!sentryConfig.enabled) {
    return;
  }

  Sentry.setContext(key, sanitizeData(context) ?? {});
}

/**
 * Get Sentry instance for advanced usage
 */
export function getSentry(): typeof Sentry {
  return Sentry;
}
