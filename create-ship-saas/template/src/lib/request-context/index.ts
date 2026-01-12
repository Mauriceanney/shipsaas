/**
 * Request context using AsyncLocalStorage
 * Provides request-scoped data (request ID, user info) accessible anywhere in the request lifecycle
 */

import { AsyncLocalStorage } from "async_hooks";

export interface RequestContext {
  requestId: string;
  startTime: number;
  userId?: string;
  path?: string;
  method?: string;
}

/**
 * AsyncLocalStorage instance for request context
 * This allows accessing request-specific data anywhere without prop drilling
 */
const requestContextStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Generate a unique request ID
 * Format: req-{timestamp}-{random}
 */
export function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get the current request context
 * Returns undefined if called outside of a request context
 */
export function getRequestContext(): RequestContext | undefined {
  return requestContextStorage.getStore();
}

/**
 * Get the current request ID
 * Returns a new ID if called outside of a request context
 */
export function getRequestId(): string {
  const context = getRequestContext();
  return context?.requestId ?? generateRequestId();
}

/**
 * Run a function within a request context
 * Used by middleware to establish context for the request lifecycle
 */
export function runWithRequestContext<T>(
  context: RequestContext,
  fn: () => T
): T {
  return requestContextStorage.run(context, fn);
}

/**
 * Create a new request context
 */
export function createRequestContext(
  options: Partial<RequestContext> = {}
): RequestContext {
  const context: RequestContext = {
    requestId: options.requestId ?? generateRequestId(),
    startTime: options.startTime ?? Date.now(),
  };

  // Only add optional properties if they have a value
  if (options.userId) {
    context.userId = options.userId;
  }
  if (options.path) {
    context.path = options.path;
  }
  if (options.method) {
    context.method = options.method;
  }

  return context;
}
