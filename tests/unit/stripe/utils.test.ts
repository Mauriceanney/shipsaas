/**
 * TDD: RED PHASE - Stripe Utils Tests
 * These tests are written BEFORE implementation
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock the config module
vi.mock("@/lib/stripe/config", () => ({
  STRIPE_PRICE_IDS: {
    PRO: {
      monthly: "price_pro_monthly_test",
      yearly: "price_pro_yearly_test",
    },
    ENTERPRISE: {
      monthly: "price_enterprise_monthly_test",
      yearly: "price_enterprise_yearly_test",
    },
  },
}));

import {
  mapStripeStatus,
  getPlanFromPriceId,
  isPaidPlan,
  isActiveSubscription,
  extractPriceId,
  extractCustomerId,
  extractSubscriptionId,
  unixToDate,
  hasSubscriptionExpired,
  validateCheckoutMetadata,
} from "@/lib/stripe/utils";

describe("Stripe Utils", () => {
  describe("mapStripeStatus", () => {
    it("maps 'active' to ACTIVE", () => {
      expect(mapStripeStatus("active")).toBe("ACTIVE");
    });

    it("maps 'trialing' to TRIALING", () => {
      expect(mapStripeStatus("trialing")).toBe("TRIALING");
    });

    it("maps 'past_due' to PAST_DUE", () => {
      expect(mapStripeStatus("past_due")).toBe("PAST_DUE");
    });

    it("maps 'canceled' to CANCELED", () => {
      expect(mapStripeStatus("canceled")).toBe("CANCELED");
    });

    it("maps 'unpaid' to INACTIVE", () => {
      expect(mapStripeStatus("unpaid")).toBe("INACTIVE");
    });

    it("maps 'incomplete' to INACTIVE", () => {
      expect(mapStripeStatus("incomplete")).toBe("INACTIVE");
    });

    it("maps 'incomplete_expired' to INACTIVE", () => {
      expect(mapStripeStatus("incomplete_expired")).toBe("INACTIVE");
    });

    it("maps 'paused' to INACTIVE", () => {
      expect(mapStripeStatus("paused")).toBe("INACTIVE");
    });
  });

  describe("getPlanFromPriceId", () => {
    it("returns PRO for pro monthly price", () => {
      expect(getPlanFromPriceId("price_pro_monthly_test")).toBe("PRO");
    });

    it("returns PRO for pro yearly price", () => {
      expect(getPlanFromPriceId("price_pro_yearly_test")).toBe("PRO");
    });

    it("returns ENTERPRISE for enterprise monthly price", () => {
      expect(getPlanFromPriceId("price_enterprise_monthly_test")).toBe("ENTERPRISE");
    });

    it("returns ENTERPRISE for enterprise yearly price", () => {
      expect(getPlanFromPriceId("price_enterprise_yearly_test")).toBe("ENTERPRISE");
    });

    it("returns FREE for unknown price", () => {
      expect(getPlanFromPriceId("unknown_price")).toBe("FREE");
    });

    it("returns FREE for empty price", () => {
      expect(getPlanFromPriceId("")).toBe("FREE");
    });
  });

  describe("isPaidPlan", () => {
    it("returns false for FREE", () => {
      expect(isPaidPlan("FREE")).toBe(false);
    });

    it("returns true for PRO", () => {
      expect(isPaidPlan("PRO")).toBe(true);
    });

    it("returns true for ENTERPRISE", () => {
      expect(isPaidPlan("ENTERPRISE")).toBe(true);
    });
  });

  describe("isActiveSubscription", () => {
    it("returns true for ACTIVE", () => {
      expect(isActiveSubscription("ACTIVE")).toBe(true);
    });

    it("returns true for TRIALING", () => {
      expect(isActiveSubscription("TRIALING")).toBe(true);
    });

    it("returns false for PAST_DUE", () => {
      expect(isActiveSubscription("PAST_DUE")).toBe(false);
    });

    it("returns false for CANCELED", () => {
      expect(isActiveSubscription("CANCELED")).toBe(false);
    });

    it("returns false for INACTIVE", () => {
      expect(isActiveSubscription("INACTIVE")).toBe(false);
    });
  });

  describe("extractPriceId", () => {
    it("extracts price ID from subscription items", () => {
      const subscription = {
        items: {
          data: [{ price: { id: "price_123" } }],
        },
      };
      expect(extractPriceId(subscription as any)).toBe("price_123");
    });

    it("returns null when items is empty", () => {
      const subscription = {
        items: { data: [] },
      };
      expect(extractPriceId(subscription as any)).toBeNull();
    });
  });

  describe("extractCustomerId", () => {
    it("extracts customer ID when customer is a string", () => {
      const obj = { customer: "cus_123" };
      expect(extractCustomerId(obj)).toBe("cus_123");
    });

    it("extracts customer ID when customer is an object", () => {
      const obj = { customer: { id: "cus_456", deleted: false } };
      expect(extractCustomerId(obj as any)).toBe("cus_456");
    });

    it("returns null when customer is null", () => {
      const obj = { customer: null };
      expect(extractCustomerId(obj)).toBeNull();
    });
  });

  describe("extractSubscriptionId", () => {
    it("extracts subscription ID when subscription is a string", () => {
      const session = { subscription: "sub_123" };
      expect(extractSubscriptionId(session as any)).toBe("sub_123");
    });

    it("extracts subscription ID when subscription is an object", () => {
      const session = { subscription: { id: "sub_456" } };
      expect(extractSubscriptionId(session as any)).toBe("sub_456");
    });

    it("returns null when subscription is null", () => {
      const session = { subscription: null };
      expect(extractSubscriptionId(session as any)).toBeNull();
    });
  });

  describe("unixToDate", () => {
    it("converts unix timestamp to Date", () => {
      const timestamp = 1704067200; // 2024-01-01 00:00:00 UTC
      const date = unixToDate(timestamp);
      expect(date.getUTCFullYear()).toBe(2024);
      expect(date.getUTCMonth()).toBe(0);
      expect(date.getUTCDate()).toBe(1);
    });

    it("handles current timestamp", () => {
      const now = Math.floor(Date.now() / 1000);
      const date = unixToDate(now);
      expect(date instanceof Date).toBe(true);
    });
  });

  describe("hasSubscriptionExpired", () => {
    it("returns true when periodEnd is null", () => {
      expect(hasSubscriptionExpired(null)).toBe(true);
    });

    it("returns true when periodEnd is in the past", () => {
      const pastDate = new Date(Date.now() - 86400000); // Yesterday
      expect(hasSubscriptionExpired(pastDate)).toBe(true);
    });

    it("returns false when periodEnd is in the future", () => {
      const futureDate = new Date(Date.now() + 86400000); // Tomorrow
      expect(hasSubscriptionExpired(futureDate)).toBe(false);
    });
  });

  describe("validateCheckoutMetadata", () => {
    it("returns userId when metadata contains userId", () => {
      const metadata = { userId: "user_123" };
      expect(validateCheckoutMetadata(metadata)).toEqual({ userId: "user_123" });
    });

    it("returns null when metadata is null", () => {
      expect(validateCheckoutMetadata(null)).toBeNull();
    });

    it("returns null when metadata has no userId", () => {
      const metadata = { someOtherField: "value" };
      expect(validateCheckoutMetadata(metadata as any)).toBeNull();
    });

    it("returns null when userId is empty", () => {
      const metadata = { userId: "" };
      expect(validateCheckoutMetadata(metadata)).toBeNull();
    });
  });
});
