import { describe, it, expect } from "vitest";

import { hasClientAccess } from "@/components/feature-gate/feature-gate";

describe("hasClientAccess", () => {
  describe("PRO plan requirements", () => {
    it("grants access when user has PRO plan with ACTIVE status", () => {
      const result = hasClientAccess(
        { plan: "PLUS", status: "ACTIVE" },
        "PLUS"
      );
      expect(result).toBe(true);
    });

    it("grants access when user has PRO plan with TRIALING status", () => {
      const result = hasClientAccess(
        { plan: "PLUS", status: "TRIALING" },
        "PLUS"
      );
      expect(result).toBe(true);
    });

    it("grants access when user has PRO plan (higher tier)", () => {
      const result = hasClientAccess(
        { plan: "PLUS", status: "ACTIVE" },
        "PLUS"
      );
      expect(result).toBe(true);
    });

    it("denies access when user has FREE plan", () => {
      const result = hasClientAccess(
        { plan: "FREE", status: "ACTIVE" },
        "PLUS"
      );
      expect(result).toBe(false);
    });

    it("denies access when PRO subscription is INACTIVE", () => {
      const result = hasClientAccess(
        { plan: "PLUS", status: "INACTIVE" },
        "PLUS"
      );
      expect(result).toBe(false);
    });

    it("denies access when PRO subscription is CANCELED", () => {
      const result = hasClientAccess(
        { plan: "PLUS", status: "CANCELED" },
        "PLUS"
      );
      expect(result).toBe(false);
    });

    it("denies access when PRO subscription is PAST_DUE", () => {
      const result = hasClientAccess(
        { plan: "PLUS", status: "PAST_DUE" },
        "PLUS"
      );
      expect(result).toBe(false);
    });

    it("denies access when subscription is null", () => {
      const result = hasClientAccess(null, "PLUS");
      expect(result).toBe(false);
    });

    it("denies access when subscription is undefined", () => {
      const result = hasClientAccess(undefined, "PLUS");
      expect(result).toBe(false);
    });
  });

  describe("PRO plan requirements", () => {
    it("grants access when user has PRO plan with ACTIVE status", () => {
      const result = hasClientAccess(
        { plan: "PLUS", status: "ACTIVE" },
        "PRO"
      );
      expect(result).toBe(true);
    });

    it("grants access when user has PRO plan with TRIALING status", () => {
      const result = hasClientAccess(
        { plan: "PLUS", status: "TRIALING" },
        "PRO"
      );
      expect(result).toBe(true);
    });

    it("denies access when user has PRO plan (lower tier)", () => {
      const result = hasClientAccess(
        { plan: "PLUS", status: "ACTIVE" },
        "PRO"
      );
      expect(result).toBe(false);
    });

    it("denies access when user has FREE plan", () => {
      const result = hasClientAccess(
        { plan: "FREE", status: "ACTIVE" },
        "PRO"
      );
      expect(result).toBe(false);
    });

    it("denies access when ENTERPRISE subscription is INACTIVE", () => {
      const result = hasClientAccess(
        { plan: "PLUS", status: "INACTIVE" },
        "PRO"
      );
      expect(result).toBe(false);
    });

    it("denies access when subscription is null", () => {
      const result = hasClientAccess(null, "PRO");
      expect(result).toBe(false);
    });
  });

  describe("plan hierarchy", () => {
    it("follows hierarchy: ENTERPRISE > PRO > FREE", () => {
      // PRO can access PLUS features
      expect(
        hasClientAccess({ plan: "PLUS", status: "ACTIVE" }, "PLUS")
      ).toBe(true);

      // PLUS cannot access PRO features
      expect(
        hasClientAccess({ plan: "PLUS", status: "ACTIVE" }, "PRO")
      ).toBe(false);

      // FREE cannot access PLUS features
      expect(
        hasClientAccess({ plan: "FREE", status: "ACTIVE" }, "PLUS")
      ).toBe(false);

      // FREE cannot access PRO features
      expect(
        hasClientAccess({ plan: "FREE", status: "ACTIVE" }, "PRO")
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
            { plan: "PLUS", status: status as any },
            "PLUS"
          )
        ).toBe(true);
      });

      invalidStatuses.forEach((status) => {
        expect(
          hasClientAccess(
            { plan: "PLUS", status: status as any },
            "PLUS"
          )
        ).toBe(false);
      });
    });
  });
});
