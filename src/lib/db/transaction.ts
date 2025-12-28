/**
 * Transaction utilities for Prisma
 */

import { Prisma } from "@prisma/client";

// Transient error codes that can be retried
const TRANSIENT_ERROR_CODES = [
  "P2034", // Transaction conflict
  "P1017", // Connection closed
  "P2024", // Timeout
];

export interface TransactionOptions {
  timeout?: number;
  maxWait?: number;
  isolationLevel?: Prisma.TransactionIsolationLevel;
}

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  jitter?: boolean;
}

export const DEFAULT_TRANSACTION_OPTIONS: Required<TransactionOptions> = {
  timeout: 5000,
  maxWait: 2000,
  isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
};

export const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 100,
  maxDelay: 5000,
  jitter: true,
};

/**
 * Checks if an error is a transient error that can be retried
 */
export function isTransientError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const prismaError = error as { code?: string };
  if (!prismaError.code) {
    return false;
  }

  return TRANSIENT_ERROR_CODES.includes(prismaError.code);
}

/**
 * Calculates exponential backoff delay with optional jitter
 */
export function calculateRetryDelay(
  attempt: number,
  baseDelay: number,
  jitter: boolean = false,
  maxDelay: number = 5000
): number {
  // Exponential backoff: baseDelay * 2^attempt
  let delay = baseDelay * Math.pow(2, attempt);

  // Apply max delay cap
  delay = Math.min(delay, maxDelay);

  // Add jitter (random variation) to prevent thundering herd
  if (jitter) {
    const jitterFactor = 0.5 + Math.random(); // 0.5 to 1.5
    delay = Math.floor(delay * jitterFactor);
  }

  return delay;
}

/**
 * Delays execution for specified milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
