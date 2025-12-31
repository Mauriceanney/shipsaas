/**
 * Server-side Sentry utilities
 * For manual error capture and context in server components/actions
 */

import * as Sentry from "@sentry/nextjs";

import { sanitizeData, sentryConfig } from "./config";

import type { Session } from "next-auth";

/**
 * Capture exception on server
 * Use this in try-catch blocks where you want to report errors to Sentry
 */
export function captureException(error: Error | unknown): void {
  if (!sentryConfig.enabled) {
    return;
  }

  Sentry.captureException(error);
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
export function setUserContext(session: Session | null): void {
  if (!sentryConfig.enabled) {
    return;
  }

  if (session?.user?.id) {
    Sentry.setUser({
      id: session.user.id,
      // Mask email for privacy (GDPR)
      email: session.user.email ? maskEmail(session.user.email) : undefined,
    });
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

  Sentry.addBreadcrumb({
    message,
    data: sanitizeData(data),
    level: "info",
  });
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
