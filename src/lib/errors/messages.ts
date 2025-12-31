/**
 * User-friendly error message utilities
 * Maps technical errors to human-readable messages
 */

export type ErrorType =
  | "database"
  | "network"
  | "authentication"
  | "authorization"
  | "validation"
  | "unknown";

const ERROR_MESSAGES: Record<ErrorType, string> = {
  database:
    "We're having trouble connecting to our database. Please try again in a moment.",
  network:
    "Unable to connect to the server. Please check your connection and try again.",
  authentication:
    "Your session may have expired. Please refresh the page or log in again.",
  authorization:
    "You don't have permission to access this resource.",
  validation:
    "The data provided was invalid. Please check your input and try again.",
  unknown:
    "Something went wrong. Our team has been notified and is working on it.",
};

/**
 * Classify an error based on its message or type
 */
export function classifyError(error: Error): ErrorType {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  // Database errors
  if (
    message.includes("prisma") ||
    message.includes("database") ||
    message.includes("connection") ||
    message.includes("timeout") ||
    message.includes("econnrefused")
  ) {
    return "database";
  }

  // Network errors
  if (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("cors") ||
    name === "typeerror" && message.includes("failed to fetch")
  ) {
    return "network";
  }

  // Authentication errors
  if (
    message.includes("unauthorized") ||
    message.includes("unauthenticated") ||
    message.includes("session") ||
    message.includes("token")
  ) {
    return "authentication";
  }

  // Authorization errors
  if (
    message.includes("forbidden") ||
    message.includes("permission") ||
    message.includes("access denied")
  ) {
    return "authorization";
  }

  // Validation errors
  if (
    message.includes("validation") ||
    message.includes("invalid") ||
    name === "zod"
  ) {
    return "validation";
  }

  return "unknown";
}

/**
 * Get a user-friendly error message based on error type
 */
export function getUserFriendlyMessage(error: Error): string {
  const errorType = classifyError(error);
  return ERROR_MESSAGES[errorType];
}

/**
 * Check if we should show technical error details
 * Only show in development mode
 */
export function shouldShowTechnicalDetails(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * Get context-specific error title
 */
export function getErrorTitle(context: "dashboard" | "settings" | "admin"): string {
  const titles: Record<typeof context, string> = {
    dashboard: "Error loading dashboard",
    settings: "Error loading settings",
    admin: "Error loading admin panel",
  };
  return titles[context];
}

/**
 * Get context-specific error description
 */
export function getErrorDescription(context: "dashboard" | "settings" | "admin"): string {
  const descriptions: Record<typeof context, string> = {
    dashboard: "We couldn't load your dashboard data. Please try again.",
    settings: "We couldn't load your settings. Please try again.",
    admin: "We couldn't load the admin panel. Please try again.",
  };
  return descriptions[context];
}
