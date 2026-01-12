/**
 * Lazy Sentry Loader
 * Defers Sentry loading until first error to reduce initial bundle size
 */

import { sanitizeData, sanitizeUrl, sentryConfig } from "./config";
import type * as SentryType from "@sentry/nextjs";

/**
 * Session type for Sentry - matches Better Auth session structure
 */
type SentrySession = {
  user?: {
    id: string;
    email?: string | null;
  } | null;
} | null;

// Queue for errors that occur before Sentry is loaded
type QueuedError = {
  error: Error | unknown;
  timestamp: Date;
};

type QueuedBreadcrumb = {
  message: string;
  data: Record<string, unknown> | null;
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
let pendingUserContext: SentrySession | undefined = undefined;

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
      const userContext: { id: string; email?: string } = {
        id: pendingUserContext.user.id,
      };
      if (pendingUserContext.user.email) {
        userContext.email = maskEmail(pendingUserContext.user.email);
      }
      Sentry.setUser(userContext);
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
    const breadcrumb: { message: string; level: "info"; data?: Record<string, unknown> } = {
      message,
      level: "info",
    };
    const sanitized = data ? sanitizeData(data) : null;
    if (sanitized) {
      breadcrumb.data = sanitized;
    }
    Sentry.addBreadcrumb(breadcrumb);
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
export async function setUserContextLazy(session: SentrySession): Promise<void> {
  if (!sentryConfig.enabled) {
    return;
  }

  if (sentryModule) {
    if (session?.user?.id) {
      const userContext: { id: string; email?: string } = {
        id: session.user.id,
      };
      if (session.user.email) {
        userContext.email = maskEmail(session.user.email);
      }
      sentryModule.setUser(userContext);
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
    const breadcrumb: { message: string; level: "info"; data?: Record<string, unknown> } = {
      message,
      level: "info",
    };
    const sanitized = data ? sanitizeData(data) : null;
    if (sanitized) {
      breadcrumb.data = sanitized;
    }
    sentryModule.addBreadcrumb(breadcrumb);
  } else {
    breadcrumbQueue.push({ message, data: data ?? null });
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
