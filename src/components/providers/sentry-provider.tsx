"use client";

/**
 * Sentry Provider
 * Initializes Sentry client-side error tracking
 */

import * as Sentry from "@sentry/nextjs";
import { useEffect, useState } from "react";

import { sanitizeData, sanitizeUrl, sentryConfig } from "@/lib/sentry/config";

interface SentryProviderProps {
  children: React.ReactNode;
}

export function SentryProvider({ children }: SentryProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Only initialize in production with valid DSN
    if (!sentryConfig.enabled || !sentryConfig.dsn) {
      return;
    }

    // Initialize Sentry client
    Sentry.init({
      dsn: sentryConfig.dsn,
      environment: sentryConfig.environment,
      tracesSampleRate: sentryConfig.tracesSampleRate,
      replaysSessionSampleRate: sentryConfig.replaysSessionSampleRate,
      replaysOnErrorSampleRate: sentryConfig.replaysOnErrorSampleRate,
      // Automatically capture errors in client components
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      // Filter out sensitive data before sending to Sentry
      beforeSend(event, hint) {
        // Sanitize breadcrumbs
        if (event.breadcrumbs) {
          event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
            if (breadcrumb.data) {
              breadcrumb.data = sanitizeData(
                breadcrumb.data as Record<string, unknown>
              );
            }
            return breadcrumb;
          });
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
  }, []);

  // Wait for client-side hydration to avoid SSR mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
