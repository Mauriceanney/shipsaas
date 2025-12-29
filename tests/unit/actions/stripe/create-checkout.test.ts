/**
 * Unit tests for createCheckoutAction
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

// Hoist mocks for vitest
const {
  mockAuth,
  mockDbSubscription,
  mockStripeCheckoutSessions,
  mockIsValidPriceId,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockDbSubscription: {
    findUnique: vi.fn(),
  },
  mockStripeCheckoutSessions: {
    create: vi.fn(),
  },
  mockIsValidPriceId: vi.fn(),
}));

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

// Mock Stripe client and config
vi.mock("@/lib/stripe", () => ({
  stripe: {
    checkout: {
      sessions: mockStripeCheckoutSessions,
    },
  },
  isValidPriceId: mockIsValidPriceId,
  CHECKOUT_URLS: {
    success: "/checkout/success",
    cancel: "/pricing",
  },
}));

import {
  createCheckoutAction,
  redirectToCheckout,
} from "@/actions/stripe/create-checkout";

describe("createCheckoutAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default to valid price ID
    mockIsValidPriceId.mockReturnValue(true);
  });

  describe("authentication", () => {
    it("returns error when user is not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const result = await createCheckoutAction({ priceId: "price_test" });

      expect(result).toEqual({
        success: false,
        error: "Authentication required",
      });
      expect(mockStripeCheckoutSessions.create).not.toHaveBeenCalled();
    });

    it("returns error when session has no user", async () => {
      mockAuth.mockResolvedValue({ user: null });

      const result = await createCheckoutAction({ priceId: "price_test" });

      expect(result).toEqual({
        success: false,
        error: "Authentication required",
      });
    });
  });

  describe("input validation", () => {
    it("returns error when priceId is empty", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user_123", email: "test@example.com" },
      });

      const result = await createCheckoutAction({ priceId: "" });

      expect(result).toEqual({
        success: false,
        error: "Invalid price ID",
      });
      expect(mockStripeCheckoutSessions.create).not.toHaveBeenCalled();
    });

    it("returns error when priceId is invalid", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user_123", email: "test@example.com" },
      });
      mockIsValidPriceId.mockReturnValue(false);

      const result = await createCheckoutAction({ priceId: "invalid_price" });

      expect(result).toEqual({
        success: false,
        error: "Invalid price ID",
      });
      expect(mockIsValidPriceId).toHaveBeenCalledWith("invalid_price");
    });
  });

  describe("success path", () => {
    it("creates checkout session with customer email for new user", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user_123", email: "test@example.com" },
      });
      mockDbSubscription.findUnique.mockResolvedValue(null);
      mockStripeCheckoutSessions.create.mockResolvedValue({
        id: "cs_test_123",
        url: "https://checkout.stripe.com/session/cs_test_123",
      });

      const result = await createCheckoutAction({ priceId: "price_pro_monthly" });

      expect(result).toEqual({
        success: true,
        data: { url: "https://checkout.stripe.com/session/cs_test_123" },
      });
      expect(mockDbSubscription.findUnique).toHaveBeenCalledWith({
        where: { userId: "user_123" },
      });
      expect(mockStripeCheckoutSessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: "subscription",
          payment_method_types: ["card"],
          customer_email: "test@example.com",
          line_items: [{ price: "price_pro_monthly", quantity: 1 }],
          metadata: { userId: "user_123" },
          subscription_data: { metadata: { userId: "user_123" } },
          allow_promotion_codes: true,
        })
      );
    });

    it("creates checkout session with existing customer ID", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user_123", email: "test@example.com" },
      });
      mockDbSubscription.findUnique.mockResolvedValue({
        stripeCustomerId: "cus_existing_123",
      });
      mockStripeCheckoutSessions.create.mockResolvedValue({
        id: "cs_test_456",
        url: "https://checkout.stripe.com/session/cs_test_456",
      });

      const result = await createCheckoutAction({ priceId: "price_pro_yearly" });

      expect(result).toEqual({
        success: true,
        data: { url: "https://checkout.stripe.com/session/cs_test_456" },
      });
      expect(mockStripeCheckoutSessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: "cus_existing_123",
        })
      );
      // Should not include customer_email when customer ID exists
      const callArgs = mockStripeCheckoutSessions.create.mock.calls[0]![0];
      expect(callArgs.customer_email).toBeUndefined();
    });

    it("uses default success and cancel URLs", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user_123", email: "test@example.com" },
      });
      mockDbSubscription.findUnique.mockResolvedValue(null);
      mockStripeCheckoutSessions.create.mockResolvedValue({
        id: "cs_test",
        url: "https://checkout.stripe.com/session/cs_test",
      });

      await createCheckoutAction({ priceId: "price_test" });

      const callArgs = mockStripeCheckoutSessions.create.mock.calls[0]![0];
      expect(callArgs.success_url).toContain("/checkout/success");
      expect(callArgs.success_url).toContain("session_id={CHECKOUT_SESSION_ID}");
      expect(callArgs.cancel_url).toContain("/pricing");
    });

    it("uses custom success and cancel URLs when provided", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user_123", email: "test@example.com" },
      });
      mockDbSubscription.findUnique.mockResolvedValue(null);
      mockStripeCheckoutSessions.create.mockResolvedValue({
        id: "cs_test",
        url: "https://checkout.stripe.com/session/cs_test",
      });

      await createCheckoutAction({
        priceId: "price_test",
        successUrl: "/custom/success",
        cancelUrl: "/custom/cancel",
      });

      const callArgs = mockStripeCheckoutSessions.create.mock.calls[0]![0];
      expect(callArgs.success_url).toContain("/custom/success");
      expect(callArgs.cancel_url).toContain("/custom/cancel");
    });

    it("handles user with no email gracefully", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user_123", email: null },
      });
      mockDbSubscription.findUnique.mockResolvedValue(null);
      mockStripeCheckoutSessions.create.mockResolvedValue({
        id: "cs_test",
        url: "https://checkout.stripe.com/session/cs_test",
      });

      const result = await createCheckoutAction({ priceId: "price_test" });

      expect(result.success).toBe(true);
      const callArgs = mockStripeCheckoutSessions.create.mock.calls[0]![0];
      expect(callArgs.customer_email).toBeUndefined();
    });
  });

  describe("error handling", () => {
    it("returns error when Stripe session URL is null", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user_123", email: "test@example.com" },
      });
      mockDbSubscription.findUnique.mockResolvedValue(null);
      mockStripeCheckoutSessions.create.mockResolvedValue({
        id: "cs_test",
        url: null,
      });

      const result = await createCheckoutAction({ priceId: "price_test" });

      expect(result).toEqual({
        success: false,
        error: "Failed to create checkout session",
      });
    });

    it("handles Stripe API errors gracefully", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user_123", email: "test@example.com" },
      });
      mockDbSubscription.findUnique.mockResolvedValue(null);
      mockStripeCheckoutSessions.create.mockRejectedValue(
        new Error("Stripe API error")
      );

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const result = await createCheckoutAction({ priceId: "price_test" });

      expect(result).toEqual({
        success: false,
        error: "Failed to create checkout session",
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        "Create checkout error:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it("handles database errors gracefully", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user_123", email: "test@example.com" },
      });
      mockDbSubscription.findUnique.mockRejectedValue(
        new Error("Database connection error")
      );

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const result = await createCheckoutAction({ priceId: "price_test" });

      expect(result).toEqual({
        success: false,
        error: "Failed to create checkout session",
      });

      consoleSpy.mockRestore();
    });
  });
});

describe("redirectToCheckout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsValidPriceId.mockReturnValue(true);
  });

  // Note: redirectToCheckout uses Next.js redirect() which throws a special error
  // Testing the redirect behavior is complex due to the "never" return type
  // The function is a thin wrapper around createCheckoutAction

  it("calls createCheckoutAction with the provided priceId", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user_123", email: "test@example.com" },
    });
    mockDbSubscription.findUnique.mockResolvedValue(null);
    mockStripeCheckoutSessions.create.mockResolvedValue({
      id: "cs_test",
      url: "https://checkout.stripe.com/session/cs_test",
    });

    // redirect() throws a special Next.js error
    const { redirect } = await import("next/navigation");
    vi.mocked(redirect).mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    try {
      await redirectToCheckout("price_test");
    } catch {
      // Expected to throw due to redirect
    }

    expect(mockStripeCheckoutSessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [{ price: "price_test", quantity: 1 }],
      })
    );
  });
});
