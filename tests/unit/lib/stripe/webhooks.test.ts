/**
 * Unit tests for Stripe webhook handlers with trial support
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock dependencies
const mockDb = {
  subscription: {
    upsert: vi.fn(),
    update: vi.fn(),
    findFirst: vi.fn(),
  },
};

const mockUnixToDate = vi.fn((timestamp: number) => new Date(timestamp * 1000));

vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

vi.mock("@/lib/stripe/utils", () => ({
  extractCustomerId: vi.fn(() => "cus_123"),
  extractPriceId: vi.fn(() => "price_123"),
  extractSubscriptionId: vi.fn(() => "sub_123"),
  getPlanFromPriceId: vi.fn(() => "PRO"),
  mapStripeStatus: vi.fn(() => "TRIALING"),
  unixToDate: mockUnixToDate,
  validateCheckoutMetadata: vi.fn((metadata) => ({ userId: metadata?.userId })),
}));

import { handleCheckoutCompleted, handleSubscriptionCreated } from "@/lib/stripe/webhooks";
import type Stripe from "stripe";

describe("Webhook Handlers - Trial Support", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUnixToDate.mockImplementation((timestamp: number) => new Date(timestamp * 1000));
  });

  describe("handleCheckoutCompleted", () => {
    it("saves trial end date when subscription has trial", async () => {
      const session: Partial<Stripe.Checkout.Session> = {
        id: "cs_test_123",
        mode: "subscription",
        customer: "cus_123",
        subscription: "sub_123",
        metadata: { userId: "user_123" },
      };

      const subscription: Partial<Stripe.Subscription> = {
        id: "sub_123",
        customer: "cus_123",
        status: "trialing",
        trial_end: 1704067200, // Jan 1, 2024
        current_period_end: 1706745600,
        items: {
          data: [{ price: { id: "price_123" } }],
        } as unknown as Stripe.ApiList<Stripe.SubscriptionItem>,
      };

      // Mock stripe.subscriptions.retrieve
      const mockStripe = {
        subscriptions: {
          retrieve: vi.fn().mockResolvedValue(subscription),
        },
      };
      
      vi.mock("@/lib/stripe/client", () => ({
        stripe: mockStripe,
      }));

      await handleCheckoutCompleted(session as Stripe.Checkout.Session);

      expect(mockDb.subscription.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            stripeTrialEnd: new Date(1704067200 * 1000),
          }),
          update: expect.objectContaining({
            stripeTrialEnd: new Date(1704067200 * 1000),
          }),
        })
      );
    });

    it("handles null trial end for non-trial subscriptions", async () => {
      const session: Partial<Stripe.Checkout.Session> = {
        id: "cs_test_123",
        mode: "subscription",
        customer: "cus_123",
        subscription: "sub_123",
        metadata: { userId: "user_123" },
      };

      const subscription: Partial<Stripe.Subscription> = {
        id: "sub_123",
        customer: "cus_123",
        status: "active",
        trial_end: null,
        current_period_end: 1706745600,
        items: {
          data: [{ price: { id: "price_123" } }],
        } as unknown as Stripe.ApiList<Stripe.SubscriptionItem>,
      };

      const mockStripe = {
        subscriptions: {
          retrieve: vi.fn().mockResolvedValue(subscription),
        },
      };
      
      vi.mock("@/lib/stripe/client", () => ({
        stripe: mockStripe,
      }));

      await handleCheckoutCompleted(session as Stripe.Checkout.Session);

      expect(mockDb.subscription.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            stripeTrialEnd: null,
          }),
          update: expect.objectContaining({
            stripeTrialEnd: null,
          }),
        })
      );
    });
  });
});
