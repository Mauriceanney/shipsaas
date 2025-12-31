/**
 * Next.js 15 instrumentation hook
 * Runs once when the server starts (before any requests)
 * Used for Sentry server-side initialization
 */

import * as Sentry from "@sentry/nextjs";

import { sanitizeData, sanitizeUrl, sentryConfig } from "@/lib/sentry/config";

export async function register() {
  // Only run on server (not in middleware/edge)
  if (process.env["NEXT_RUNTIME"] === "nodejs") {
    if (!sentryConfig.enabled) {
      return;
    }

    Sentry.init({
      dsn: sentryConfig.dsn,
      environment: sentryConfig.environment,
      tracesSampleRate: sentryConfig.tracesSampleRate,
      // Automatically capture errors in server components and API routes
      integrations: [
        Sentry.httpIntegration(),
        Sentry.consoleIntegration(),
      ],
      // Filter out sensitive data before sending to Sentry
      beforeSend(event, hint) {
        // Remove sensitive headers
        if (event.request?.headers) {
          delete event.request.headers["cookie"];
          delete event.request.headers["authorization"];
          delete event.request.headers["x-api-key"];
        }

        // Sanitize URL
        if (event.request?.url) {
          event.request.url = sanitizeUrl(event.request.url);
        }
        // Sanitize query string (can be string or object)
        if (event.request?.query_string) {
          if (typeof event.request.query_string === "string") {
            event.request.query_string = sanitizeUrl(event.request.query_string);
          } else if (typeof event.request.query_string === "object") {
            event.request.query_string = sanitizeData(
              event.request.query_string as Record<string, unknown>
            ) as Record<string, string>;
          }
        }

        // Sanitize request body data
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
              return null; // Don't send to Sentry
            }
          }
        }

        return event;
      },
    });
  }
}
