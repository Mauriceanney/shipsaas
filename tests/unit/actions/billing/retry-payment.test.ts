/**
 * Unit tests for retryPaymentAction
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

// Hoist mocks for vitest
const { mockAuth, mockDbSubscription, mockStripeInvoices } = vi.hoisted(
  () => ({
    mockAuth: vi.fn(),
    mockDbSubscription: {
      findFirst: vi.fn(),
    },
    mockStripeInvoices: {
      list: vi.fn(),
      pay: vi.fn(),
    },
  })
);

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

// Mock database
vi.mock("@/lib/db", () => ({
  db: {
    subscription: mockDbSubscription,
  },
}));

// Mock Stripe client
vi.mock("@/lib/stripe", () => ({
  stripe: {
    invoices: mockStripeInvoices,
  },
}));

import { retryPaymentAction } from "@/actions/billing/retry-payment";

describe("retryPaymentAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("authentication", () => {
    it("returns error when user is not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const result = await retryPaymentAction();

      expect(result).toEqual({
        success: false,
        error: "Unauthorized",
      });
      expect(mockDbSubscription.findFirst).not.toHaveBeenCalled();
    });

    it("returns error when session has no user", async () => {
      mockAuth.mockResolvedValue({ user: null });

      const result = await retryPaymentAction();

      expect(result).toEqual({
        success: false,
        error: "Unauthorized",
      });
      expect(mockDbSubscription.findFirst).not.toHaveBeenCalled();
    });

    it("returns error when session user has no id", async () => {
      mockAuth.mockResolvedValue({ user: {} });

      const result = await retryPaymentAction();

      expect(result).toEqual({
        success: false,
        error: "Unauthorized",
      });
      expect(mockDbSubscription.findFirst).not.toHaveBeenCalled();
    });
  });

  describe("subscription validation", () => {
    it("returns error when user has no PAST_DUE subscription", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user_123", email: "test@example.com" },
      });
      mockDbSubscription.findFirst.mockResolvedValue(null);

      const result = await retryPaymentAction();

      expect(result).toEqual({
        success: false,
        error: "No past due subscription found",
      });
      expect(mockDbSubscription.findFirst).toHaveBeenCalledWith({
        where: {
          userId: "user_123",
          status: "PAST_DUE",
        },
      });
      expect(mockStripeInvoices.list).not.toHaveBeenCalled();
    });

    it("queries only for PAST_DUE status subscriptions", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user_123", email: "test@example.com" },
      });
      mockDbSubscription.findFirst.mockResolvedValue(null);

      await retryPaymentAction();

      expect(mockDbSubscription.findFirst).toHaveBeenCalledWith({
        where: {
          userId: "user_123",
          status: "PAST_DUE",
        },
      });
    });
  });

  describe("invoice validation", () => {
    it("returns error when no open invoices found", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user_123", email: "test@example.com" },
      });
      mockDbSubscription.findFirst.mockResolvedValue({
        id: "sub_123",
        userId: "user_123",
        status: "PAST_DUE",
        stripeSubscriptionId: "sub_stripe_123",
      });
      mockStripeInvoices.list.mockResolvedValue({
        data: [],
      });

      const result = await retryPaymentAction();

      expect(result).toEqual({
        success: false,
        error: "No open invoice found",
      });
      expect(mockStripeInvoices.list).toHaveBeenCalledWith({
        subscription: "sub_stripe_123",
        status: "open",
        limit: 1,
      });
      expect(mockStripeInvoices.pay).not.toHaveBeenCalled();
    });

    it("queries Stripe for open invoices with correct parameters", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user_123", email: "test@example.com" },
      });
      mockDbSubscription.findFirst.mockResolvedValue({
        stripeSubscriptionId: "sub_stripe_456",
      });
      mockStripeInvoices.list.mockResolvedValue({
        data: [],
      });

      await retryPaymentAction();

      expect(mockStripeInvoices.list).toHaveBeenCalledWith({
        subscription: "sub_stripe_456",
        status: "open",
        limit: 1,
      });
    });
  });

  describe("success path", () => {
    it("retries payment and returns success", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user_123", email: "test@example.com" },
      });
      mockDbSubscription.findFirst.mockResolvedValue({
        id: "sub_123",
        userId: "user_123",
        status: "PAST_DUE",
        stripeSubscriptionId: "sub_stripe_123",
      });
      mockStripeInvoices.list.mockResolvedValue({
        data: [
          {
            id: "in_test_123",
            status: "open",
          },
        ],
      });
      mockStripeInvoices.pay.mockResolvedValue({
        id: "in_test_123",
        status: "paid",
      });

      const result = await retryPaymentAction();

      expect(result).toEqual({
        success: true,
      });
      expect(mockStripeInvoices.pay).toHaveBeenCalledWith("in_test_123");
    });

    it("retries the first open invoice", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user_123", email: "test@example.com" },
      });
      mockDbSubscription.findFirst.mockResolvedValue({
        stripeSubscriptionId: "sub_stripe_123",
      });
      mockStripeInvoices.list.mockResolvedValue({
        data: [
          {
            id: "in_first",
            status: "open",
          },
          {
            id: "in_second",
            status: "open",
          },
        ],
      });
      mockStripeInvoices.pay.mockResolvedValue({
        id: "in_first",
        status: "paid",
      });

      await retryPaymentAction();

      expect(mockStripeInvoices.pay).toHaveBeenCalledWith("in_first");
      expect(mockStripeInvoices.pay).toHaveBeenCalledTimes(1);
    });
  });

  describe("error handling", () => {
    it("handles Stripe API errors gracefully", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user_123", email: "test@example.com" },
      });
      mockDbSubscription.findFirst.mockResolvedValue({
        stripeSubscriptionId: "sub_stripe_123",
      });
      mockStripeInvoices.list.mockResolvedValue({
        data: [{ id: "in_test_123" }],
      });
      mockStripeInvoices.pay.mockRejectedValue(
        new Error("Your card was declined")
      );

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const result = await retryPaymentAction();

      expect(result).toEqual({
        success: false,
        error: "Payment failed. Please update your payment method.",
      });

      consoleSpy.mockRestore();
    });

    it("handles non-Error Stripe failures", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user_123", email: "test@example.com" },
      });
      mockDbSubscription.findFirst.mockResolvedValue({
        stripeSubscriptionId: "sub_stripe_123",
      });
      mockStripeInvoices.list.mockResolvedValue({
        data: [{ id: "in_test_123" }],
      });
      mockStripeInvoices.pay.mockRejectedValue("Unknown error");

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const result = await retryPaymentAction();

      expect(result).toEqual({
        success: false,
        error: "Payment failed",
      });

      consoleSpy.mockRestore();
    });

    it("handles database errors gracefully", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user_123", email: "test@example.com" },
      });
      mockDbSubscription.findFirst.mockRejectedValue(
        new Error("Database connection error")
      );

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const result = await retryPaymentAction();

      expect(result).toEqual({
        success: false,
        error: "Failed to retry payment",
      });

      consoleSpy.mockRestore();
    });

    it("handles Stripe invoice list errors gracefully", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user_123", email: "test@example.com" },
      });
      mockDbSubscription.findFirst.mockResolvedValue({
        stripeSubscriptionId: "sub_stripe_123",
      });
      mockStripeInvoices.list.mockRejectedValue(
        new Error("Stripe API unavailable")
      );

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const result = await retryPaymentAction();

      expect(result).toEqual({
        success: false,
        error: "Failed to retry payment",
      });

      consoleSpy.mockRestore();
    });

    it("handles auth errors gracefully", async () => {
      mockAuth.mockRejectedValue(new Error("Auth service unavailable"));

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const result = await retryPaymentAction();

      expect(result).toEqual({
        success: false,
        error: "Failed to retry payment",
      });

      consoleSpy.mockRestore();
    });
  });
});
