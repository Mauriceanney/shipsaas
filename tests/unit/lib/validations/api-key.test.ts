import { describe, it, expect } from "vitest";
import { createApiKeySchema } from "@/lib/validations/api-key";

describe("createApiKeySchema", () => {
  describe("scopes validation", () => {
    it("accepts valid scopes", () => {
      const result = createApiKeySchema.safeParse({
        name: "Test Key",
        environment: "live",
        scopes: ["read"],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.scopes).toEqual(["read"]);
      }
    });

    it("accepts multiple scopes", () => {
      const result = createApiKeySchema.safeParse({
        name: "Test Key",
        environment: "live",
        scopes: ["read", "write"],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.scopes).toEqual(["read", "write"]);
      }
    });

    it("accepts all scopes", () => {
      const result = createApiKeySchema.safeParse({
        name: "Test Key",
        environment: "live",
        scopes: ["read", "write", "admin"],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.scopes).toEqual(["read", "write", "admin"]);
      }
    });

    it("defaults to read scope when not provided", () => {
      const result = createApiKeySchema.safeParse({
        name: "Test Key",
        environment: "live",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.scopes).toEqual(["read"]);
      }
    });

    it("rejects empty scopes array", () => {
      const result = createApiKeySchema.safeParse({
        name: "Test Key",
        environment: "live",
        scopes: [],
      });

      expect(result.success).toBe(false);
    });

    it("rejects invalid scope values", () => {
      const result = createApiKeySchema.safeParse({
        name: "Test Key",
        environment: "live",
        scopes: ["invalid"],
      });

      expect(result.success).toBe(false);
    });

    it("rejects duplicate scopes", () => {
      const result = createApiKeySchema.safeParse({
        name: "Test Key",
        environment: "live",
        scopes: ["read", "read"],
      });

      expect(result.success).toBe(false);
    });
  });

  describe("existing validation", () => {
    it("validates name is required", () => {
      const result = createApiKeySchema.safeParse({
        environment: "live",
        scopes: ["read"],
      });

      expect(result.success).toBe(false);
    });

    it("validates name max length", () => {
      const result = createApiKeySchema.safeParse({
        name: "a".repeat(101),
        environment: "live",
        scopes: ["read"],
      });

      expect(result.success).toBe(false);
    });

    it("validates environment values", () => {
      const result = createApiKeySchema.safeParse({
        name: "Test",
        environment: "invalid",
        scopes: ["read"],
      });

      expect(result.success).toBe(false);
    });
  });
});
