import { describe, it, expect } from "vitest";

import { hasClientAccess } from "@/components/feature-gate/feature-gate";

describe("hasClientAccess", () => {
  describe("PRO plan requirements", () => {
    it("grants access when user has PRO plan with ACTIVE status", () => {
      const result = hasClientAccess(
        { plan: "PRO", status: "ACTIVE" },
        "PRO"
      );
      expect(result).toBe(true);
    });

    it("grants access when user has PRO plan with TRIALING status", () => {
      const result = hasClientAccess(
        { plan: "PRO", status: "TRIALING" },
        "PRO"
      );
      expect(result).toBe(true);
    });

    it("grants access when user has ENTERPRISE plan (higher tier)", () => {
      const result = hasClientAccess(
        { plan: "ENTERPRISE", status: "ACTIVE" },
        "PRO"
      );
      expect(result).toBe(true);
    });

    it("denies access when user has FREE plan", () => {
      const result = hasClientAccess(
        { plan: "FREE", status: "ACTIVE" },
        "PRO"
      );
      expect(result).toBe(false);
    });

    it("denies access when PRO subscription is INACTIVE", () => {
      const result = hasClientAccess(
        { plan: "PRO", status: "INACTIVE" },
        "PRO"
      );
      expect(result).toBe(false);
    });

    it("denies access when PRO subscription is CANCELED", () => {
      const result = hasClientAccess(
        { plan: "PRO", status: "CANCELED" },
        "PRO"
      );
      expect(result).toBe(false);
    });

    it("denies access when PRO subscription is PAST_DUE", () => {
      const result = hasClientAccess(
        { plan: "PRO", status: "PAST_DUE" },
        "PRO"
      );
      expect(result).toBe(false);
    });

    it("denies access when subscription is null", () => {
      const result = hasClientAccess(null, "PRO");
      expect(result).toBe(false);
    });

    it("denies access when subscription is undefined", () => {
      const result = hasClientAccess(undefined, "PRO");
      expect(result).toBe(false);
    });
  });

  describe("ENTERPRISE plan requirements", () => {
    it("grants access when user has ENTERPRISE plan with ACTIVE status", () => {
      const result = hasClientAccess(
        { plan: "ENTERPRISE", status: "ACTIVE" },
        "ENTERPRISE"
      );
      expect(result).toBe(true);
    });

    it("grants access when user has ENTERPRISE plan with TRIALING status", () => {
      const result = hasClientAccess(
        { plan: "ENTERPRISE", status: "TRIALING" },
        "ENTERPRISE"
      );
      expect(result).toBe(true);
    });

    it("denies access when user has PRO plan (lower tier)", () => {
      const result = hasClientAccess(
        { plan: "PRO", status: "ACTIVE" },
        "ENTERPRISE"
      );
      expect(result).toBe(false);
    });

    it("denies access when user has FREE plan", () => {
      const result = hasClientAccess(
        { plan: "FREE", status: "ACTIVE" },
        "ENTERPRISE"
      );
      expect(result).toBe(false);
    });

    it("denies access when ENTERPRISE subscription is INACTIVE", () => {
      const result = hasClientAccess(
        { plan: "ENTERPRISE", status: "INACTIVE" },
        "ENTERPRISE"
      );
      expect(result).toBe(false);
    });

    it("denies access when subscription is null", () => {
      const result = hasClientAccess(null, "ENTERPRISE");
      expect(result).toBe(false);
    });
  });

  describe("plan hierarchy", () => {
    it("follows hierarchy: ENTERPRISE > PRO > FREE", () => {
      // ENTERPRISE can access PRO features
      expect(
        hasClientAccess({ plan: "ENTERPRISE", status: "ACTIVE" }, "PRO")
      ).toBe(true);

      // PRO cannot access ENTERPRISE features
      expect(
        hasClientAccess({ plan: "PRO", status: "ACTIVE" }, "ENTERPRISE")
      ).toBe(false);

      // FREE cannot access PRO features
      expect(
        hasClientAccess({ plan: "FREE", status: "ACTIVE" }, "PRO")
      ).toBe(false);

      // FREE cannot access ENTERPRISE features
      expect(
        hasClientAccess({ plan: "FREE", status: "ACTIVE" }, "ENTERPRISE")
      ).toBe(false);
    });
  });

  describe("status validation", () => {
    it("only accepts ACTIVE and TRIALING as valid statuses", () => {
      const validStatuses = ["ACTIVE", "TRIALING"];
      const invalidStatuses = ["INACTIVE", "CANCELED", "PAST_DUE"];

      validStatuses.forEach((status) => {
        expect(
          hasClientAccess(
            { plan: "PRO", status: status as any },
            "PRO"
          )
        ).toBe(true);
      });

      invalidStatuses.forEach((status) => {
        expect(
          hasClientAccess(
            { plan: "PRO", status: status as any },
            "PRO"
          )
        ).toBe(false);
      });
    });
  });
});
