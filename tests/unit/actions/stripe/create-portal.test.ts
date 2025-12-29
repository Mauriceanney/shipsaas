/**
 * Unit tests for createPortalAction
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

// Hoist mocks for vitest
const { mockAuth, mockDbSubscription, mockStripeBillingPortal } = vi.hoisted(
  () => ({
    mockAuth: vi.fn(),
    mockDbSubscription: {
      findUnique: vi.fn(),
    },
    mockStripeBillingPortal: {
      sessions: {
        create: vi.fn(),
      },
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

// Mock Stripe client and config
vi.mock("@/lib/stripe", () => ({
  stripe: {
    billingPortal: mockStripeBillingPortal,
  },
  PORTAL_RETURN_URL: "/settings/billing",
}));

import {
  createPortalAction,
  redirectToPortal,
} from "@/actions/stripe/create-portal";

describe("createPortalAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("authentication", () => {
    it("returns error when user is not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const result = await createPortalAction();

      expect(result).toEqual({
        success: false,
        error: "Authentication required",
      });
      expect(mockStripeBillingPortal.sessions.create).not.toHaveBeenCalled();
    });

    it("returns error when session has no user", async () => {
      mockAuth.mockResolvedValue({ user: null });

      const result = await createPortalAction();

      expect(result).toEqual({
        success: false,
        error: "Authentication required",
      });
    });

    it("handles empty user object by failing at subscription lookup", async () => {
      // Empty user object passes the auth check but fails when looking up subscription
      // because session.user.id is undefined
      mockAuth.mockResolvedValue({ user: {} });
      mockDbSubscription.findUnique.mockResolvedValue(null);

      const result = await createPortalAction();

      expect(result).toEqual({
        success: false,
        error: "No active subscription found",
      });
    });
  });

  describe("subscription validation", () => {
    it("returns error when user has no subscription", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user_123", email: "test@example.com" },
      });
      mockDbSubscription.findUnique.mockResolvedValue(null);

      const result = await createPortalAction();

      expect(result).toEqual({
        success: false,
        error: "No active subscription found",
      });
      expect(mockDbSubscription.findUnique).toHaveBeenCalledWith({
        where: { userId: "user_123" },
      });
      expect(mockStripeBillingPortal.sessions.create).not.toHaveBeenCalled();
    });

    it("returns error when subscription has no stripeCustomerId", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user_123", email: "test@example.com" },
      });
      mockDbSubscription.findUnique.mockResolvedValue({
        id: "sub_123",
        userId: "user_123",
        stripeCustomerId: null,
      });

      const result = await createPortalAction();

      expect(result).toEqual({
        success: false,
        error: "No active subscription found",
      });
    });

    it("returns error when stripeCustomerId is empty string", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user_123", email: "test@example.com" },
      });
      mockDbSubscription.findUnique.mockResolvedValue({
        id: "sub_123",
        userId: "user_123",
        stripeCustomerId: "",
      });

      const result = await createPortalAction();

      expect(result).toEqual({
        success: false,
        error: "No active subscription found",
      });
    });
  });

  describe("success path", () => {
    it("creates portal session with default return URL", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user_123", email: "test@example.com" },
      });
      mockDbSubscription.findUnique.mockResolvedValue({
        id: "sub_123",
        userId: "user_123",
        stripeCustomerId: "cus_test_123",
      });
      mockStripeBillingPortal.sessions.create.mockResolvedValue({
        id: "bps_test_123",
        url: "https://billing.stripe.com/session/bps_test_123",
      });

      const result = await createPortalAction();

      expect(result).toEqual({
        success: true,
        data: { url: "https://billing.stripe.com/session/bps_test_123" },
      });
      expect(mockStripeBillingPortal.sessions.create).toHaveBeenCalledWith({
        customer: "cus_test_123",
        return_url: expect.stringContaining("/settings/billing"),
      });
    });

    it("creates portal session with custom return URL", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user_123", email: "test@example.com" },
      });
      mockDbSubscription.findUnique.mockResolvedValue({
        id: "sub_123",
        userId: "user_123",
        stripeCustomerId: "cus_test_456",
      });
      mockStripeBillingPortal.sessions.create.mockResolvedValue({
        id: "bps_test_456",
        url: "https://billing.stripe.com/session/bps_test_456",
      });

      const result = await createPortalAction({
        returnUrl: "/dashboard/subscription",
      });

      expect(result).toEqual({
        success: true,
        data: { url: "https://billing.stripe.com/session/bps_test_456" },
      });
      expect(mockStripeBillingPortal.sessions.create).toHaveBeenCalledWith({
        customer: "cus_test_456",
        return_url: expect.stringContaining("/dashboard/subscription"),
      });
    });

    it("handles undefined input gracefully", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user_123", email: "test@example.com" },
      });
      mockDbSubscription.findUnique.mockResolvedValue({
        stripeCustomerId: "cus_test",
      });
      mockStripeBillingPortal.sessions.create.mockResolvedValue({
        url: "https://billing.stripe.com/session/test",
      });

      const result = await createPortalAction(undefined);

      expect(result.success).toBe(true);
      expect(mockStripeBillingPortal.sessions.create).toHaveBeenCalledWith({
        customer: "cus_test",
        return_url: expect.stringContaining("/settings/billing"),
      });
    });

    it("handles empty object input gracefully", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user_123", email: "test@example.com" },
      });
      mockDbSubscription.findUnique.mockResolvedValue({
        stripeCustomerId: "cus_test",
      });
      mockStripeBillingPortal.sessions.create.mockResolvedValue({
        url: "https://billing.stripe.com/session/test",
      });

      const result = await createPortalAction({});

      expect(result.success).toBe(true);
    });
  });

  describe("error handling", () => {
    it("handles Stripe API errors gracefully", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user_123", email: "test@example.com" },
      });
      mockDbSubscription.findUnique.mockResolvedValue({
        stripeCustomerId: "cus_test_123",
      });
      mockStripeBillingPortal.sessions.create.mockRejectedValue(
        new Error("Stripe API error")
      );

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const result = await createPortalAction();

      expect(result).toEqual({
        success: false,
        error: "Failed to create portal session",
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        "Create portal error:",
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

      const result = await createPortalAction();

      expect(result).toEqual({
        success: false,
        error: "Failed to create portal session",
      });

      consoleSpy.mockRestore();
    });

    it("handles invalid customer ID error from Stripe", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user_123", email: "test@example.com" },
      });
      mockDbSubscription.findUnique.mockResolvedValue({
        stripeCustomerId: "cus_invalid",
      });
      mockStripeBillingPortal.sessions.create.mockRejectedValue(
        new Error("No such customer: cus_invalid")
      );

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const result = await createPortalAction();

      expect(result).toEqual({
        success: false,
        error: "Failed to create portal session",
      });

      consoleSpy.mockRestore();
    });

    it("handles auth errors gracefully", async () => {
      mockAuth.mockRejectedValue(new Error("Auth service unavailable"));

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const result = await createPortalAction();

      expect(result).toEqual({
        success: false,
        error: "Failed to create portal session",
      });

      consoleSpy.mockRestore();
    });
  });
});

describe("redirectToPortal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Note: redirectToPortal uses Next.js redirect() which throws a special error
  // Testing the redirect behavior is complex due to the "never" return type
  // The function is a thin wrapper around createPortalAction

  it("calls createPortalAction with the provided returnUrl", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user_123", email: "test@example.com" },
    });
    mockDbSubscription.findUnique.mockResolvedValue({
      stripeCustomerId: "cus_test_123",
    });
    mockStripeBillingPortal.sessions.create.mockResolvedValue({
      url: "https://billing.stripe.com/session/test",
    });

    // redirect() throws a special Next.js error
    const { redirect } = await import("next/navigation");
    vi.mocked(redirect).mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    try {
      await redirectToPortal("/custom/return");
    } catch {
      // Expected to throw due to redirect
    }

    expect(mockStripeBillingPortal.sessions.create).toHaveBeenCalledWith({
      customer: "cus_test_123",
      return_url: expect.stringContaining("/custom/return"),
    });
  });

  it("calls createPortalAction without returnUrl when not provided", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user_123", email: "test@example.com" },
    });
    mockDbSubscription.findUnique.mockResolvedValue({
      stripeCustomerId: "cus_test_123",
    });
    mockStripeBillingPortal.sessions.create.mockResolvedValue({
      url: "https://billing.stripe.com/session/test",
    });

    const { redirect } = await import("next/navigation");
    vi.mocked(redirect).mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    try {
      await redirectToPortal();
    } catch {
      // Expected to throw due to redirect
    }

    expect(mockStripeBillingPortal.sessions.create).toHaveBeenCalledWith({
      customer: "cus_test_123",
      return_url: expect.stringContaining("/settings/billing"),
    });
  });
});
