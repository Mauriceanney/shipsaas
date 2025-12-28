import { describe, expect, it } from "vitest";

import {
  isSoftDeleted,
  excludeDeletedFilter,
  onlyDeletedFilter,
  SOFT_DELETABLE_MODELS,
} from "@/lib/db/soft-delete";

describe("Soft Delete Helpers", () => {
  describe("isSoftDeleted", () => {
    it("returns true when deletedAt is set", () => {
      const record = { id: "1", deletedAt: new Date() };
      expect(isSoftDeleted(record)).toBe(true);
    });

    it("returns false when deletedAt is null", () => {
      const record = { id: "1", deletedAt: null };
      expect(isSoftDeleted(record)).toBe(false);
    });

    it("returns false when deletedAt is undefined", () => {
      const record = { id: "1", deletedAt: undefined };
      expect(isSoftDeleted(record)).toBe(false);
    });
  });

  describe("excludeDeletedFilter", () => {
    it("returns filter for non-deleted records", () => {
      const filter = excludeDeletedFilter();
      expect(filter).toEqual({ deletedAt: null });
    });
  });

  describe("onlyDeletedFilter", () => {
    it("returns filter for deleted records only", () => {
      const filter = onlyDeletedFilter();
      expect(filter).toEqual({ deletedAt: { not: null } });
    });
  });

  describe("SOFT_DELETABLE_MODELS", () => {
    it("includes User model", () => {
      expect(SOFT_DELETABLE_MODELS).toContain("User");
    });

    it("includes Subscription model", () => {
      expect(SOFT_DELETABLE_MODELS).toContain("Subscription");
    });

    it("does not include Session model", () => {
      expect(SOFT_DELETABLE_MODELS).not.toContain("Session");
    });

    it("does not include Account model", () => {
      expect(SOFT_DELETABLE_MODELS).not.toContain("Account");
    });

    it("does not include VerificationToken model", () => {
      expect(SOFT_DELETABLE_MODELS).not.toContain("VerificationToken");
    });
  });
});
