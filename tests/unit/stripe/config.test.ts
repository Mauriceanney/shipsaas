/**
 * TDD: Stripe Config Tests
 */

import { describe, expect, it, vi, beforeEach, beforeAll } from "vitest";

// Set environment variables before any imports
process.env["STRIPE_PRICE_ID_PRO_MONTHLY"] = "price_pro_monthly_test";
process.env["STRIPE_PRICE_ID_PRO_YEARLY"] = "price_pro_yearly_test";
process.env["STRIPE_PRICE_ID_ENTERPRISE_MONTHLY"] = "price_enterprise_monthly_test";
process.env["STRIPE_PRICE_ID_ENTERPRISE_YEARLY"] = "price_enterprise_yearly_test";

// Need to reset modules since config is loaded with these env vars
beforeAll(async () => {
  vi.resetModules();
});

describe("Stripe Config", () => {
  // Lazy import to ensure env vars are set
  let STRIPE_PRICE_IDS: any;
  let PLAN_FEATURES: any;
  let PLAN_PRICING: any;
  let PLAN_CONFIGS: any;
  let CHECKOUT_URLS: any;
  let PORTAL_RETURN_URL: any;
  let getPlanConfig: any;
  let getPriceId: any;
  let getAllPriceIds: any;
  let isValidPriceId: any;
  let calculateYearlySavings: any;

  beforeAll(async () => {
    const config = await import("@/lib/stripe/config");
    STRIPE_PRICE_IDS = config.STRIPE_PRICE_IDS;
    PLAN_FEATURES = config.PLAN_FEATURES;
    PLAN_PRICING = config.PLAN_PRICING;
    PLAN_CONFIGS = config.PLAN_CONFIGS;
    CHECKOUT_URLS = config.CHECKOUT_URLS;
    PORTAL_RETURN_URL = config.PORTAL_RETURN_URL;
    getPlanConfig = config.getPlanConfig;
    getPriceId = config.getPriceId;
    getAllPriceIds = config.getAllPriceIds;
    isValidPriceId = config.isValidPriceId;
    calculateYearlySavings = config.calculateYearlySavings;
  });

  describe("STRIPE_PRICE_IDS", () => {
    it("has PRO monthly price", () => {
      expect(STRIPE_PRICE_IDS.PRO.monthly).toBe("price_pro_monthly_test");
    });

    it("has PRO yearly price", () => {
      expect(STRIPE_PRICE_IDS.PRO.yearly).toBe("price_pro_yearly_test");
    });

    it("has ENTERPRISE monthly price", () => {
      expect(STRIPE_PRICE_IDS.ENTERPRISE.monthly).toBe("price_enterprise_monthly_test");
    });

    it("has ENTERPRISE yearly price", () => {
      expect(STRIPE_PRICE_IDS.ENTERPRISE.yearly).toBe("price_enterprise_yearly_test");
    });
  });

  describe("PLAN_FEATURES", () => {
    it("has features for FREE plan", () => {
      expect(PLAN_FEATURES.FREE).toBeInstanceOf(Array);
      expect(PLAN_FEATURES.FREE.length).toBeGreaterThan(0);
    });

    it("has features for PRO plan", () => {
      expect(PLAN_FEATURES.PRO).toBeInstanceOf(Array);
      expect(PLAN_FEATURES.PRO.length).toBeGreaterThan(0);
    });

    it("has features for ENTERPRISE plan", () => {
      expect(PLAN_FEATURES.ENTERPRISE).toBeInstanceOf(Array);
      expect(PLAN_FEATURES.ENTERPRISE.length).toBeGreaterThan(0);
    });

    it("PRO has more features than FREE", () => {
      expect(PLAN_FEATURES.PRO.length).toBeGreaterThan(PLAN_FEATURES.FREE.length);
    });

    it("ENTERPRISE has more features than PRO", () => {
      expect(PLAN_FEATURES.ENTERPRISE.length).toBeGreaterThan(PLAN_FEATURES.PRO.length);
    });
  });

  describe("PLAN_PRICING", () => {
    it("has PRO pricing", () => {
      expect(PLAN_PRICING.PRO.monthly).toBeGreaterThan(0);
      expect(PLAN_PRICING.PRO.yearly).toBeGreaterThan(0);
    });

    it("has ENTERPRISE pricing", () => {
      expect(PLAN_PRICING.ENTERPRISE.monthly).toBeGreaterThan(0);
      expect(PLAN_PRICING.ENTERPRISE.yearly).toBeGreaterThan(0);
    });

    it("yearly is less than 12 * monthly for PRO (savings)", () => {
      const monthlyTotal = PLAN_PRICING.PRO.monthly * 12;
      expect(PLAN_PRICING.PRO.yearly).toBeLessThan(monthlyTotal);
    });

    it("yearly is less than 12 * monthly for ENTERPRISE (savings)", () => {
      const monthlyTotal = PLAN_PRICING.ENTERPRISE.monthly * 12;
      expect(PLAN_PRICING.ENTERPRISE.yearly).toBeLessThan(monthlyTotal);
    });
  });

  describe("PLAN_CONFIGS", () => {
    it("has 3 plan configs", () => {
      expect(PLAN_CONFIGS).toHaveLength(3);
    });

    it("includes FREE plan", () => {
      const freePlan = PLAN_CONFIGS.find((p: any) => p.id === "FREE");
      expect(freePlan).toBeDefined();
      expect(freePlan?.name).toBe("Free");
    });

    it("includes PRO plan with highlighted flag", () => {
      const proPlan = PLAN_CONFIGS.find((p: any) => p.id === "PRO");
      expect(proPlan).toBeDefined();
      expect(proPlan?.highlighted).toBe(true);
      expect(proPlan?.badge).toBe("Popular");
    });

    it("includes ENTERPRISE plan", () => {
      const enterprisePlan = PLAN_CONFIGS.find((p: any) => p.id === "ENTERPRISE");
      expect(enterprisePlan).toBeDefined();
      expect(enterprisePlan?.name).toBe("Enterprise");
    });
  });

  describe("CHECKOUT_URLS", () => {
    it("has success URL", () => {
      expect(CHECKOUT_URLS.success).toBe("/checkout/success");
    });

    it("has cancel URL", () => {
      expect(CHECKOUT_URLS.cancel).toBe("/pricing");
    });
  });

  describe("PORTAL_RETURN_URL", () => {
    it("is defined", () => {
      expect(PORTAL_RETURN_URL).toBe("/settings/billing");
    });
  });

  describe("getPlanConfig", () => {
    it("returns config for FREE plan", () => {
      const config = getPlanConfig("FREE");
      expect(config).toBeDefined();
      expect(config?.id).toBe("FREE");
    });

    it("returns config for PRO plan", () => {
      const config = getPlanConfig("PRO");
      expect(config).toBeDefined();
      expect(config?.id).toBe("PRO");
    });

    it("returns config for ENTERPRISE plan", () => {
      const config = getPlanConfig("ENTERPRISE");
      expect(config).toBeDefined();
      expect(config?.id).toBe("ENTERPRISE");
    });

    it("returns undefined for invalid plan", () => {
      const config = getPlanConfig("INVALID" as any);
      expect(config).toBeUndefined();
    });
  });

  describe("getPriceId", () => {
    it("returns null for FREE plan", () => {
      expect(getPriceId("FREE", "monthly")).toBeNull();
      expect(getPriceId("FREE", "yearly")).toBeNull();
    });

    it("returns monthly price for PRO", () => {
      expect(getPriceId("PRO", "monthly")).toBe("price_pro_monthly_test");
    });

    it("returns yearly price for PRO", () => {
      expect(getPriceId("PRO", "yearly")).toBe("price_pro_yearly_test");
    });

    it("returns monthly price for ENTERPRISE", () => {
      expect(getPriceId("ENTERPRISE", "monthly")).toBe("price_enterprise_monthly_test");
    });

    it("returns yearly price for ENTERPRISE", () => {
      expect(getPriceId("ENTERPRISE", "yearly")).toBe("price_enterprise_yearly_test");
    });
  });

  describe("getAllPriceIds", () => {
    it("returns array of all price IDs", () => {
      const priceIds = getAllPriceIds();
      expect(priceIds).toBeInstanceOf(Array);
      expect(priceIds.length).toBe(4);
    });

    it("includes all PRO and ENTERPRISE prices", () => {
      const priceIds = getAllPriceIds();
      expect(priceIds).toContain("price_pro_monthly_test");
      expect(priceIds).toContain("price_pro_yearly_test");
      expect(priceIds).toContain("price_enterprise_monthly_test");
      expect(priceIds).toContain("price_enterprise_yearly_test");
    });
  });

  describe("isValidPriceId", () => {
    it("returns true for valid PRO monthly price", () => {
      expect(isValidPriceId("price_pro_monthly_test")).toBe(true);
    });

    it("returns true for valid PRO yearly price", () => {
      expect(isValidPriceId("price_pro_yearly_test")).toBe(true);
    });

    it("returns true for valid ENTERPRISE prices", () => {
      expect(isValidPriceId("price_enterprise_monthly_test")).toBe(true);
      expect(isValidPriceId("price_enterprise_yearly_test")).toBe(true);
    });

    it("returns false for invalid price ID", () => {
      expect(isValidPriceId("invalid_price")).toBe(false);
    });

    it("returns false for empty string", () => {
      expect(isValidPriceId("")).toBe(false);
    });
  });

  describe("calculateYearlySavings", () => {
    it("calculates correct savings percentage", () => {
      // $19/month = $228/year, yearly price = $190
      // Savings = (228 - 190) / 228 * 100 = 16.67%
      const savings = calculateYearlySavings(19, 190);
      expect(savings).toBe(17); // Rounded
    });

    it("returns 0 for same price", () => {
      const savings = calculateYearlySavings(10, 120);
      expect(savings).toBe(0);
    });

    it("handles larger savings", () => {
      // $99/month = $1188/year, yearly price = $990
      // Savings = (1188 - 990) / 1188 * 100 = 16.67%
      const savings = calculateYearlySavings(99, 990);
      expect(savings).toBe(17);
    });
  });
});
