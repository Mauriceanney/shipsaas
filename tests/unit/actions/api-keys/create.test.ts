import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted to properly hoist the mock function
const {
  mockAuth,
  mockRateLimitApi,
  mockApiKeyCount,
  mockApiKeyCreate,
  mockGenerateApiKey,
  mockHashApiKey,
  mockGetKeyPrefix,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockRateLimitApi: vi.fn(),
  mockApiKeyCount: vi.fn(),
  mockApiKeyCreate: vi.fn(),
  mockGenerateApiKey: vi.fn(),
  mockHashApiKey: vi.fn(),
  mockGetKeyPrefix: vi.fn(),
}));

// Mock dependencies
vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimiters: {
    api: mockRateLimitApi,
  },
}));

vi.mock("@/lib/db", () => ({
  db: {
    apiKey: {
      count: mockApiKeyCount,
      create: mockApiKeyCreate,
    },
  },
}));

vi.mock("@/lib/api-key/generate", () => ({
  generateApiKey: mockGenerateApiKey,
  hashApiKey: mockHashApiKey,
  getKeyPrefix: mockGetKeyPrefix,
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import { createApiKey } from "@/actions/api-keys/create";

describe("createApiKey", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // AUTHENTICATION TESTS
  describe("authentication", () => {
    it("returns error when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const result = await createApiKey({ name: "Test Key" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
      }
    });

    it("returns error when session has no user", async () => {
      mockAuth.mockResolvedValue({ user: null });

      const result = await createApiKey({ name: "Test Key" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
      }
    });
  });

  // RATE LIMITING TESTS
  describe("rate limiting", () => {
    it("enforces rate limit", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockRateLimitApi.mockResolvedValue({
        success: false,
        limit: 5,
        remaining: 0,
        reset: Date.now() / 1000 + 3600,
      });

      const result = await createApiKey({ name: "Test Key" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Too many requests. Please try again later.");
      }
      expect(mockRateLimitApi).toHaveBeenCalledWith("apikey:user-1");
    });

    it("allows request when under rate limit", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockRateLimitApi.mockResolvedValue({
        success: true,
        limit: 5,
        remaining: 4,
        reset: Date.now() / 1000 + 3600,
      });
      mockApiKeyCount.mockResolvedValue(0);
      mockGenerateApiKey.mockReturnValue("sk_live_abc123xyz");
      mockHashApiKey.mockResolvedValue("$2a$12$hashhash");
      mockGetKeyPrefix.mockReturnValue("sk_live_abc1");
      mockApiKeyCreate.mockResolvedValue({
        id: "key-1",
        userId: "user-1",
        name: "Test Key",
        keyHash: "$2a$12$hashhash",
        keyPrefix: "sk_live_abc1",
        environment: "live",
        lastUsedAt: null,
        usageCount: 0,
        createdAt: new Date(),
        revokedAt: null,
        expiresAt: null,
      });

      const result = await createApiKey({ name: "Test Key" });

      expect(result.success).toBe(true);
    });
  });

  // VALIDATION TESTS
  describe("validation", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockRateLimitApi.mockResolvedValue({
        success: true,
        limit: 5,
        remaining: 4,
        reset: Date.now() / 1000 + 3600,
      });
    });

    it("returns error for empty name", async () => {
      const result = await createApiKey({ name: "" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("required");
      }
    });

    it("returns error for name exceeding 100 characters", async () => {
      const result = await createApiKey({ name: "a".repeat(101) });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("100 characters");
      }
    });

    it("accepts valid test environment", async () => {
      mockApiKeyCount.mockResolvedValue(0);
      mockGenerateApiKey.mockReturnValue("sk_test_abc123xyz");
      mockHashApiKey.mockResolvedValue("$2a$12$hashhash");
      mockGetKeyPrefix.mockReturnValue("sk_test_abc1");
      mockApiKeyCreate.mockResolvedValue({
        id: "key-1",
        userId: "user-1",
        name: "Test Key",
        keyHash: "$2a$12$hashhash",
        keyPrefix: "sk_test_abc1",
        environment: "test",
        lastUsedAt: null,
        usageCount: 0,
        createdAt: new Date(),
        revokedAt: null,
        expiresAt: null,
      });

      const result = await createApiKey({ name: "Test Key", environment: "test" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.apiKey.environment).toBe("test");
      }
      expect(mockGenerateApiKey).toHaveBeenCalledWith("test");
    });
  });

  // KEY LIMIT TESTS
  describe("key limit", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockRateLimitApi.mockResolvedValue({
        success: true,
        limit: 5,
        remaining: 4,
        reset: Date.now() / 1000 + 3600,
      });
    });

    it("enforces maximum 10 keys per user", async () => {
      mockApiKeyCount.mockResolvedValue(10);

      const result = await createApiKey({ name: "Test Key" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Maximum 10 API keys allowed per user");
      }
      expect(mockApiKeyCount).toHaveBeenCalledWith({
        where: { userId: "user-1", revokedAt: null },
      });
    });

    it("allows creating key when under limit", async () => {
      mockApiKeyCount.mockResolvedValue(9);
      mockGenerateApiKey.mockReturnValue("sk_live_abc123xyz");
      mockHashApiKey.mockResolvedValue("$2a$12$hashhash");
      mockGetKeyPrefix.mockReturnValue("sk_live_abc1");
      mockApiKeyCreate.mockResolvedValue({
        id: "key-1",
        userId: "user-1",
        name: "Test Key",
        keyHash: "$2a$12$hashhash",
        keyPrefix: "sk_live_abc1",
        environment: "live",
        lastUsedAt: null,
        usageCount: 0,
        createdAt: new Date(),
        revokedAt: null,
        expiresAt: null,
      });

      const result = await createApiKey({ name: "Test Key" });

      expect(result.success).toBe(true);
    });
  });

  // SUCCESS TESTS
  describe("success cases", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockRateLimitApi.mockResolvedValue({
        success: true,
        limit: 5,
        remaining: 4,
        reset: Date.now() / 1000 + 3600,
      });
      mockApiKeyCount.mockResolvedValue(0);
    });

    it("creates API key with valid input", async () => {
      const mockKey = "sk_live_abc123xyz789";
      mockGenerateApiKey.mockReturnValue(mockKey);
      mockHashApiKey.mockResolvedValue("$2a$12$hashhash");
      mockGetKeyPrefix.mockReturnValue("sk_live_abc1");
      mockApiKeyCreate.mockResolvedValue({
        id: "key-1",
        userId: "user-1",
        name: "Production API",
        keyHash: "$2a$12$hashhash",
        keyPrefix: "sk_live_abc1",
        environment: "live",
        lastUsedAt: null,
        usageCount: 0,
        createdAt: new Date(),
        revokedAt: null,
        expiresAt: null,
      });

      const result = await createApiKey({ name: "Production API" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.key).toBe(mockKey);
        expect(result.data.apiKey.name).toBe("Production API");
        expect(result.data.apiKey.keyPrefix).toBe("sk_live_abc1");
      }
      expect(mockGenerateApiKey).toHaveBeenCalledWith("live");
      expect(mockHashApiKey).toHaveBeenCalledWith(mockKey);
      expect(mockApiKeyCreate).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          name: "Production API",
          keyHash: "$2a$12$hashhash",
          keyPrefix: "sk_live_abc1",
          environment: "live",
        },
      });
    });

    it("returns both key and apiKey metadata", async () => {
      const mockKey = "sk_live_xyz123abc456";
      mockGenerateApiKey.mockReturnValue(mockKey);
      mockHashApiKey.mockResolvedValue("$2a$12$hash");
      mockGetKeyPrefix.mockReturnValue("sk_live_xyz1");
      mockApiKeyCreate.mockResolvedValue({
        id: "key-1",
        userId: "user-1",
        name: "Test",
        keyHash: "$2a$12$hash",
        keyPrefix: "sk_live_xyz1",
        environment: "live",
        lastUsedAt: null,
        usageCount: 0,
        createdAt: new Date(),
        revokedAt: null,
        expiresAt: null,
      });

      const result = await createApiKey({ name: "Test" });

      expect(result.success).toBe(true);
      if (result.success) {
        // Full key returned once
        expect(result.data.key).toBe(mockKey);
        // Metadata returned
        expect(result.data.apiKey.id).toBe("key-1");
        expect(result.data.apiKey.keyPrefix).toBe("sk_live_xyz1");
      }
    });
  });

  // ERROR HANDLING TESTS
  describe("error handling", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockRateLimitApi.mockResolvedValue({
        success: true,
        limit: 5,
        remaining: 4,
        reset: Date.now() / 1000 + 3600,
      });
      mockApiKeyCount.mockResolvedValue(0);
    });

    it("handles database errors gracefully", async () => {
      mockGenerateApiKey.mockReturnValue("sk_live_abc123xyz");
      mockHashApiKey.mockResolvedValue("$2a$12$hashhash");
      mockGetKeyPrefix.mockReturnValue("sk_live_abc1");
      mockApiKeyCreate.mockRejectedValue(new Error("DB Error"));

      const result = await createApiKey({ name: "Test Key" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Failed to create API key");
      }
    });

    it("handles hashing errors gracefully", async () => {
      mockGenerateApiKey.mockReturnValue("sk_live_abc123xyz");
      mockHashApiKey.mockRejectedValue(new Error("Hashing failed"));

      const result = await createApiKey({ name: "Test Key" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Failed to create API key");
      }
    });
  });
});
