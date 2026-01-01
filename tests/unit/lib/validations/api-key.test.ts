import { describe, it, expect } from "vitest";

import { createApiKeySchema, revokeApiKeySchema } from "@/lib/validations/api-key";

describe("createApiKeySchema", () => {
  it("accepts valid input", () => {
    const result = createApiKeySchema.safeParse({
      name: "Production API Key",
      environment: "live",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Production API Key");
      expect(result.data.environment).toBe("live");
    }
  });

  it("accepts test environment", () => {
    const result = createApiKeySchema.safeParse({
      name: "Test Key",
      environment: "test",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.environment).toBe("test");
    }
  });

  it("defaults to live environment", () => {
    const result = createApiKeySchema.safeParse({
      name: "My Key",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.environment).toBe("live");
    }
  });

  it("rejects empty name", () => {
    const result = createApiKeySchema.safeParse({
      name: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejects name exceeding 100 characters", () => {
    const result = createApiKeySchema.safeParse({
      name: "a".repeat(101),
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid environment", () => {
    const result = createApiKeySchema.safeParse({
      name: "Key",
      environment: "production",
    });

    expect(result.success).toBe(false);
  });

  it("rejects missing name", () => {
    const result = createApiKeySchema.safeParse({
      environment: "live",
    });

    expect(result.success).toBe(false);
  });
});

describe("revokeApiKeySchema", () => {
  it("accepts valid ID", () => {
    const result = revokeApiKeySchema.safeParse({
      id: "clx1234567890",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("clx1234567890");
    }
  });

  it("rejects empty ID", () => {
    const result = revokeApiKeySchema.safeParse({
      id: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejects missing ID", () => {
    const result = revokeApiKeySchema.safeParse({});

    expect(result.success).toBe(false);
  });
});
