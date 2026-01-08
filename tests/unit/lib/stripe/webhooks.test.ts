/**
 * Unit tests for Stripe webhook handlers with trial support
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock dependencies BEFORE imports - proper hoisting
vi.mock("@/lib/db", () => ({
  db: {
    subscription: {
      upsert: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/lib/stripe/utils", () => ({
  extractCustomerId: vi.fn(() => "cus_123"),
  extractPriceId: vi.fn(() => "price_123"),
  extractSubscriptionId: vi.fn(() => "sub_123"),
  getPlanFromPriceId: vi.fn(() => "PLUS"),
  mapStripeStatus: vi.fn(() => "TRIALING"),
  unixToDate: vi.fn((timestamp: number) => new Date(timestamp * 1000)),
  validateCheckoutMetadata: vi.fn((metadata) => ({ userId: metadata?.userId })),
}));

vi.mock("@/lib/stripe/client", () => ({
  stripe: {
    subscriptions: {
      retrieve: vi.fn(),
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/analytics/server", () => ({
  trackServerEvent: vi.fn(),
  SUBSCRIPTION_EVENTS: {
    TRIAL_STARTED: "subscription.trial_started",
    TRIAL_ENDED: "subscription.trial_ended",
    SUBSCRIPTION_CREATED: "subscription.created",
  },
}));

// Import after mocks
import { handleCheckoutCompleted } from "@/lib/stripe/webhooks";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe/client";
import type Stripe from "stripe";

describe("Webhook Handlers - Trial Support", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
      vi.mocked(stripe.subscriptions.retrieve).mockResolvedValue(
        subscription as Stripe.Subscription
      );

      await handleCheckoutCompleted(session as Stripe.Checkout.Session);

      expect(db.subscription.upsert).toHaveBeenCalledWith(
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

      // Mock stripe.subscriptions.retrieve
      vi.mocked(stripe.subscriptions.retrieve).mockResolvedValue(
        subscription as Stripe.Subscription
      );

      await handleCheckoutCompleted(session as Stripe.Checkout.Session);

      expect(db.subscription.upsert).toHaveBeenCalledWith(
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
