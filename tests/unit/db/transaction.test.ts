import { describe, expect, it, vi } from "vitest";

import {
  isTransientError,
  calculateRetryDelay,
  DEFAULT_TRANSACTION_OPTIONS,
  DEFAULT_RETRY_OPTIONS,
} from "@/lib/db/transaction";

describe("Transaction Helpers", () => {
  describe("isTransientError", () => {
    it("identifies P2034 (transaction conflict) as transient", () => {
      const error = { code: "P2034" };
      expect(isTransientError(error)).toBe(true);
    });

    it("identifies P1017 (connection closed) as transient", () => {
      const error = { code: "P1017" };
      expect(isTransientError(error)).toBe(true);
    });

    it("identifies P2024 (timeout) as transient", () => {
      const error = { code: "P2024" };
      expect(isTransientError(error)).toBe(true);
    });

    it("returns false for non-transient errors", () => {
      const error = { code: "P2002" }; // Unique constraint
      expect(isTransientError(error)).toBe(false);
    });

    it("returns false for errors without code", () => {
      const error = new Error("Some error");
      expect(isTransientError(error)).toBe(false);
    });

    it("returns false for null/undefined", () => {
      expect(isTransientError(null)).toBe(false);
      expect(isTransientError(undefined)).toBe(false);
    });
  });

  describe("calculateRetryDelay", () => {
    it("calculates exponential backoff", () => {
      const baseDelay = 100;

      expect(calculateRetryDelay(0, baseDelay)).toBe(100); // 100 * 2^0
      expect(calculateRetryDelay(1, baseDelay)).toBe(200); // 100 * 2^1
      expect(calculateRetryDelay(2, baseDelay)).toBe(400); // 100 * 2^2
      expect(calculateRetryDelay(3, baseDelay)).toBe(800); // 100 * 2^3
    });

    it("adds jitter to prevent thundering herd", () => {
      // Run multiple times and check values are different
      const delays = new Set<number>();
      for (let i = 0; i < 10; i++) {
        delays.add(calculateRetryDelay(1, 100, true));
      }
      // With jitter, we should get some variation
      expect(delays.size).toBeGreaterThan(1);
    });

    it("respects maximum delay cap", () => {
      const maxDelay = 1000;
      const delay = calculateRetryDelay(10, 100, false, maxDelay);
      expect(delay).toBeLessThanOrEqual(maxDelay);
    });
  });

  describe("DEFAULT_TRANSACTION_OPTIONS", () => {
    it("has sensible timeout", () => {
      expect(DEFAULT_TRANSACTION_OPTIONS.timeout).toBe(5000);
    });

    it("has sensible maxWait", () => {
      expect(DEFAULT_TRANSACTION_OPTIONS.maxWait).toBe(2000);
    });

    it("uses ReadCommitted isolation by default", () => {
      expect(DEFAULT_TRANSACTION_OPTIONS.isolationLevel).toBe("ReadCommitted");
    });
  });

  describe("DEFAULT_RETRY_OPTIONS", () => {
    it("has sensible maxRetries", () => {
      expect(DEFAULT_RETRY_OPTIONS.maxRetries).toBe(3);
    });

    it("has sensible baseDelay", () => {
      expect(DEFAULT_RETRY_OPTIONS.baseDelay).toBe(100);
    });
  });
});
