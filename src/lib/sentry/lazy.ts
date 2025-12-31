/**
 * Lazy Sentry Loader
 * Defers Sentry loading until first error to reduce initial bundle size
 */

import type * as SentryType from "@sentry/nextjs";

import { sanitizeData, sanitizeUrl, sentryConfig } from "./config";

import type { Session } from "next-auth";

// Queue for errors that occur before Sentry is loaded
type QueuedError = {
  error: Error | unknown;
  timestamp: Date;
};

type QueuedBreadcrumb = {
  message: string;
  data?: Record<string, unknown>;
};

type QueuedContext = {
  key: string;
  context: Record<string, unknown>;
};

// State management
let sentryModule: typeof SentryType | null = null;
let isLoading = false;
let isInitialized = false;
const errorQueue: QueuedError[] = [];
const breadcrumbQueue: QueuedBreadcrumb[] = [];
const contextQueue: QueuedContext[] = [];
let pendingUserContext: Session | null | undefined = undefined;

/**
 * Load and initialize Sentry
 */
async function loadSentry(): Promise<typeof SentryType | null> {
  if (sentryModule) {
    return sentryModule;
  }

  if (isLoading) {
    // Wait for existing load to complete
    return new Promise((resolve) => {
      const checkLoaded = setInterval(() => {
        if (sentryModule || !isLoading) {
          clearInterval(checkLoaded);
          resolve(sentryModule);
        }
      }, 50);
    });
  }

  if (!sentryConfig.enabled || !sentryConfig.dsn) {
    return null;
  }

  isLoading = true;

  try {
    // Dynamic import - this is what saves the initial bundle size
    const Sentry = await import("@sentry/nextjs");
    sentryModule = Sentry;

    // Initialize Sentry if on client side and not already initialized
    if (typeof window !== "undefined" && !isInitialized) {
      Sentry.init({
        dsn: sentryConfig.dsn,
        environment: sentryConfig.environment,
        tracesSampleRate: sentryConfig.tracesSampleRate,
        replaysSessionSampleRate: sentryConfig.replaysSessionSampleRate,
        replaysOnErrorSampleRate: sentryConfig.replaysOnErrorSampleRate,
        integrations: [
          Sentry.browserTracingIntegration(),
          Sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],
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
          if (event.request?.query_string) {
            if (typeof event.request.query_string === "string") {
              event.request.query_string = sanitizeUrl(event.request.query_string);
            } else if (typeof event.request.query_string === "object") {
              event.request.query_string = sanitizeData(
                event.request.query_string as Record<string, unknown>
              ) as Record<string, string>;
            }
          }

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

    // Flush queued items
    await flushQueues(Sentry);

    isLoading = false;
    return Sentry;
  } catch (error) {
    console.error("[Sentry] Failed to load:", error);
    isLoading = false;
    return null;
  }
}

/**
 * Flush all queued items to Sentry
 */
async function flushQueues(Sentry: typeof SentryType): Promise<void> {
  // Set user context if pending
  if (pendingUserContext !== undefined) {
    if (pendingUserContext?.user?.id) {
      Sentry.setUser({
        id: pendingUserContext.user.id,
        email: pendingUserContext.user.email
          ? maskEmail(pendingUserContext.user.email)
          : undefined,
      });
    } else {
      Sentry.setUser(null);
    }
    pendingUserContext = undefined;
  }

  // Flush contexts
  for (const { key, context } of contextQueue) {
    Sentry.setContext(key, sanitizeData(context) ?? {});
  }
  contextQueue.length = 0;

  // Flush breadcrumbs
  for (const { message, data } of breadcrumbQueue) {
    Sentry.addBreadcrumb({
      message,
      data: sanitizeData(data),
      level: "info",
    });
  }
  breadcrumbQueue.length = 0;

  // Flush errors
  for (const { error } of errorQueue) {
    Sentry.captureException(error);
  }
  errorQueue.length = 0;
}

/**
 * Mask email for privacy (GDPR compliance)
 */
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "[MASKED]";
  const maskedLocal = local.slice(0, 2) + "***";
  return `${maskedLocal}@${domain}`;
}

/**
 * Lazy capture exception
 * Queues error if Sentry not loaded, triggers load, then captures
 */
export async function captureExceptionLazy(error: Error | unknown): Promise<void> {
  if (!sentryConfig.enabled) {
    return;
  }

  // Queue the error immediately so it's not lost
  errorQueue.push({ error, timestamp: new Date() });

  // Trigger Sentry load and flush
  const Sentry = await loadSentry();
  if (Sentry && errorQueue.length > 0) {
    // Errors are flushed in loadSentry, but if already loaded, flush now
    for (const { error: e } of errorQueue) {
      Sentry.captureException(e);
    }
    errorQueue.length = 0;
  }
}

/**
 * Lazy set user context
 */
export async function setUserContextLazy(session: Session | null): Promise<void> {
  if (!sentryConfig.enabled) {
    return;
  }

  if (sentryModule) {
    if (session?.user?.id) {
      sentryModule.setUser({
        id: session.user.id,
        email: session.user.email ? maskEmail(session.user.email) : undefined,
      });
    } else {
      sentryModule.setUser(null);
    }
  } else {
    pendingUserContext = session;
  }
}

/**
 * Lazy add breadcrumb
 */
export function addBreadcrumbLazy(
  message: string,
  data?: Record<string, unknown>
): void {
  if (!sentryConfig.enabled) {
    return;
  }

  if (sentryModule) {
    sentryModule.addBreadcrumb({
      message,
      data: sanitizeData(data),
      level: "info",
    });
  } else {
    breadcrumbQueue.push({ message, data });
  }
}

/**
 * Lazy set context
 */
export function setContextLazy(
  key: string,
  context: Record<string, unknown>
): void {
  if (!sentryConfig.enabled) {
    return;
  }

  if (sentryModule) {
    sentryModule.setContext(key, sanitizeData(context) ?? {});
  } else {
    contextQueue.push({ key, context });
  }
}

/**
 * Preload Sentry in background (call after page is interactive)
 */
export function preloadSentry(): void {
  if (!sentryModule && !isLoading && sentryConfig.enabled) {
    loadSentry();
  }
}

/**
 * Check if Sentry is loaded
 */
export function isSentryLoaded(): boolean {
  return sentryModule !== null;
}
