/**
 * Tests for createApiKey server action - scopes functionality
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies BEFORE imports using hoisted scope
const { mockAuth, mockDb, mockRateLimiters, mockGenerateApiKey, mockHashApiKey, mockGetKeyPrefix, mockLogger, mockTrackServerEvent } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockDb: {
    apiKey: {
      count: vi.fn(),
      create: vi.fn(),
    },
  },
  mockRateLimiters: {
    api: vi.fn(),
  },
  mockGenerateApiKey: vi.fn(),
  mockHashApiKey: vi.fn(),
  mockGetKeyPrefix: vi.fn(),
  mockLogger: {
    info: vi.fn(),
    error: vi.fn(),
  },
  mockTrackServerEvent: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimiters: mockRateLimiters,
}));

vi.mock("@/lib/api-key/generate", () => ({
  generateApiKey: mockGenerateApiKey,
  hashApiKey: mockHashApiKey,
  getKeyPrefix: mockGetKeyPrefix,
}));

vi.mock("@/lib/logger", () => ({
  logger: mockLogger,
}));

vi.mock("@/lib/analytics", () => ({
  trackServerEvent: mockTrackServerEvent,
  SETTINGS_EVENTS: {
    API_KEY_CREATED: "api_key_created",
  },
}));

import { createApiKey } from "@/actions/api-keys/create";

describe("createApiKey - scopes", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mocks
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockRateLimiters.api.mockResolvedValue({ success: true });
    mockDb.apiKey.count.mockResolvedValue(0);
    mockGenerateApiKey.mockReturnValue("sk_live_abc123");
    mockHashApiKey.mockResolvedValue("hashed_key");
    mockGetKeyPrefix.mockReturnValue("sk_live_abc1");
  });

  // ============================================
  // SCOPES HANDLING TESTS
  // ============================================

  describe("scopes handling", () => {
    it("creates API key with default read scope when not provided", async () => {
      mockDb.apiKey.create.mockResolvedValue({
        id: "key-1",
        userId: "user-1",
        name: "Test Key",
        keyHash: "hashed_key",
        keyPrefix: "sk_live_abc1",
        environment: "live",
        scopes: ["read"],
        usageCount: 0,
        lastUsedAt: null,
        revokedAt: null,
        expiresAt: null,
        createdAt: new Date(),
      });

      const result = await createApiKey({
        name: "Test Key",
        environment: "live",
      });

      expect(result.success).toBe(true);
      expect(mockDb.apiKey.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          name: "Test Key",
          keyHash: "hashed_key",
          keyPrefix: "sk_live_abc1",
          environment: "live",
          scopes: ["read"],
        },
      });
    });

    it("creates API key with single write scope", async () => {
      mockDb.apiKey.create.mockResolvedValue({
        id: "key-1",
        userId: "user-1",
        name: "Test Key",
        keyHash: "hashed_key",
        keyPrefix: "sk_live_abc1",
        environment: "live",
        scopes: ["write"],
        usageCount: 0,
        lastUsedAt: null,
        revokedAt: null,
        expiresAt: null,
        createdAt: new Date(),
      });

      const result = await createApiKey({
        name: "Test Key",
        environment: "live",
        scopes: ["write"],
      });

      expect(result.success).toBe(true);
      expect(mockDb.apiKey.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          name: "Test Key",
          keyHash: "hashed_key",
          keyPrefix: "sk_live_abc1",
          environment: "live",
          scopes: ["write"],
        },
      });
    });

    it("creates API key with multiple scopes", async () => {
      mockDb.apiKey.create.mockResolvedValue({
        id: "key-1",
        userId: "user-1",
        name: "Test Key",
        keyHash: "hashed_key",
        keyPrefix: "sk_live_abc1",
        environment: "live",
        scopes: ["read", "write"],
        usageCount: 0,
        lastUsedAt: null,
        revokedAt: null,
        expiresAt: null,
        createdAt: new Date(),
      });

      const result = await createApiKey({
        name: "Test Key",
        environment: "live",
        scopes: ["read", "write"],
      });

      expect(result.success).toBe(true);
      expect(mockDb.apiKey.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          name: "Test Key",
          keyHash: "hashed_key",
          keyPrefix: "sk_live_abc1",
          environment: "live",
          scopes: ["read", "write"],
        },
      });
    });

    it("creates API key with admin scope", async () => {
      mockDb.apiKey.create.mockResolvedValue({
        id: "key-1",
        userId: "user-1",
        name: "Test Key",
        keyHash: "hashed_key",
        keyPrefix: "sk_live_abc1",
        environment: "live",
        scopes: ["admin"],
        usageCount: 0,
        lastUsedAt: null,
        revokedAt: null,
        expiresAt: null,
        createdAt: new Date(),
      });

      const result = await createApiKey({
        name: "Test Key",
        environment: "live",
        scopes: ["admin"],
      });

      expect(result.success).toBe(true);
      expect(mockDb.apiKey.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          name: "Test Key",
          keyHash: "hashed_key",
          keyPrefix: "sk_live_abc1",
          environment: "live",
          scopes: ["admin"],
        },
      });
    });

    it("rejects empty scopes array", async () => {
      const result = await createApiKey({
        name: "Test Key",
        environment: "live",
        scopes: [],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("At least one scope is required");
      }
    });

    it("rejects invalid scopes", async () => {
      const result = await createApiKey({
        name: "Test Key",
        environment: "live",
        scopes: ["invalid"],
      });

      expect(result.success).toBe(false);
    });

    it("rejects duplicate scopes", async () => {
      const result = await createApiKey({
        name: "Test Key",
        environment: "live",
        scopes: ["read", "read"],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Duplicate scopes");
      }
    });
  });
});
