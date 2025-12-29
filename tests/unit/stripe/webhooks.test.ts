/**
 * TDD: RED PHASE - Stripe Webhooks Tests
 * These tests are written BEFORE implementation
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import type Stripe from "stripe";

// Hoist mocks for vitest
const { mockDbSubscription, mockDbUser, mockStripeSubscriptions, mockSendSubscriptionCancelledEmail, mockRevalidatePath } = vi.hoisted(() => ({
  mockDbSubscription: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
  },
  mockDbUser: {
    findUnique: vi.fn(),
  },
  mockStripeSubscriptions: {
    retrieve: vi.fn(),
  },
  mockSendSubscriptionCancelledEmail: vi.fn(),
  mockRevalidatePath: vi.fn(),
}));

// Mock database
vi.mock("@/lib/db", () => ({
  db: {
    subscription: mockDbSubscription,
    user: mockDbUser,
  },
}));

// Mock email service
vi.mock("@/lib/email", () => ({
  sendSubscriptionConfirmationEmail: vi.fn(),
  sendSubscriptionCancelledEmail: mockSendSubscriptionCancelledEmail,
}));

// Mock Stripe client
vi.mock("@/lib/stripe/client", () => ({
  stripe: {
    subscriptions: mockStripeSubscriptions,
  },
}));

// Mock config
vi.mock("@/lib/stripe/config", () => ({
  STRIPE_PRICE_IDS: {
    PRO: {
      monthly: "price_pro_monthly",
      yearly: "price_pro_yearly",
    },
    ENTERPRISE: {
      monthly: "price_enterprise_monthly",
      yearly: "price_enterprise_yearly",
    },
  },
}));

// Mock next/cache for revalidatePath
vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

import {
  handleCheckoutCompleted,
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaid,
  handleInvoicePaymentFailed,
  processWebhookEvent,
} from "@/lib/stripe/webhooks";

describe("Stripe Webhooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("handleCheckoutCompleted", () => {
    it("skips non-subscription checkouts", async () => {
      const session = {
        id: "cs_test",
        mode: "payment",
        metadata: { userId: "user_123" },
      } as unknown as Stripe.Checkout.Session;

      await handleCheckoutCompleted(session);

      expect(mockDbSubscription.upsert).not.toHaveBeenCalled();
    });

    it("skips sessions without userId metadata", async () => {
      const session = {
        id: "cs_test",
        mode: "subscription",
        metadata: {},
        customer: "cus_123",
        subscription: "sub_123",
      } as unknown as Stripe.Checkout.Session;

      await handleCheckoutCompleted(session);

      expect(mockDbSubscription.upsert).not.toHaveBeenCalled();
    });

    it("skips sessions without customer ID", async () => {
      const session = {
        id: "cs_test",
        mode: "subscription",
        metadata: { userId: "user_123" },
        customer: null,
        subscription: "sub_123",
      } as unknown as Stripe.Checkout.Session;

      await handleCheckoutCompleted(session);

      expect(mockDbSubscription.upsert).not.toHaveBeenCalled();
    });

    it("creates subscription after successful checkout", async () => {
      const session = {
        id: "cs_test",
        mode: "subscription",
        metadata: { userId: "user_123" },
        customer: "cus_456",
        subscription: "sub_789",
      } as unknown as Stripe.Checkout.Session;

      mockStripeSubscriptions.retrieve.mockResolvedValue({
        id: "sub_789",
        status: "active",
        current_period_end: 1704067200,
        items: {
          data: [{ price: { id: "price_pro_monthly" } }],
        },
      });

      await handleCheckoutCompleted(session);

      expect(mockStripeSubscriptions.retrieve).toHaveBeenCalledWith("sub_789");
      expect(mockDbSubscription.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user_123" },
          create: expect.objectContaining({
            userId: "user_123",
            stripeCustomerId: "cus_456",
            stripeSubscriptionId: "sub_789",
            status: "ACTIVE",
            plan: "PRO",
          }),
        })
      );
    });

    it("calls revalidatePath for relevant pages after creating subscription", async () => {
      const session = {
        id: "cs_test",
        mode: "subscription",
        metadata: { userId: "user_123" },
        customer: "cus_456",
        subscription: "sub_789",
      } as unknown as Stripe.Checkout.Session;

      mockStripeSubscriptions.retrieve.mockResolvedValue({
        id: "sub_789",
        status: "active",
        current_period_end: 1704067200,
        items: {
          data: [{ price: { id: "price_pro_monthly" } }],
        },
      });

      await handleCheckoutCompleted(session);

      expect(mockRevalidatePath).toHaveBeenCalledWith("/pricing");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/settings/billing");
    });
  });

  describe("handleSubscriptionCreated", () => {
    it("skips subscription without userId in metadata", async () => {
      const subscription = {
        id: "sub_test",
        metadata: {},
        status: "active",
        current_period_end: 1704067200,
        items: { data: [] },
      } as unknown as Stripe.Subscription;

      await handleSubscriptionCreated(subscription);

      expect(mockDbSubscription.upsert).not.toHaveBeenCalled();
    });

    it("creates subscription record with user metadata", async () => {
      const subscription = {
        id: "sub_test",
        metadata: { userId: "user_123" },
        customer: "cus_456",
        status: "active",
        current_period_end: 1704067200,
        items: {
          data: [{ price: { id: "price_pro_monthly" } }],
        },
      } as unknown as Stripe.Subscription;

      await handleSubscriptionCreated(subscription);

      expect(mockDbSubscription.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user_123" },
          create: expect.objectContaining({
            userId: "user_123",
            stripeSubscriptionId: "sub_test",
            status: "ACTIVE",
            plan: "PRO",
          }),
        })
      );
    });
  });

  describe("handleSubscriptionUpdated", () => {
    it("skips when no matching subscription found", async () => {
      mockDbSubscription.findFirst.mockResolvedValue(null);

      const subscription = {
        id: "sub_unknown",
        status: "active",
        current_period_end: 1704067200,
        items: { data: [] },
      } as unknown as Stripe.Subscription;

      await handleSubscriptionUpdated(subscription);

      expect(mockDbSubscription.update).not.toHaveBeenCalled();
    });

    it("updates existing subscription", async () => {
      mockDbSubscription.findFirst.mockResolvedValue({ id: "sub_db_123" });

      const subscription = {
        id: "sub_stripe_123",
        status: "active",
        current_period_end: 1704067200,
        items: {
          data: [{ price: { id: "price_enterprise_yearly" } }],
        },
      } as unknown as Stripe.Subscription;

      await handleSubscriptionUpdated(subscription);

      expect(mockDbSubscription.update).toHaveBeenCalledWith({
        where: { id: "sub_db_123" },
        data: expect.objectContaining({
          status: "ACTIVE",
          plan: "ENTERPRISE",
          stripePriceId: "price_enterprise_yearly",
        }),
      });
    });

    it("handles plan downgrade", async () => {
      mockDbSubscription.findFirst.mockResolvedValue({
        id: "sub_db_123",
        plan: "ENTERPRISE",
      });

      const subscription = {
        id: "sub_stripe_123",
        status: "active",
        current_period_end: 1704067200,
        items: {
          data: [{ price: { id: "price_pro_monthly" } }],
        },
      } as unknown as Stripe.Subscription;

      await handleSubscriptionUpdated(subscription);

      expect(mockDbSubscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            plan: "PRO",
          }),
        })
      );
    });

    it("calls revalidatePath for relevant pages after updating subscription", async () => {
      mockDbSubscription.findFirst.mockResolvedValue({ id: "sub_db_123" });

      const subscription = {
        id: "sub_stripe_123",
        status: "active",
        current_period_end: 1704067200,
        items: {
          data: [{ price: { id: "price_pro_monthly" } }],
        },
      } as unknown as Stripe.Subscription;

      await handleSubscriptionUpdated(subscription);

      expect(mockRevalidatePath).toHaveBeenCalledWith("/pricing");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/settings/billing");
    });

    it("logs debug info when subscription lookup fails", async () => {
      const consoleSpy = vi.spyOn(console, "log");
      mockDbSubscription.findFirst.mockResolvedValue(null);

      const subscription = {
        id: "sub_unknown_123",
        status: "active",
        current_period_end: 1704067200,
        items: { data: [] },
      } as unknown as Stripe.Subscription;

      await handleSubscriptionUpdated(subscription);

      // Verify improved debug logging with stripeSubscriptionId in the message
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[handleSubscriptionUpdated]")
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("sub_unknown_123")
      );
    });

    // Customer Portal cancellation tests (cancel_at_period_end)
    describe("cancel_at_period_end handling (Customer Portal cancellation)", () => {
      it("sends cancellation email when cancel_at_period_end is true", async () => {
        mockDbSubscription.findFirst.mockResolvedValue({
          id: "sub_db_123",
          userId: "user_123",
          plan: "PRO",
        });
        mockDbUser.findUnique.mockResolvedValue({
          email: "user@example.com",
          name: "Test User",
        });

        const subscription = {
          id: "sub_stripe_123",
          status: "active",
          cancel_at_period_end: true,
          current_period_end: 1704067200, // January 1, 2024
          items: {
            data: [{ price: { id: "price_pro_monthly" } }],
          },
        } as unknown as Stripe.Subscription;

        await handleSubscriptionUpdated(subscription);

        expect(mockDbUser.findUnique).toHaveBeenCalledWith({
          where: { id: "user_123" },
          select: { email: true, name: true },
        });
        expect(mockSendSubscriptionCancelledEmail).toHaveBeenCalledWith(
          "user@example.com",
          expect.objectContaining({
            name: "Test User",
            planName: "PRO",
          })
        );
      });

      it("includes the period end date in the cancellation email", async () => {
        mockDbSubscription.findFirst.mockResolvedValue({
          id: "sub_db_123",
          userId: "user_123",
          plan: "PRO",
        });
        mockDbUser.findUnique.mockResolvedValue({
          email: "user@example.com",
          name: "Test User",
        });

        // Use a specific timestamp: January 15, 2024 00:00:00 UTC
        const periodEndTimestamp = 1705276800;
        const subscription = {
          id: "sub_stripe_123",
          status: "active",
          cancel_at_period_end: true,
          current_period_end: periodEndTimestamp,
          items: {
            data: [{ price: { id: "price_pro_monthly" } }],
          },
        } as unknown as Stripe.Subscription;

        await handleSubscriptionUpdated(subscription);

        expect(mockSendSubscriptionCancelledEmail).toHaveBeenCalledWith(
          "user@example.com",
          expect.objectContaining({
            endDate: expect.any(String),
          })
        );

        // Verify the endDate is properly formatted
        const emailCall = mockSendSubscriptionCancelledEmail.mock.calls[0];
        const emailData = emailCall[1];
        expect(emailData.endDate).toBeTruthy();
      });

      it("does NOT send cancellation email when cancel_at_period_end is false", async () => {
        mockDbSubscription.findFirst.mockResolvedValue({
          id: "sub_db_123",
          userId: "user_123",
          plan: "PRO",
        });

        const subscription = {
          id: "sub_stripe_123",
          status: "active",
          cancel_at_period_end: false,
          current_period_end: 1704067200,
          items: {
            data: [{ price: { id: "price_pro_monthly" } }],
          },
        } as unknown as Stripe.Subscription;

        await handleSubscriptionUpdated(subscription);

        expect(mockSendSubscriptionCancelledEmail).not.toHaveBeenCalled();
      });

      it("does NOT reset plan to FREE when cancel_at_period_end is true (user keeps access)", async () => {
        mockDbSubscription.findFirst.mockResolvedValue({
          id: "sub_db_123",
          userId: "user_123",
          plan: "PRO",
        });
        mockDbUser.findUnique.mockResolvedValue({
          email: "user@example.com",
          name: "Test User",
        });

        const subscription = {
          id: "sub_stripe_123",
          status: "active",
          cancel_at_period_end: true,
          current_period_end: 1704067200,
          items: {
            data: [{ price: { id: "price_pro_monthly" } }],
          },
        } as unknown as Stripe.Subscription;

        await handleSubscriptionUpdated(subscription);

        // Verify the plan is NOT reset to FREE - it should remain PRO
        expect(mockDbSubscription.update).toHaveBeenCalledWith({
          where: { id: "sub_db_123" },
          data: expect.objectContaining({
            plan: "PRO", // Plan should stay PRO, not be reset to FREE
            status: "ACTIVE", // Status should remain ACTIVE
          }),
        });
      });

      it("does not send email when user not found and cancel_at_period_end is true", async () => {
        mockDbSubscription.findFirst.mockResolvedValue({
          id: "sub_db_123",
          userId: "user_123",
          plan: "PRO",
        });
        mockDbUser.findUnique.mockResolvedValue(null);

        const subscription = {
          id: "sub_stripe_123",
          status: "active",
          cancel_at_period_end: true,
          current_period_end: 1704067200,
          items: {
            data: [{ price: { id: "price_pro_monthly" } }],
          },
        } as unknown as Stripe.Subscription;

        await handleSubscriptionUpdated(subscription);

        expect(mockSendSubscriptionCancelledEmail).not.toHaveBeenCalled();
      });

      it("handles email sending failure gracefully when cancel_at_period_end is true", async () => {
        mockDbSubscription.findFirst.mockResolvedValue({
          id: "sub_db_123",
          userId: "user_123",
          plan: "PRO",
        });
        mockDbUser.findUnique.mockResolvedValue({
          email: "user@example.com",
          name: "Test User",
        });
        mockSendSubscriptionCancelledEmail.mockRejectedValue(new Error("Email service error"));

        const subscription = {
          id: "sub_stripe_123",
          status: "active",
          cancel_at_period_end: true,
          current_period_end: 1704067200,
          items: {
            data: [{ price: { id: "price_pro_monthly" } }],
          },
        } as unknown as Stripe.Subscription;

        // Should not throw - graceful degradation
        await expect(handleSubscriptionUpdated(subscription)).resolves.not.toThrow();

        // Database update should still have been called
        expect(mockDbSubscription.update).toHaveBeenCalled();
      });
    });
  });

  describe("handleSubscriptionDeleted", () => {
    it("skips when no matching subscription found", async () => {
      mockDbSubscription.findFirst.mockResolvedValue(null);

      const subscription = {
        id: "sub_unknown",
      } as Stripe.Subscription;

      await handleSubscriptionDeleted(subscription);

      expect(mockDbSubscription.update).not.toHaveBeenCalled();
    });

    it("sets status to CANCELED, resets plan to FREE, and clears subscription ID", async () => {
      mockDbSubscription.findFirst.mockResolvedValue({
        id: "sub_db_123",
        userId: "user_123",
        plan: "PRO",
      });
      mockDbUser.findUnique.mockResolvedValue({
        email: "user@example.com",
        name: "Test User",
      });

      const subscription = {
        id: "sub_stripe_123",
        current_period_end: 1704067200,
      } as Stripe.Subscription;

      await handleSubscriptionDeleted(subscription);

      expect(mockDbSubscription.update).toHaveBeenCalledWith({
        where: { id: "sub_db_123" },
        data: {
          status: "CANCELED",
          plan: "FREE",
          stripeSubscriptionId: null,
        },
      });
    });

    it("does not send cancellation email (email is sent in handleSubscriptionUpdated)", async () => {
      mockDbSubscription.findFirst.mockResolvedValue({
        id: "sub_db_123",
        userId: "user_123",
        plan: "PRO",
      });

      const subscription = {
        id: "sub_stripe_123",
        current_period_end: 1704067200,
      } as Stripe.Subscription;

      await handleSubscriptionDeleted(subscription);

      // Email should NOT be sent from handleSubscriptionDeleted
      // It's sent from handleSubscriptionUpdated when cancel_at_period_end is set
      expect(mockSendSubscriptionCancelledEmail).not.toHaveBeenCalled();
    });

    it("calls revalidatePath for relevant pages after deleting subscription", async () => {
      mockDbSubscription.findFirst.mockResolvedValue({
        id: "sub_db_123",
        userId: "user_123",
        plan: "PRO",
      });

      const subscription = {
        id: "sub_stripe_123",
        current_period_end: 1704067200,
      } as Stripe.Subscription;

      await handleSubscriptionDeleted(subscription);

      expect(mockRevalidatePath).toHaveBeenCalledWith("/pricing");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/settings/billing");
    });

    it("logs debug info when subscription lookup fails for deletion", async () => {
      const consoleSpy = vi.spyOn(console, "log");
      mockDbSubscription.findFirst.mockResolvedValue(null);

      const subscription = {
        id: "sub_unknown_456",
        current_period_end: 1704067200,
      } as Stripe.Subscription;

      await handleSubscriptionDeleted(subscription);

      // Verify improved debug logging with stripeSubscriptionId in the message
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[handleSubscriptionDeleted]")
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("sub_unknown_456")
      );
    });
  });

  describe("handleInvoicePaid", () => {
    it("skips when no subscription ID in invoice", async () => {
      const invoice = {
        id: "in_test",
        subscription: null,
      } as Stripe.Invoice;

      await handleInvoicePaid(invoice);

      expect(mockDbSubscription.findFirst).not.toHaveBeenCalled();
    });

    it("reactivates PAST_DUE subscription after payment", async () => {
      mockDbSubscription.findFirst.mockResolvedValue({
        id: "sub_db_123",
        status: "PAST_DUE",
      });

      const invoice = {
        id: "in_test",
        subscription: "sub_stripe_123",
      } as Stripe.Invoice;

      await handleInvoicePaid(invoice);

      expect(mockDbSubscription.update).toHaveBeenCalledWith({
        where: { id: "sub_db_123" },
        data: { status: "ACTIVE" },
      });
    });

    it("handles subscription as object", async () => {
      mockDbSubscription.findFirst.mockResolvedValue({
        id: "sub_db_123",
        status: "PAST_DUE",
      });

      const invoice = {
        id: "in_test",
        subscription: { id: "sub_stripe_123" },
      } as unknown as Stripe.Invoice;

      await handleInvoicePaid(invoice);

      expect(mockDbSubscription.findFirst).toHaveBeenCalledWith({
        where: {
          stripeSubscriptionId: "sub_stripe_123",
          status: "PAST_DUE",
        },
      });
    });
  });

  describe("handleInvoicePaymentFailed", () => {
    it("skips when no subscription ID in invoice", async () => {
      const invoice = {
        id: "in_test",
        subscription: null,
      } as Stripe.Invoice;

      await handleInvoicePaymentFailed(invoice);

      expect(mockDbSubscription.findFirst).not.toHaveBeenCalled();
    });

    it("marks subscription as PAST_DUE", async () => {
      mockDbSubscription.findFirst.mockResolvedValue({
        id: "sub_db_123",
        status: "ACTIVE",
      });

      const invoice = {
        id: "in_test",
        subscription: "sub_stripe_123",
      } as Stripe.Invoice;

      await handleInvoicePaymentFailed(invoice);

      expect(mockDbSubscription.update).toHaveBeenCalledWith({
        where: { id: "sub_db_123" },
        data: { status: "PAST_DUE" },
      });
    });
  });

  describe("processWebhookEvent", () => {
    it("processes checkout.session.completed event", async () => {
      const event = {
        id: "evt_test",
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_test",
            mode: "payment", // Non-subscription, will be skipped
            metadata: {},
          },
        },
      } as Stripe.Event;

      const result = await processWebhookEvent(event);

      expect(result.success).toBe(true);
      expect(result.eventId).toBe("evt_test");
      expect(result.eventType).toBe("checkout.session.completed");
    });

    it("processes customer.subscription.updated event", async () => {
      mockDbSubscription.findFirst.mockResolvedValue(null);

      const event = {
        id: "evt_test",
        type: "customer.subscription.updated",
        data: {
          object: {
            id: "sub_test",
            status: "active",
            current_period_end: 1704067200,
            items: { data: [] },
          },
        },
      } as unknown as Stripe.Event;

      const result = await processWebhookEvent(event);

      expect(result.success).toBe(true);
      expect(result.eventType).toBe("customer.subscription.updated");
    });

    it("handles unhandled event types gracefully", async () => {
      const event = {
        id: "evt_test",
        type: "some.unknown.event",
        data: { object: {} },
      } as unknown as Stripe.Event;

      const result = await processWebhookEvent(event);

      expect(result.success).toBe(true);
      expect(result.eventType).toBe("some.unknown.event");
    });

    it("returns error result on handler failure", async () => {
      mockDbSubscription.findFirst.mockRejectedValue(new Error("Database error"));

      const event = {
        id: "evt_test",
        type: "customer.subscription.updated",
        data: {
          object: {
            id: "sub_test",
            status: "active",
            current_period_end: 1704067200,
            items: { data: [] },
          },
        },
      } as unknown as Stripe.Event;

      const result = await processWebhookEvent(event);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Database error");
    });
  });
});
