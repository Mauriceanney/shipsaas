import { describe, it, expect } from "vitest";
import { hasScope, validateScopes } from "@/lib/api/scope-validation";

describe("scope-validation", () => {
  describe("hasScope", () => {
    it("returns true when scope exists in key scopes", () => {
      expect(hasScope(["read"], "read")).toBe(true);
    });

    it("returns false when scope does not exist in key scopes", () => {
      expect(hasScope(["read"], "write")).toBe(false);
    });

    it("returns true for any scope when admin scope is present", () => {
      expect(hasScope(["admin"], "read")).toBe(true);
      expect(hasScope(["admin"], "write")).toBe(true);
      expect(hasScope(["admin"], "admin")).toBe(true);
    });

    it("returns true when admin is among multiple scopes", () => {
      expect(hasScope(["read", "admin"], "write")).toBe(true);
    });

    it("handles empty key scopes array", () => {
      expect(hasScope([], "read")).toBe(false);
    });
  });

  describe("validateScopes", () => {
    it("returns true when all required scopes are present", () => {
      expect(validateScopes(["read", "write"], ["read"])).toBe(true);
      expect(validateScopes(["read", "write"], ["write"])).toBe(true);
      expect(validateScopes(["read", "write"], ["read", "write"])).toBe(true);
    });

    it("returns false when any required scope is missing", () => {
      expect(validateScopes(["read"], ["write"])).toBe(false);
      expect(validateScopes(["read"], ["read", "write"])).toBe(false);
    });

    it("returns true when admin scope covers all required scopes", () => {
      expect(validateScopes(["admin"], ["read"])).toBe(true);
      expect(validateScopes(["admin"], ["write"])).toBe(true);
      expect(validateScopes(["admin"], ["read", "write"])).toBe(true);
      expect(validateScopes(["admin"], ["admin"])).toBe(true);
    });

    it("handles empty required scopes array", () => {
      expect(validateScopes(["read"], [])).toBe(true);
    });

    it("handles empty key scopes with required scopes", () => {
      expect(validateScopes([], ["read"])).toBe(false);
    });
  });
});
