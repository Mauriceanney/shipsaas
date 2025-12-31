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
  mockGetTrialDays,
  mockGetPlanFromPriceId,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockDbSubscription: {
    findUnique: vi.fn(),
  },
  mockStripeCheckoutSessions: {
    create: vi.fn(),
  },
  mockIsValidPriceId: vi.fn(),
  mockGetTrialDays: vi.fn(),
  mockGetPlanFromPriceId: vi.fn(),
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
  getTrialDays: mockGetTrialDays,
  CHECKOUT_URLS: {
    success: "/checkout/success",
    cancel: "/pricing",
  },
}));

// Mock Stripe utils
vi.mock("@/lib/stripe/utils", () => ({
  getPlanFromPriceId: mockGetPlanFromPriceId,
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
    // Default mock implementations for trial functions
    mockGetPlanFromPriceId.mockReturnValue("PLUS");
    mockGetTrialDays.mockReturnValue(0);
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

      const result = await createCheckoutAction({ priceId: "price_test" });

      expect(result).toEqual({
        success: false,
        error: "Failed to create checkout session",
      });
    });

    it("handles database errors gracefully", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user_123", email: "test@example.com" },
      });
      mockDbSubscription.findUnique.mockRejectedValue(
        new Error("Database connection error")
      );

      const result = await createCheckoutAction({ priceId: "price_test" });

      expect(result).toEqual({
        success: false,
        error: "Failed to create checkout session",
      });
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

describe("trial period configuration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsValidPriceId.mockReturnValue(true);
    mockGetPlanFromPriceId.mockReturnValue("PLUS");
    mockGetTrialDays.mockReturnValue(0);
  });

  it("includes trial period for PLUS monthly plan", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user_123", email: "test@example.com" },
    });
    mockDbSubscription.findUnique.mockResolvedValue(null);
    mockStripeCheckoutSessions.create.mockResolvedValue({
      id: "cs_test",
      url: "https://checkout.stripe.com/session/cs_test",
    });
    mockGetPlanFromPriceId.mockReturnValue("PLUS");
    mockGetTrialDays.mockReturnValue(14);

    // Mock price ID to plan mapping
    const proPriceId = process.env["STRIPE_PRICE_ID_PRO_MONTHLY"] || "price_pro_monthly";
    await createCheckoutAction({ priceId: proPriceId });

    const callArgs = mockStripeCheckoutSessions.create.mock.calls[0]![0];
    expect(callArgs.subscription_data?.trial_period_days).toBe(14);
  });

  it("includes trial period for PRO yearly plan", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user_123", email: "test@example.com" },
    });
    mockDbSubscription.findUnique.mockResolvedValue(null);
    mockStripeCheckoutSessions.create.mockResolvedValue({
      id: "cs_test",
      url: "https://checkout.stripe.com/session/cs_test",
    });
    mockGetPlanFromPriceId.mockReturnValue("PRO");
    mockGetTrialDays.mockReturnValue(14);

    const enterprisePriceId = process.env["STRIPE_PRICE_ID_ENTERPRISE_YEARLY"] || "price_enterprise_yearly";
    await createCheckoutAction({ priceId: enterprisePriceId });

    const callArgs = mockStripeCheckoutSessions.create.mock.calls[0]![0];
    expect(callArgs.subscription_data?.trial_period_days).toBe(14);
  });

  it("does not include trial period for existing customers", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user_123", email: "test@example.com" },
    });
    // Existing customer with previous subscription
    mockDbSubscription.findUnique.mockResolvedValue({
      id: "sub_123",
      userId: "user_123",
      stripeCustomerId: "cus_existing_123",
      stripeSubscriptionId: "sub_old_123",
      plan: "FREE",
      status: "INACTIVE",
    });
    mockStripeCheckoutSessions.create.mockResolvedValue({
      id: "cs_test",
      url: "https://checkout.stripe.com/session/cs_test",
    });

    const proPriceId = process.env["STRIPE_PRICE_ID_PRO_MONTHLY"] || "price_pro_monthly";
    await createCheckoutAction({ priceId: proPriceId });

    const callArgs = mockStripeCheckoutSessions.create.mock.calls[0]![0];
    expect(callArgs.subscription_data?.trial_period_days).toBeUndefined();
  });

  it("does not include trial for existing active subscriptions", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user_123", email: "test@example.com" },
    });
    // Active subscription
    mockDbSubscription.findUnique.mockResolvedValue({
      id: "sub_123",
      userId: "user_123",
      stripeCustomerId: "cus_existing_123",
      stripeSubscriptionId: "sub_active_123",
      plan: "PLUS",
      status: "ACTIVE",
    });
    mockStripeCheckoutSessions.create.mockResolvedValue({
      id: "cs_test",
      url: "https://checkout.stripe.com/session/cs_test",
    });

    const enterprisePriceId = process.env["STRIPE_PRICE_ID_ENTERPRISE_MONTHLY"] || "price_enterprise_monthly";
    await createCheckoutAction({ priceId: enterprisePriceId });

    const callArgs = mockStripeCheckoutSessions.create.mock.calls[0]![0];
    expect(callArgs.subscription_data?.trial_period_days).toBeUndefined();
  });
});
