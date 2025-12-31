/**
 * Structured JSON logging with pino
 * Provides environment-aware logging with request correlation and sensitive data redaction
 */

import pino from "pino";

// Sensitive field names to redact (case-insensitive)
const SENSITIVE_FIELDS = [
  "password",
  "token",
  "secret",
  "apikey",
  "accesstoken",
  "refreshtoken",
  "privatekey",
  "clientsecret",
  "stripesecretkey",
  "sessiontoken",
  "creditcard",
  "ssn",
  "key",
];

/**
 * Check if a field name is sensitive
 */
function isSensitiveField(key: string): boolean {
  const lowerKey = key.toLowerCase();
  return SENSITIVE_FIELDS.some((field) => lowerKey.includes(field));
}

/**
 * Redact sensitive data from objects
 * Handles nested objects, arrays, and circular references
 */
export function redactSensitiveData(
  data: any,
  seen = new WeakSet()
): any {
  // Handle null/undefined
  if (data === null || data === undefined) {
    return data;
  }

  // Handle primitives
  if (typeof data !== "object") {
    return data;
  }

  // Handle circular references
  if (seen.has(data)) {
    return "[Circular]";
  }
  seen.add(data);

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item, seen));
  }

  // Handle objects
  const result: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (isSensitiveField(key)) {
      result[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      result[key] = redactSensitiveData(value, seen);
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create logger configuration based on environment
 */
function createLoggerConfig() {
  const isDevelopment = process.env["NODE_ENV"] === "development";
  const isTest = process.env["NODE_ENV"] === "test";

  // Base configuration
  const config: pino.LoggerOptions = {
    level: process.env["LOG_LEVEL"] || (isDevelopment ? "debug" : "info"),
    // Redact sensitive fields automatically
    redact: {
      paths: SENSITIVE_FIELDS.map((field) => `*.${field}`),
      censor: "[REDACTED]",
    },
  };

  // Use pretty printing in development
  if (isDevelopment && !isTest) {
    config.transport = {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
      },
    };
  }

  return config;
}

/**
 * Main logger instance
 */
export const logger = pino(createLoggerConfig());

/**
 * Create a request-scoped logger with request ID
 */
export function createRequestLogger(
  requestId?: string,
  context?: Record<string, unknown>
): pino.Logger {
  const id = requestId || generateRequestId();

  return logger.child({
    requestId: id,
    ...context,
  });
}

/**
 * Logger type for TypeScript
 */
export type Logger = pino.Logger;
