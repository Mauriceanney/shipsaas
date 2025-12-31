/**
 * TDD: RED PHASE - Stripe Webhooks Tests
 * These tests are written BEFORE implementation
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import type Stripe from "stripe";

// Hoist mocks for vitest
const { mockDbSubscription, mockDbUser, mockDbDunningEmail, mockStripeSubscriptions, mockSendSubscriptionCancelledEmail, mockSendPaymentFailedEmail, mockSendInvoiceReceiptEmail, mockSendPaymentRecoveryEmail, mockRevalidatePath } = vi.hoisted(() => ({
  mockDbSubscription: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
  },
  mockDbUser: {
    findUnique: vi.fn(),
  },
  mockDbDunningEmail: {
    create: vi.fn(),
  },
  mockStripeSubscriptions: {
    retrieve: vi.fn(),
    list: vi.fn(),
  },
  mockSendSubscriptionCancelledEmail: vi.fn(),
  mockSendPaymentFailedEmail: vi.fn(),
  mockSendInvoiceReceiptEmail: vi.fn(),
  mockSendPaymentRecoveryEmail: vi.fn(),
  mockRevalidatePath: vi.fn(),
}));

// Mock database
vi.mock("@/lib/db", () => ({
  db: {
    subscription: mockDbSubscription,
    user: mockDbUser,
    dunningEmail: mockDbDunningEmail,
  },
}));

// Mock email service
vi.mock("@/lib/email", () => ({
  sendSubscriptionConfirmationEmail: vi.fn(),
  sendSubscriptionCancelledEmail: mockSendSubscriptionCancelledEmail,
  sendPaymentFailedEmail: mockSendPaymentFailedEmail,
  sendInvoiceReceiptEmail: mockSendInvoiceReceiptEmail,
  sendPaymentRecoveryEmail: mockSendPaymentRecoveryEmail,
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
        expect(emailCall).toBeDefined();
        const emailData = emailCall?.[1] as { endDate?: string };
        expect(emailData?.endDate).toBeTruthy();
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

    // Tests for previous_attributes-based deduplication (Stripe recommended approach)
    describe("previous_attributes deduplication", () => {
      it("sends cancellation email ONLY when previous_attributes shows cancel_at_period_end changed from false to true", async () => {
        mockDbSubscription.findFirst.mockResolvedValue({
          id: "sub_db_123",
          userId: "user_123",
          plan: "PRO",
          cancelAtPeriodEnd: false,
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

        // Pass previous_attributes indicating cancel_at_period_end changed from false
        const previousAttributes = { cancel_at_period_end: false };

        await handleSubscriptionUpdated(subscription, previousAttributes);

        expect(mockSendSubscriptionCancelledEmail).toHaveBeenCalledTimes(1);
      });

      it("does NOT send email when previous_attributes is empty (nothing changed related to cancellation)", async () => {
        mockDbSubscription.findFirst.mockResolvedValue({
          id: "sub_db_123",
          userId: "user_123",
          plan: "PRO",
          cancelAtPeriodEnd: true, // Already set in DB
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

        // Empty previous_attributes - cancel_at_period_end was not in the change set
        const previousAttributes = {};

        await handleSubscriptionUpdated(subscription, previousAttributes);

        expect(mockSendSubscriptionCancelledEmail).not.toHaveBeenCalled();
      });

      it("does NOT send email when previous_attributes shows cancel_at_period_end was already true", async () => {
        mockDbSubscription.findFirst.mockResolvedValue({
          id: "sub_db_123",
          userId: "user_123",
          plan: "PRO",
          cancelAtPeriodEnd: true,
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

        // previous_attributes shows it was already true (re-cancellation scenario)
        const previousAttributes = { cancel_at_period_end: true };

        await handleSubscriptionUpdated(subscription, previousAttributes);

        expect(mockSendSubscriptionCancelledEmail).not.toHaveBeenCalled();
      });

      it("does NOT send email when subscription is being un-cancelled (cancel_at_period_end: true -> false)", async () => {
        mockDbSubscription.findFirst.mockResolvedValue({
          id: "sub_db_123",
          userId: "user_123",
          plan: "PRO",
          cancelAtPeriodEnd: true,
        });

        const subscription = {
          id: "sub_stripe_123",
          status: "active",
          cancel_at_period_end: false, // User un-cancelled
          current_period_end: 1704067200,
          items: {
            data: [{ price: { id: "price_pro_monthly" } }],
          },
        } as unknown as Stripe.Subscription;

        // previous_attributes shows it changed from true
        const previousAttributes = { cancel_at_period_end: true };

        await handleSubscriptionUpdated(subscription, previousAttributes);

        expect(mockSendSubscriptionCancelledEmail).not.toHaveBeenCalled();
      });

      it("falls back to database comparison when previous_attributes is undefined", async () => {
        mockDbSubscription.findFirst.mockResolvedValue({
          id: "sub_db_123",
          userId: "user_123",
          plan: "PRO",
          cancelAtPeriodEnd: false, // DB shows not cancelled
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

        // No previous_attributes passed (backward compatibility)
        await handleSubscriptionUpdated(subscription, undefined);

        // Should still send email based on DB comparison
        expect(mockSendSubscriptionCancelledEmail).toHaveBeenCalledTimes(1);
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
          cancelAtPeriodEnd: false, // Reset for potential resubscription
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
        userId: "user_123",
        status: "PAST_DUE",
        user: {
          email: "user@example.com",
        },
      });
      mockDbDunningEmail.create.mockResolvedValue({});

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
        include: {
          user: {
            select: {
              email: true,
            },
          },
        },
      });
    });

    // Invoice receipt email tests
    describe("invoice receipt email", () => {
      it("sends invoice receipt email on successful payment", async () => {
        // Return null for PAST_DUE lookup but subscription exists for email lookup
        mockDbSubscription.findFirst
          .mockResolvedValueOnce(null) // First call: PAST_DUE lookup
          .mockResolvedValueOnce({
            id: "sub_db_123",
            userId: "user_123",
            plan: "PRO",
            status: "ACTIVE",
          }); // Second call: email lookup
        mockDbUser.findUnique.mockResolvedValue({
          email: "user@example.com",
          name: "Test User",
        });
        mockSendInvoiceReceiptEmail.mockResolvedValue({ success: true });

        const invoice = {
          id: "in_test",
          number: "INV-0001",
          subscription: "sub_stripe_123",
          amount_paid: 1900,
          currency: "usd",
          created: 1704067200, // Jan 1, 2024
          hosted_invoice_url: "https://invoice.stripe.com/i/test",
          lines: {
            data: [
              {
                period: {
                  start: 1704067200,
                  end: 1706745600,
                },
              },
            ],
          },
        } as unknown as Stripe.Invoice;

        await handleInvoicePaid(invoice);

        expect(mockSendInvoiceReceiptEmail).toHaveBeenCalledWith(
          "user@example.com",
          expect.objectContaining({
            name: "Test User",
            planName: "PRO",
            amount: "USD 19.00",
            invoiceNumber: "INV-0001",
            invoiceUrl: "https://invoice.stripe.com/i/test",
          })
        );
      });

      it("uses billing page URL as fallback when hosted_invoice_url is null", async () => {
        mockDbSubscription.findFirst
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({
            id: "sub_db_123",
            userId: "user_123",
            plan: "PRO",
          });
        mockDbUser.findUnique.mockResolvedValue({
          email: "user@example.com",
          name: "Test User",
        });
        mockSendInvoiceReceiptEmail.mockResolvedValue({ success: true });

        const invoice = {
          id: "in_test",
          number: "INV-0001",
          subscription: "sub_stripe_123",
          amount_paid: 1900,
          currency: "usd",
          created: 1704067200,
          hosted_invoice_url: null, // No hosted URL
        } as unknown as Stripe.Invoice;

        await handleInvoicePaid(invoice);

        expect(mockSendInvoiceReceiptEmail).toHaveBeenCalledWith(
          "user@example.com",
          expect.objectContaining({
            invoiceUrl: undefined, // Falls back to default in email service
          })
        );
      });

      it("skips email when user not found", async () => {
        mockDbSubscription.findFirst
          .mockResolvedValueOnce(null) // PAST_DUE lookup
          .mockResolvedValueOnce({
            id: "sub_db_123",
            userId: "user_123",
            plan: "PRO",
          });
        mockDbUser.findUnique.mockResolvedValue(null);

        const invoice = {
          id: "in_test",
          number: "INV-0001",
          subscription: "sub_stripe_123",
          amount_paid: 1900,
          currency: "usd",
          created: 1704067200,
        } as unknown as Stripe.Invoice;

        await handleInvoicePaid(invoice);

        expect(mockSendInvoiceReceiptEmail).not.toHaveBeenCalled();
      });

      it("handles email sending failure gracefully", async () => {
        mockDbSubscription.findFirst
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({
            id: "sub_db_123",
            userId: "user_123",
            plan: "PRO",
          });
        mockDbUser.findUnique.mockResolvedValue({
          email: "user@example.com",
          name: "Test User",
        });
        mockSendInvoiceReceiptEmail.mockRejectedValue(new Error("Email failed"));

        const invoice = {
          id: "in_test",
          number: "INV-0001",
          subscription: "sub_stripe_123",
          amount_paid: 1900,
          currency: "usd",
          created: 1704067200,
        } as unknown as Stripe.Invoice;

        // Should not throw
        await expect(handleInvoicePaid(invoice)).resolves.not.toThrow();
      });

      it("uses invoice URL as fallback when hosted_invoice_url missing", async () => {
        mockDbSubscription.findFirst
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({
            id: "sub_db_123",
            userId: "user_123",
            plan: "PRO",
          });
        mockDbUser.findUnique.mockResolvedValue({
          email: "user@example.com",
          name: null,
        });
        mockSendInvoiceReceiptEmail.mockResolvedValue({ success: true });

        const invoice = {
          id: "in_test",
          number: "INV-0001",
          subscription: "sub_stripe_123",
          amount_paid: 1900,
          currency: "usd",
          created: 1704067200,
          hosted_invoice_url: null,
          invoice_pdf: null,
        } as unknown as Stripe.Invoice;

        await handleInvoicePaid(invoice);

        expect(mockSendInvoiceReceiptEmail).toHaveBeenCalledWith(
          "user@example.com",
          expect.objectContaining({
            name: undefined,
          })
        );
      });
    });

    // Payment recovery email tests
    describe("payment recovery email", () => {
      it("sends recovery email when PAST_DUE subscription is reactivated", async () => {
        mockDbSubscription.findFirst.mockResolvedValue({
          id: "sub_db_123",
          userId: "user_123",
          plan: "PRO",
          status: "PAST_DUE",
          user: {
            email: "user@example.com",
          },
        });
        mockDbUser.findUnique.mockResolvedValue({
          email: "user@example.com",
          name: "Test User",
        });
        mockDbDunningEmail.create.mockResolvedValue({});
        mockStripeSubscriptions.retrieve.mockResolvedValue({
          id: "sub_stripe_123",
          current_period_end: 1706745600, // Feb 1, 2024
        });

        const invoice = {
          id: "in_test",
          subscription: "sub_stripe_123",
          amount_paid: 1900,
          currency: "usd",
          created: 1704067200,
        } as unknown as Stripe.Invoice;

        await handleInvoicePaid(invoice);

        expect(mockDbSubscription.update).toHaveBeenCalledWith({
          where: { id: "sub_db_123" },
          data: { status: "ACTIVE" },
        });

        expect(mockSendPaymentRecoveryEmail).toHaveBeenCalledWith(
          "user@example.com",
          expect.objectContaining({
            name: "Test User",
            planName: "PRO",
            amountPaid: "USD 19.00",
            nextBillingDate: expect.any(String),
          })
        );
      });

      it("includes formatted amount in recovery email", async () => {
        mockDbSubscription.findFirst.mockResolvedValue({
          id: "sub_db_123",
          userId: "user_123",
          plan: "PRO",
          status: "PAST_DUE",
          user: {
            email: "user@example.com",
          },
        });
        mockDbUser.findUnique.mockResolvedValue({
          email: "user@example.com",
          name: "Test User",
        });
        mockDbDunningEmail.create.mockResolvedValue({});
        mockStripeSubscriptions.retrieve.mockResolvedValue({
          id: "sub_stripe_123",
          current_period_end: 1706745600,
        });

        const invoice = {
          id: "in_test",
          subscription: "sub_stripe_123",
          amount_paid: 2999, // $29.99
          currency: "usd",
          created: 1704067200,
        } as unknown as Stripe.Invoice;

        await handleInvoicePaid(invoice);

        expect(mockSendPaymentRecoveryEmail).toHaveBeenCalledWith(
          "user@example.com",
          expect.objectContaining({
            amountPaid: "USD 29.99",
          })
        );
      });

      it("creates PAYMENT_RECOVERED dunning email record", async () => {
        mockDbSubscription.findFirst.mockResolvedValue({
          id: "sub_db_123",
          userId: "user_123",
          plan: "PRO",
          status: "PAST_DUE",
          user: {
            email: "user@example.com",
          },
        });
        mockDbUser.findUnique.mockResolvedValue({
          email: "user@example.com",
          name: "Test User",
        });
        mockStripeSubscriptions.retrieve.mockResolvedValue({
          id: "sub_stripe_123",
          current_period_end: 1706745600,
        });

        const invoice = {
          id: "in_test",
          subscription: "sub_stripe_123",
          amount_paid: 1900,
          currency: "usd",
          created: 1704067200,
        } as unknown as Stripe.Invoice;

        await handleInvoicePaid(invoice);

        expect(mockDbDunningEmail.create).toHaveBeenCalledWith({
          data: {
            subscriptionId: "sub_db_123",
            emailType: "PAYMENT_RECOVERED",
            recipientEmail: "user@example.com",
            emailStatus: "SENT",
          },
        });
      });

      it("does NOT send recovery email for normal payments (not PAST_DUE)", async () => {
        mockDbSubscription.findFirst
          .mockResolvedValueOnce(null) // PAST_DUE lookup returns null
          .mockResolvedValueOnce({
            id: "sub_db_123",
            userId: "user_123",
            plan: "PRO",
            status: "ACTIVE", // Normal active subscription
          });
        mockDbUser.findUnique.mockResolvedValue({
          email: "user@example.com",
          name: "Test User",
        });

        const invoice = {
          id: "in_test",
          subscription: "sub_stripe_123",
          amount_paid: 1900,
          currency: "usd",
          created: 1704067200,
        } as unknown as Stripe.Invoice;

        await handleInvoicePaid(invoice);

        expect(mockSendPaymentRecoveryEmail).not.toHaveBeenCalled();
      });

      it("handles recovery email sending failure gracefully", async () => {
        mockDbSubscription.findFirst.mockResolvedValue({
          id: "sub_db_123",
          userId: "user_123",
          plan: "PRO",
          status: "PAST_DUE",
          user: {
            email: "user@example.com",
          },
        });
        mockDbUser.findUnique.mockResolvedValue({
          email: "user@example.com",
          name: "Test User",
        });
        mockDbDunningEmail.create.mockResolvedValue({});
        mockStripeSubscriptions.retrieve.mockResolvedValue({
          id: "sub_stripe_123",
          current_period_end: 1706745600,
        });
        mockSendPaymentRecoveryEmail.mockRejectedValue(new Error("Email service error"));

        const invoice = {
          id: "in_test",
          subscription: "sub_stripe_123",
          amount_paid: 1900,
          currency: "usd",
          created: 1704067200,
        } as unknown as Stripe.Invoice;

        // Should not throw - graceful degradation
        await expect(handleInvoicePaid(invoice)).resolves.not.toThrow();

        // Subscription should still be updated to ACTIVE
        expect(mockDbSubscription.update).toHaveBeenCalledWith({
          where: { id: "sub_db_123" },
          data: { status: "ACTIVE" },
        });
      });

      it("skips recovery email when user not found", async () => {
        mockDbSubscription.findFirst.mockResolvedValue({
          id: "sub_db_123",
          userId: "user_123",
          plan: "PRO",
          status: "PAST_DUE",
          user: {
            email: "user@example.com",
          },
        });
        mockDbUser.findUnique.mockResolvedValue(null);
        mockDbDunningEmail.create.mockResolvedValue({});

        const invoice = {
          id: "in_test",
          subscription: "sub_stripe_123",
          amount_paid: 1900,
          currency: "usd",
          created: 1704067200,
        } as unknown as Stripe.Invoice;

        await handleInvoicePaid(invoice);

        expect(mockSendPaymentRecoveryEmail).not.toHaveBeenCalled();
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
        userId: "user_123",
        plan: "PRO",
        status: "ACTIVE",
      });
      mockDbUser.findUnique.mockResolvedValue({
        email: "user@example.com",
        name: "Test User",
      });
      mockDbDunningEmail.create.mockResolvedValue({});

      const invoice = {
        id: "in_test",
        subscription: "sub_stripe_123",
        amount_due: 1900,
        currency: "usd",
        created: 1704067200,
        next_payment_attempt: 1704672000,
        lines: {
          data: [{ price: { id: "price_pro_monthly" } }],
        },
      } as unknown as Stripe.Invoice;

      await handleInvoicePaymentFailed(invoice);

      expect(mockDbSubscription.update).toHaveBeenCalledWith({
        where: { id: "sub_db_123" },
        data: {
          status: "PAST_DUE",
          statusChangedAt: expect.any(Date),
        },
      });
    });

    // Payment failed email tests
    describe("payment failed email", () => {
      it("sends payment failed email when subscription is found", async () => {
        mockDbSubscription.findFirst.mockResolvedValue({
          id: "sub_db_123",
          userId: "user_123",
          plan: "PRO",
          status: "ACTIVE",
        });
        mockDbUser.findUnique.mockResolvedValue({
          email: "user@example.com",
          name: "Test User",
        });

        const invoice = {
          id: "in_test",
          subscription: "sub_stripe_123",
          amount_due: 1900,
          currency: "usd",
          created: 1704067200,
          next_payment_attempt: 1704672000,
          lines: {
            data: [{ price: { id: "price_pro_monthly" } }],
          },
        } as unknown as Stripe.Invoice;

        await handleInvoicePaymentFailed(invoice);

        expect(mockDbUser.findUnique).toHaveBeenCalledWith({
          where: { id: "user_123" },
          select: { email: true, name: true },
        });
        expect(mockSendPaymentFailedEmail).toHaveBeenCalledWith(
          "user@example.com",
          expect.objectContaining({
            name: "Test User",
            planName: "PRO",
          })
        );
      });

      it("includes formatted amount in email", async () => {
        mockDbSubscription.findFirst.mockResolvedValue({
          id: "sub_db_123",
          userId: "user_123",
          plan: "PRO",
          status: "ACTIVE",
        });
        mockDbUser.findUnique.mockResolvedValue({
          email: "user@example.com",
          name: "Test User",
        });

        const invoice = {
          id: "in_test",
          subscription: "sub_stripe_123",
          amount_due: 2999, // $29.99
          currency: "usd",
          created: 1704067200,
          next_payment_attempt: 1704672000,
          lines: {
            data: [{ price: { id: "price_pro_monthly" } }],
          },
        } as unknown as Stripe.Invoice;

        await handleInvoicePaymentFailed(invoice);

        expect(mockSendPaymentFailedEmail).toHaveBeenCalledWith(
          "user@example.com",
          expect.objectContaining({
            amount: "USD 29.99",
          })
        );
      });

      it("includes next retry date when available", async () => {
        mockDbSubscription.findFirst.mockResolvedValue({
          id: "sub_db_123",
          userId: "user_123",
          plan: "PRO",
          status: "ACTIVE",
        });
        mockDbUser.findUnique.mockResolvedValue({
          email: "user@example.com",
          name: "Test User",
        });

        // Specific timestamp: January 8, 2024
        const nextRetryTimestamp = 1704672000;
        const invoice = {
          id: "in_test",
          subscription: "sub_stripe_123",
          amount_due: 1900,
          currency: "usd",
          created: 1704067200,
          next_payment_attempt: nextRetryTimestamp,
          lines: {
            data: [{ price: { id: "price_pro_monthly" } }],
          },
        } as unknown as Stripe.Invoice;

        await handleInvoicePaymentFailed(invoice);

        expect(mockSendPaymentFailedEmail).toHaveBeenCalledWith(
          "user@example.com",
          expect.objectContaining({
            nextRetryDate: expect.any(String),
          })
        );
      });

      it("handles missing next_payment_attempt gracefully", async () => {
        mockDbSubscription.findFirst.mockResolvedValue({
          id: "sub_db_123",
          userId: "user_123",
          plan: "PRO",
          status: "ACTIVE",
        });
        mockDbUser.findUnique.mockResolvedValue({
          email: "user@example.com",
          name: "Test User",
        });

        const invoice = {
          id: "in_test",
          subscription: "sub_stripe_123",
          amount_due: 1900,
          currency: "usd",
          created: 1704067200,
          next_payment_attempt: null,
          lines: {
            data: [{ price: { id: "price_pro_monthly" } }],
          },
        } as unknown as Stripe.Invoice;

        await handleInvoicePaymentFailed(invoice);

        expect(mockSendPaymentFailedEmail).toHaveBeenCalledWith(
          "user@example.com",
          expect.objectContaining({
            nextRetryDate: undefined,
          })
        );
      });

      it("does not send email when user not found", async () => {
        mockDbSubscription.findFirst.mockResolvedValue({
          id: "sub_db_123",
          userId: "user_123",
          plan: "PRO",
          status: "ACTIVE",
        });
        mockDbUser.findUnique.mockResolvedValue(null);

        const invoice = {
          id: "in_test",
          subscription: "sub_stripe_123",
          amount_due: 1900,
          currency: "usd",
          created: 1704067200,
          next_payment_attempt: 1704672000,
          lines: {
            data: [{ price: { id: "price_pro_monthly" } }],
          },
        } as unknown as Stripe.Invoice;

        await handleInvoicePaymentFailed(invoice);

        expect(mockSendPaymentFailedEmail).not.toHaveBeenCalled();
      });

      it("handles email sending failure gracefully", async () => {
        mockDbSubscription.findFirst.mockResolvedValue({
          id: "sub_db_123",
          userId: "user_123",
          plan: "PRO",
          status: "ACTIVE",
        });
        mockDbUser.findUnique.mockResolvedValue({
          email: "user@example.com",
          name: "Test User",
        });
        mockSendPaymentFailedEmail.mockRejectedValue(new Error("Email service error"));

        const invoice = {
          id: "in_test",
          subscription: "sub_stripe_123",
          amount_due: 1900,
          currency: "usd",
          created: 1704067200,
          next_payment_attempt: 1704672000,
          lines: {
            data: [{ price: { id: "price_pro_monthly" } }],
          },
        } as unknown as Stripe.Invoice;

        // Should not throw - graceful degradation
        await expect(handleInvoicePaymentFailed(invoice)).resolves.not.toThrow();

        // Database update should still have been called
        expect(mockDbSubscription.update).toHaveBeenCalled();
      });

      it("handles user without email gracefully", async () => {
        mockDbSubscription.findFirst.mockResolvedValue({
          id: "sub_db_123",
          userId: "user_123",
          plan: "PRO",
          status: "ACTIVE",
        });
        mockDbUser.findUnique.mockResolvedValue({
          email: null,
          name: "Test User",
        });

        const invoice = {
          id: "in_test",
          subscription: "sub_stripe_123",
          amount_due: 1900,
          currency: "usd",
          created: 1704067200,
          next_payment_attempt: 1704672000,
          lines: {
            data: [{ price: { id: "price_pro_monthly" } }],
          },
        } as unknown as Stripe.Invoice;

        await handleInvoicePaymentFailed(invoice);

        expect(mockSendPaymentFailedEmail).not.toHaveBeenCalled();
      });
    });

    // Customer fallback tests - when subscription is null but customer is present
    describe("customer fallback lookup", () => {
      it("looks up subscription by customer ID when subscription is null", async () => {
        mockDbSubscription.findFirst.mockResolvedValue({
          id: "sub_db_123",
          userId: "user_123",
          plan: "PRO",
          status: "ACTIVE",
        });
        mockDbUser.findUnique.mockResolvedValue({
          email: "user@example.com",
          name: "Test User",
        });

        const invoice = {
          id: "in_test",
          subscription: null, // No subscription ID in webhook payload
          customer: "cus_123", // But customer ID is present
          amount_due: 1900,
          currency: "usd",
          created: 1704067200,
          next_payment_attempt: 1704672000,
          lines: {
            data: [{ price: { id: "price_pro_monthly" } }],
          },
        } as unknown as Stripe.Invoice;

        await handleInvoicePaymentFailed(invoice);

        // Should look up subscription by customer ID
        expect(mockDbSubscription.findFirst).toHaveBeenCalledWith({
          where: { stripeCustomerId: "cus_123" },
        });
        expect(mockSendPaymentFailedEmail).toHaveBeenCalled();
      });

      it("handles customer as expanded object", async () => {
        mockDbSubscription.findFirst.mockResolvedValue({
          id: "sub_db_123",
          userId: "user_123",
          plan: "PRO",
          status: "ACTIVE",
        });
        mockDbUser.findUnique.mockResolvedValue({
          email: "user@example.com",
          name: "Test User",
        });

        const invoice = {
          id: "in_test",
          subscription: null,
          customer: { id: "cus_456" }, // Customer as expanded object
          amount_due: 1900,
          currency: "usd",
          created: 1704067200,
          next_payment_attempt: 1704672000,
          lines: {
            data: [{ price: { id: "price_pro_monthly" } }],
          },
        } as unknown as Stripe.Invoice;

        await handleInvoicePaymentFailed(invoice);

        expect(mockDbSubscription.findFirst).toHaveBeenCalledWith({
          where: { stripeCustomerId: "cus_456" },
        });
        expect(mockSendPaymentFailedEmail).toHaveBeenCalled();
      });

      it("skips when both subscription and customer are null", async () => {
        const invoice = {
          id: "in_test",
          subscription: null,
          customer: null,
          amount_due: 1900,
          currency: "usd",
          created: 1704067200,
          next_payment_attempt: 1704672000,
          lines: {
            data: [{ price: { id: "price_pro_monthly" } }],
          },
        } as unknown as Stripe.Invoice;

        await handleInvoicePaymentFailed(invoice);

        expect(mockDbSubscription.findFirst).not.toHaveBeenCalled();
        expect(mockSendPaymentFailedEmail).not.toHaveBeenCalled();
      });

      it("skips when no subscription found for customer", async () => {
        mockDbSubscription.findFirst.mockResolvedValue(null);

        const invoice = {
          id: "in_test",
          subscription: null,
          customer: "cus_unknown",
          amount_due: 1900,
          currency: "usd",
          created: 1704067200,
          next_payment_attempt: 1704672000,
          lines: {
            data: [{ price: { id: "price_pro_monthly" } }],
          },
        } as unknown as Stripe.Invoice;

        await handleInvoicePaymentFailed(invoice);

        expect(mockDbSubscription.update).not.toHaveBeenCalled();
        expect(mockSendPaymentFailedEmail).not.toHaveBeenCalled();
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

    it("passes previous_attributes to handleSubscriptionUpdated for cancellation deduplication", async () => {
      mockDbSubscription.findFirst.mockResolvedValue({
        id: "sub_db_123",
        userId: "user_123",
        plan: "PRO",
        cancelAtPeriodEnd: false,
      });
      mockDbUser.findUnique.mockResolvedValue({
        email: "user@example.com",
        name: "Test User",
      });

      const event = {
        id: "evt_test",
        type: "customer.subscription.updated",
        data: {
          object: {
            id: "sub_stripe_123",
            status: "active",
            cancel_at_period_end: true,
            current_period_end: 1704067200,
            items: { data: [{ price: { id: "price_pro_monthly" } }] },
          },
          previous_attributes: {
            cancel_at_period_end: false,
          },
        },
      } as unknown as Stripe.Event;

      const result = await processWebhookEvent(event);

      expect(result.success).toBe(true);
      // Email should be sent because previous_attributes shows cancel_at_period_end changed from false to true
      expect(mockSendSubscriptionCancelledEmail).toHaveBeenCalledTimes(1);
    });

    it("does NOT send duplicate email when previous_attributes shows no cancellation change", async () => {
      mockDbSubscription.findFirst.mockResolvedValue({
        id: "sub_db_123",
        userId: "user_123",
        plan: "PRO",
        cancelAtPeriodEnd: true, // Already cancelled in DB
      });

      const event = {
        id: "evt_test",
        type: "customer.subscription.updated",
        data: {
          object: {
            id: "sub_stripe_123",
            status: "active",
            cancel_at_period_end: true,
            current_period_end: 1704067200,
            items: { data: [{ price: { id: "price_pro_monthly" } }] },
          },
          // previous_attributes doesn't include cancel_at_period_end - it wasn't changed
          previous_attributes: {
            current_period_end: 1703000000, // Some other field changed
          },
        },
      } as unknown as Stripe.Event;

      const result = await processWebhookEvent(event);

      expect(result.success).toBe(true);
      // Email should NOT be sent because cancel_at_period_end was not in previous_attributes
      expect(mockSendSubscriptionCancelledEmail).not.toHaveBeenCalled();
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
