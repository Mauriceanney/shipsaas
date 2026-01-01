import { describe, it, expect } from "vitest";

import { generateApiKey, hashApiKey, verifyApiKey } from "@/lib/api-key/generate";

describe("generateApiKey", () => {
  it("generates live key with correct format", () => {
    const key = generateApiKey("live");

    expect(key).toMatch(/^sk_live_[A-Za-z0-9]{43}$/);
  });

  it("generates test key with correct format", () => {
    const key = generateApiKey("test");

    expect(key).toMatch(/^sk_test_[A-Za-z0-9]{43}$/);
  });

  it("generates unique keys", () => {
    const key1 = generateApiKey("live");
    const key2 = generateApiKey("live");

    expect(key1).not.toBe(key2);
  });

  it("key is 51 characters long for live", () => {
    const key = generateApiKey("live");

    // sk_live_ (8 chars) + 43 random chars = 51
    expect(key.length).toBe(51);
  });

  it("key is 51 characters long for test", () => {
    const key = generateApiKey("test");

    // sk_test_ (8 chars) + 43 random chars = 51
    expect(key.length).toBe(51);
  });
});

describe("hashApiKey", () => {
  it("hashes API key with bcrypt", async () => {
    const key = generateApiKey("live");
    const hash = await hashApiKey(key);

    expect(hash).toMatch(/^\$2[aby]\$/); // bcrypt hash pattern
    expect(hash.length).toBeGreaterThan(50);
  });

  it("produces different hashes for same key", async () => {
    const key = generateApiKey("live");
    const hash1 = await hashApiKey(key);
    const hash2 = await hashApiKey(key);

    // Different due to random salt
    expect(hash1).not.toBe(hash2);
  });

  it("hash is verifiable with original key", async () => {
    const key = generateApiKey("live");
    const hash = await hashApiKey(key);

    const isValid = await verifyApiKey(key, hash);
    expect(isValid).toBe(true);
  });
});

describe("verifyApiKey", () => {
  it("returns true for correct key", async () => {
    const key = generateApiKey("live");
    const hash = await hashApiKey(key);

    const result = await verifyApiKey(key, hash);

    expect(result).toBe(true);
  });

  it("returns false for incorrect key", async () => {
    const key1 = generateApiKey("live");
    const key2 = generateApiKey("live");
    const hash = await hashApiKey(key1);

    const result = await verifyApiKey(key2, hash);

    expect(result).toBe(false);
  });

  it("returns false for empty key", async () => {
    const key = generateApiKey("live");
    const hash = await hashApiKey(key);

    const result = await verifyApiKey("", hash);

    expect(result).toBe(false);
  });
});

describe("getKeyPrefix", () => {
  it("extracts first 12 characters", async () => {
    const { getKeyPrefix } = await import("@/lib/api-key/generate");
    const key = "sk_live_abc123xyz789rest";

    const prefix = getKeyPrefix(key);

    expect(prefix).toBe("sk_live_abc1");
  });

  it("handles short keys", async () => {
    const { getKeyPrefix } = await import("@/lib/api-key/generate");
    const key = "sk_live";

    const prefix = getKeyPrefix(key);

    expect(prefix).toBe("sk_live");
  });
});
