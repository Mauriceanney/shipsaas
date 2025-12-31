import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoist mocks
const { mockGetPostHogClient, mockDb } = vi.hoisted(() => ({
  mockGetPostHogClient: vi.fn(),
  mockDb: {
    appConfig: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock dependencies
vi.mock("@/lib/analytics/server", () => ({
  getPostHogClient: mockGetPostHogClient,
}));

vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

import { isFeatureFlagEnabled, isFeatureEnabled, getAllFeatureFlags } from "@/lib/feature-flags/server";

describe("isFeatureFlagEnabled", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("PostHog checks", () => {
    it("returns PostHog value when enabled and user provided", async () => {
      const mockClient = {
        isFeatureEnabled: vi.fn().mockResolvedValue(true),
      };
      mockGetPostHogClient.mockReturnValue(mockClient);

      const result = await isFeatureFlagEnabled("test-flag", "user-123");

      expect(result).toEqual({ enabled: true, source: "posthog" });
      expect(mockClient.isFeatureEnabled).toHaveBeenCalledWith("test-flag", "user-123", {
        personProperties: undefined,
      });
    });

    it("returns PostHog false value correctly", async () => {
      const mockClient = {
        isFeatureEnabled: vi.fn().mockResolvedValue(false),
      };
      mockGetPostHogClient.mockReturnValue(mockClient);

      const result = await isFeatureFlagEnabled("test-flag", "user-123");

      expect(result).toEqual({ enabled: false, source: "posthog" });
    });

    it("passes user properties to PostHog", async () => {
      const mockClient = {
        isFeatureEnabled: vi.fn().mockResolvedValue(true),
      };
      mockGetPostHogClient.mockReturnValue(mockClient);

      await isFeatureFlagEnabled("test-flag", "user-123", {
        userProperties: { email: "test@example.com", role: "admin" },
      });

      expect(mockClient.isFeatureEnabled).toHaveBeenCalledWith("test-flag", "user-123", {
        personProperties: { email: "test@example.com", role: "admin" },
      });
    });

    it("skips PostHog check when no userId provided", async () => {
      const mockClient = {
        isFeatureEnabled: vi.fn(),
      };
      mockGetPostHogClient.mockReturnValue(mockClient);
      mockDb.appConfig.findUnique.mockResolvedValue({ value: "true" });

      const result = await isFeatureFlagEnabled("test-flag");

      expect(mockClient.isFeatureEnabled).not.toHaveBeenCalled();
      expect(result.source).toBe("database");
    });
  });

  describe("database fallback", () => {
    it("falls back to database when PostHog returns undefined", async () => {
      const mockClient = {
        isFeatureEnabled: vi.fn().mockResolvedValue(undefined),
      };
      mockGetPostHogClient.mockReturnValue(mockClient);
      mockDb.appConfig.findUnique.mockResolvedValue({ value: "true" });

      const result = await isFeatureFlagEnabled("test-flag", "user-123");

      expect(result).toEqual({ enabled: true, source: "database" });
      expect(mockDb.appConfig.findUnique).toHaveBeenCalledWith({
        where: { key: "feature_flag_test-flag" },
        select: { value: true },
      });
    });

    it("falls back to database when PostHog client is null", async () => {
      mockGetPostHogClient.mockReturnValue(null);
      mockDb.appConfig.findUnique.mockResolvedValue({ value: "false" });

      const result = await isFeatureFlagEnabled("test-flag", "user-123");

      expect(result).toEqual({ enabled: false, source: "database" });
    });

    it("falls back to database when PostHog throws error", async () => {
      const mockClient = {
        isFeatureEnabled: vi.fn().mockRejectedValue(new Error("PostHog error")),
      };
      mockGetPostHogClient.mockReturnValue(mockClient);
      mockDb.appConfig.findUnique.mockResolvedValue({ value: "true" });

      const result = await isFeatureFlagEnabled("test-flag", "user-123");

      expect(result).toEqual({ enabled: true, source: "database" });
    });

    it("returns database false value correctly", async () => {
      mockGetPostHogClient.mockReturnValue(null);
      mockDb.appConfig.findUnique.mockResolvedValue({ value: "false" });

      const result = await isFeatureFlagEnabled("test-flag");

      expect(result).toEqual({ enabled: false, source: "database" });
    });
  });

  describe("default value fallback", () => {
    it("returns default value when neither PostHog nor database has flag", async () => {
      mockGetPostHogClient.mockReturnValue(null);
      mockDb.appConfig.findUnique.mockResolvedValue(null);

      const result = await isFeatureFlagEnabled("test-flag", "user-123", {
        defaultValue: true,
      });

      expect(result).toEqual({ enabled: true, source: "default" });
    });

    it("returns false as default when not specified", async () => {
      mockGetPostHogClient.mockReturnValue(null);
      mockDb.appConfig.findUnique.mockResolvedValue(null);

      const result = await isFeatureFlagEnabled("test-flag");

      expect(result).toEqual({ enabled: false, source: "default" });
    });

    it("returns default when database throws error", async () => {
      mockGetPostHogClient.mockReturnValue(null);
      mockDb.appConfig.findUnique.mockRejectedValue(new Error("DB error"));

      const result = await isFeatureFlagEnabled("test-flag", undefined, {
        defaultValue: true,
      });

      expect(result).toEqual({ enabled: true, source: "default" });
    });
  });
});

describe("isFeatureEnabled", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPostHogClient.mockReturnValue(null);
  });

  it("returns boolean value only", async () => {
    mockDb.appConfig.findUnique.mockResolvedValue({ value: "true" });

    const result = await isFeatureEnabled("test-flag");

    expect(result).toBe(true);
  });

  it("uses provided default value", async () => {
    mockDb.appConfig.findUnique.mockResolvedValue(null);

    const result = await isFeatureEnabled("test-flag", undefined, true);

    expect(result).toBe(true);
  });
});

describe("getAllFeatureFlags", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPostHogClient.mockReturnValue(null);
  });

  it("returns all requested flags", async () => {
    mockDb.appConfig.findUnique
      .mockResolvedValueOnce({ value: "true" })
      .mockResolvedValueOnce({ value: "false" })
      .mockResolvedValueOnce(null);

    const result = await getAllFeatureFlags(undefined, ["flag-1", "flag-2", "flag-3"]);

    expect(result).toEqual({
      "flag-1": true,
      "flag-2": false,
      "flag-3": false,
    });
  });

  it("returns empty object for empty flag keys", async () => {
    const result = await getAllFeatureFlags(undefined, []);

    expect(result).toEqual({});
  });
});
