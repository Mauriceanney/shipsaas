import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockAuth, mockDb, mockStripe, mockSendRefundConfirmation, mockCreateAuditLog, mockRevalidatePath } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockDb: {
    subscription: {
      findUnique: vi.fn(),
    },
  },
  mockStripe: {
    paymentIntents: {
      list: vi.fn(),
    },
    refunds: {
      create: vi.fn(),
    },
  },
  mockSendRefundConfirmation: vi.fn(),
  mockCreateAuditLog: vi.fn(),
  mockRevalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/admin", () => ({
  requireAdmin: async () => {
    const session = await mockAuth();
    if (!session) throw new Error("Unauthorized");
    if (session.user.role !== "ADMIN") throw new Error("Forbidden");
    return session;
  },
}));

vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

vi.mock("@/lib/stripe/client", () => ({
  stripe: mockStripe,
}));

vi.mock("@/lib/email", () => ({
  sendRefundConfirmationEmail: mockSendRefundConfirmation,
}));

vi.mock("@/lib/audit", () => ({
  createAuditLog: mockCreateAuditLog,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

import { createRefund } from "@/actions/admin/refund";

describe("createRefund", () => {
  const mockAdminSession = {
    user: { id: "admin-1", email: "admin@example.com", role: "ADMIN" },
  };

  const mockSubscription = {
    id: "sub-1",
    userId: "user-1",
    stripeCustomerId: "cus_123",
    stripeSubscriptionId: "sub_123",
    stripePriceId: "price_123",
    plan: "PRO",
    status: "ACTIVE",
    user: {
      email: "user@example.com",
      name: "Test User",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("authentication", () => {
    it("returns error when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const result = await createRefund({
        subscriptionId: "sub-1",
        reason: "Customer request",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Failed to process refund");
      }
    });
  });

  describe("validation", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockAdminSession);
    });

    it("returns error for missing subscriptionId", async () => {
      const result = await createRefund({
        subscriptionId: "",
        reason: "Customer request",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Subscription ID");
      }
    });

    it("returns error for missing reason", async () => {
      const result = await createRefund({
        subscriptionId: "sub-1",
        reason: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("reason");
      }
    });

    it("returns error for reason exceeding max length", async () => {
      const result = await createRefund({
        subscriptionId: "sub-1",
        reason: "a".repeat(501),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("500");
      }
    });

    it("returns error for invalid partial refund amount", async () => {
      const result = await createRefund({
        subscriptionId: "sub-1",
        reason: "Partial refund",
        amount: -100,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Number must be greater than 0");
      }
    });

    it("accepts valid partial refund amount", async () => {
      mockDb.subscription.findUnique.mockResolvedValue(null);

      const result = await createRefund({
        subscriptionId: "sub-1",
        reason: "Partial refund",
        amount: 1000,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).not.toContain("Number must be greater than 0");
      }
    });
  });

  describe("business logic", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockAdminSession);
    });

    it("returns error when subscription not found", async () => {
      mockDb.subscription.findUnique.mockResolvedValue(null);

      const result = await createRefund({
        subscriptionId: "sub-1",
        reason: "Customer request",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Subscription not found");
      }
    });

    it("returns error when subscription has no Stripe customer ID", async () => {
      mockDb.subscription.findUnique.mockResolvedValue({
        ...mockSubscription,
        stripeCustomerId: null,
      });

      const result = await createRefund({
        subscriptionId: "sub-1",
        reason: "Customer request",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("No Stripe customer found");
      }
    });

    it("returns error when no payment intents found", async () => {
      mockDb.subscription.findUnique.mockResolvedValue(mockSubscription);
      mockStripe.paymentIntents.list.mockResolvedValue({
        data: [],
      });

      const result = await createRefund({
        subscriptionId: "sub-1",
        reason: "Customer request",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("No payments found to refund");
      }
    });
  });

  describe("success cases", () => {
    const mockPaymentIntent = {
      id: "pi_123",
      amount: 2000,
      currency: "usd",
      status: "succeeded",
    };

    const mockRefund = {
      id: "re_123",
      amount: 2000,
      currency: "usd",
      status: "succeeded",
      created: Math.floor(Date.now() / 1000),
    };

    beforeEach(() => {
      mockAuth.mockResolvedValue(mockAdminSession);
      mockDb.subscription.findUnique.mockResolvedValue(mockSubscription);
      mockStripe.paymentIntents.list.mockResolvedValue({
        data: [mockPaymentIntent],
      });
      mockCreateAuditLog.mockResolvedValue(undefined);
      mockSendRefundConfirmation.mockResolvedValue({
        success: true,
      });
    });

    it("creates full refund successfully", async () => {
      mockStripe.refunds.create.mockResolvedValue(mockRefund);

      const result = await createRefund({
        subscriptionId: "sub-1",
        reason: "Customer request",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.refundId).toBe("re_123");
        expect(result.data.amount).toBe(2000);
      }

      expect(mockStripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: "pi_123",
        reason: "requested_by_customer",
        metadata: {
          adminId: "admin-1",
          adminEmail: "admin@example.com",
          reason: "Customer request",
          subscriptionId: "sub-1",
        },
      });
    });

    it("creates partial refund successfully", async () => {
      mockStripe.refunds.create.mockResolvedValue({
        ...mockRefund,
        amount: 1000,
      });

      const result = await createRefund({
        subscriptionId: "sub-1",
        reason: "Partial refund",
        amount: 1000,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(1000);
      }

      expect(mockStripe.refunds.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 1000,
        })
      );
    });

    it("sends refund confirmation email", async () => {
      mockStripe.refunds.create.mockResolvedValue(mockRefund);

      await createRefund({
        subscriptionId: "sub-1",
        reason: "Customer request",
      });

      expect(mockSendRefundConfirmation).toHaveBeenCalledWith(
        "user@example.com",
        expect.objectContaining({
          name: "Test User",
          planName: "PRO",
          refundAmount: "USD 20.00",
        })
      );
    });


    it("handles email failure gracefully", async () => {
      mockStripe.refunds.create.mockResolvedValue(mockRefund);
      mockSendRefundConfirmation.mockRejectedValue(
        new Error("Email service down")
      );

      const result = await createRefund({
        subscriptionId: "sub-1",
        reason: "Customer request",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("error handling", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockAdminSession);
      mockDb.subscription.findUnique.mockResolvedValue(mockSubscription);
      mockStripe.paymentIntents.list.mockResolvedValue({
        data: [
          {
            id: "pi_123",
            amount: 2000,
            currency: "usd",
            status: "succeeded",
          },
        ],
      });
    });

    it("handles Stripe API errors gracefully", async () => {
      mockStripe.refunds.create.mockRejectedValue(
        new Error("Stripe API error")
      );

      const result = await createRefund({
        subscriptionId: "sub-1",
        reason: "Customer request",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Failed to process refund");
      }
    });

    it("handles database errors gracefully", async () => {
      mockDb.subscription.findUnique.mockRejectedValue(
        new Error("Database error")
      );

      const result = await createRefund({
        subscriptionId: "sub-1",
        reason: "Customer request",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Failed to process refund");
      }
    });
  });
});
