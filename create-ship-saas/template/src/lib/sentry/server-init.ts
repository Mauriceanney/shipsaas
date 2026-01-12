/**
 * Server-side Sentry initialization
 * Called from instrumentation.ts at server startup
 */

import * as Sentry from "@sentry/nextjs";
import { sentryConfig, sanitizeData, sanitizeUrl } from "./config";

let isInitialized = false;

/**
 * Initialize Sentry for server-side error tracking
 * This is called once when the Next.js server starts
 */
export function initServerSentry(): void {
  if (isInitialized) {
    return;
  }

  if (!sentryConfig.enabled || !sentryConfig.dsn) {
    return;
  }

  Sentry.init({
    dsn: sentryConfig.dsn,
    environment: sentryConfig.environment,
    ...(sentryConfig.release && { release: sentryConfig.release }),
    tracesSampleRate: sentryConfig.tracesSampleRate,
    profilesSampleRate: sentryConfig.profilesSampleRate,
    beforeSend(event, hint) {
      // Sanitize breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
          if (breadcrumb.data) {
            const sanitized = sanitizeData(
              breadcrumb.data as Record<string, unknown>
            );
            if (sanitized) {
              breadcrumb.data = sanitized;
            }
          }
          return breadcrumb;
        });
      }

      // Sanitize URL
      if (event.request?.url) {
        const sanitizedUrl = sanitizeUrl(event.request.url);
        if (sanitizedUrl) {
          event.request.url = sanitizedUrl;
        }
      }

      // Sanitize query string
      if (event.request?.query_string) {
        if (typeof event.request.query_string === "string") {
          const sanitizedQs = sanitizeUrl(event.request.query_string);
          if (sanitizedQs) {
            event.request.query_string = sanitizedQs;
          }
        } else if (typeof event.request.query_string === "object") {
          const sanitized = sanitizeData(
            event.request.query_string as Record<string, unknown>
          );
          if (sanitized) {
            event.request.query_string = sanitized as Record<string, string>;
          }
        }
      }

      // Sanitize request data
      if (event.request?.data && typeof event.request.data === "object") {
        event.request.data = sanitizeData(
          event.request.data as Record<string, unknown>
        );
      }

      // Filter ignored errors
      const error = hint.originalException;
      if (error instanceof Error) {
        for (const ignorePattern of sentryConfig.ignoreErrors) {
          if (error.message.includes(ignorePattern)) {
            return null;
          }
        }
      }

      return event;
    },
  });

  isInitialized = true;
}
