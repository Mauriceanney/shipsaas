/**
 * Unit tests for Stripe configuration with trial periods
 */

import { describe, expect, it } from "vitest";

import {
  PLAN_CONFIGS,
  TRIAL_DAYS,
  getTrialDays,
  hasTrialPeriod,
} from "@/lib/stripe/config";

describe("Trial Period Configuration", () => {
  describe("TRIAL_DAYS", () => {
    it("defines trial days for PRO plan", () => {
      expect(TRIAL_DAYS.PRO).toBe(14);
    });

    it("defines trial days for ENTERPRISE plan", () => {
      expect(TRIAL_DAYS.ENTERPRISE).toBe(14);
    });

    it("does not define trial for FREE plan", () => {
      expect(TRIAL_DAYS.FREE).toBeUndefined();
    });
  });

  describe("getTrialDays", () => {
    it("returns 14 days for PRO plan", () => {
      expect(getTrialDays("PRO")).toBe(14);
    });

    it("returns 14 days for ENTERPRISE plan", () => {
      expect(getTrialDays("ENTERPRISE")).toBe(14);
    });

    it("returns 0 for FREE plan", () => {
      expect(getTrialDays("FREE")).toBe(0);
    });
  });

  describe("hasTrialPeriod", () => {
    it("returns true for PRO plan", () => {
      expect(hasTrialPeriod("PRO")).toBe(true);
    });

    it("returns true for ENTERPRISE plan", () => {
      expect(hasTrialPeriod("ENTERPRISE")).toBe(true);
    });

    it("returns false for FREE plan", () => {
      expect(hasTrialPeriod("FREE")).toBe(false);
    });
  });

  describe("PLAN_CONFIGS with trial information", () => {
    it("includes trial days for PRO plan", () => {
      const proPlan = PLAN_CONFIGS.find((p) => p.id === "PRO");
      expect(proPlan?.trialDays).toBe(14);
    });

    it("includes trial days for ENTERPRISE plan", () => {
      const enterprisePlan = PLAN_CONFIGS.find((p) => p.id === "ENTERPRISE");
      expect(enterprisePlan?.trialDays).toBe(14);
    });

    it("does not include trial for FREE plan", () => {
      const freePlan = PLAN_CONFIGS.find((p) => p.id === "FREE");
      expect(freePlan?.trialDays).toBeUndefined();
    });
  });
});
