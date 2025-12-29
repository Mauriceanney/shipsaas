/**
 * Unit tests for config.ts - Configuration service with caching
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import type { PlanConfig, AppConfig } from "@prisma/client";

// Hoist mocks for vitest
const { mockPlanConfig, mockAppConfig } = vi.hoisted(() => ({
  mockPlanConfig: {
    findMany: vi.fn(),
    count: vi.fn(),
    createMany: vi.fn(),
  },
  mockAppConfig: {
    findMany: vi.fn(),
    count: vi.fn(),
    createMany: vi.fn(),
  },
}));

// Mock database
vi.mock("@/lib/db", () => ({
  db: {
    planConfig: mockPlanConfig,
    appConfig: mockAppConfig,
  },
}));

import {
  invalidateCache,
  getPlanConfigs,
  getActivePlanConfigs,
  getPlanConfig,
  getAppConfigs,
  getAppConfigsByCategory,
  getAppConfig,
  isFeatureEnabled,
  getFeatureFlags,
  seedDefaultPlanConfigs,
  seedDefaultAppConfigs,
} from "@/lib/config";

// Sample mock data
const mockPlanConfigData: PlanConfig[] = [
  {
    id: "plan_1",
    plan: "FREE",
    name: "Free",
    description: "Get started with basic features",
    monthlyPrice: 0,
    yearlyPrice: 0,
    monthlyPriceId: null,
    yearlyPriceId: null,
    features: ["Basic features", "1 project"],
    isActive: true,
    sortOrder: 0,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "plan_2",
    plan: "PRO",
    name: "Pro",
    description: "Perfect for professionals",
    monthlyPrice: 2900,
    yearlyPrice: 29000,
    monthlyPriceId: null,
    yearlyPriceId: null,
    features: ["All Free features", "Unlimited projects"],
    isActive: true,
    sortOrder: 1,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "plan_3",
    plan: "ENTERPRISE",
    name: "Enterprise",
    description: "For large organizations",
    monthlyPrice: 9900,
    yearlyPrice: 99000,
    monthlyPriceId: null,
    yearlyPriceId: null,
    features: ["All Pro features", "Custom integrations"],
    isActive: false, // Inactive plan
    sortOrder: 2,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
];

const mockAppConfigData: AppConfig[] = [
  {
    id: "config_1",
    key: "site_name",
    value: "ShipSaaS",
    description: "The name of the application",
    category: "general",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "config_2",
    key: "feature_dark_mode",
    value: true,
    description: "Enable dark mode toggle",
    category: "features",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "config_3",
    key: "feature_user_registration",
    value: true,
    description: "Allow new user registrations",
    category: "features",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "config_4",
    key: "feature_maintenance_mode",
    value: false,
    description: "Maintenance mode flag",
    category: "features",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "config_5",
    key: "max_upload_size",
    value: 10485760,
    description: "Maximum file upload size in bytes",
    category: "limits",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
];

describe("Configuration Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear cache before each test
    invalidateCache();
  });

  afterEach(() => {
    // Ensure cache is cleared after each test
    invalidateCache();
  });

  describe("invalidateCache", () => {
    it("clears all cache when called without key", async () => {
      // Populate cache
      mockPlanConfig.findMany.mockResolvedValue(mockPlanConfigData);
      mockAppConfig.findMany.mockResolvedValue(mockAppConfigData);

      await getPlanConfigs();
      await getAppConfigs();

      expect(mockPlanConfig.findMany).toHaveBeenCalledTimes(1);
      expect(mockAppConfig.findMany).toHaveBeenCalledTimes(1);

      // Clear cache
      invalidateCache();

      // Fetch again - should query database
      await getPlanConfigs();
      await getAppConfigs();

      expect(mockPlanConfig.findMany).toHaveBeenCalledTimes(2);
      expect(mockAppConfig.findMany).toHaveBeenCalledTimes(2);
    });

    it("clears specific cache key when provided", async () => {
      mockPlanConfig.findMany.mockResolvedValue(mockPlanConfigData);
      mockAppConfig.findMany.mockResolvedValue(mockAppConfigData);

      await getPlanConfigs();
      await getAppConfigs();

      // Clear only plan configs cache
      invalidateCache("plan_configs");

      // Plan configs should be fetched again
      await getPlanConfigs();
      expect(mockPlanConfig.findMany).toHaveBeenCalledTimes(2);

      // App configs should still be cached
      await getAppConfigs();
      expect(mockAppConfig.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe("getPlanConfigs", () => {
    it("returns all plan configurations", async () => {
      mockPlanConfig.findMany.mockResolvedValue(mockPlanConfigData);

      const configs = await getPlanConfigs();

      expect(mockPlanConfig.findMany).toHaveBeenCalledWith({
        orderBy: { sortOrder: "asc" },
      });
      expect(configs).toHaveLength(3);
    });

    it("caches results and returns cached data on subsequent calls", async () => {
      mockPlanConfig.findMany.mockResolvedValue(mockPlanConfigData);

      await getPlanConfigs();
      await getPlanConfigs();
      await getPlanConfigs();

      // Should only query database once due to caching
      expect(mockPlanConfig.findMany).toHaveBeenCalledTimes(1);
    });

    it("returns empty array when no plans exist", async () => {
      mockPlanConfig.findMany.mockResolvedValue([]);

      const configs = await getPlanConfigs();

      expect(configs).toEqual([]);
    });

    it("orders plans by sortOrder ascending", async () => {
      mockPlanConfig.findMany.mockResolvedValue(mockPlanConfigData);

      await getPlanConfigs();

      expect(mockPlanConfig.findMany).toHaveBeenCalledWith({
        orderBy: { sortOrder: "asc" },
      });
    });

    it("returns fresh data after cache invalidation", async () => {
      mockPlanConfig.findMany
        .mockResolvedValueOnce(mockPlanConfigData)
        .mockResolvedValueOnce([mockPlanConfigData[0]]);

      const firstResult = await getPlanConfigs();
      expect(firstResult).toHaveLength(3);

      invalidateCache("plan_configs");

      const secondResult = await getPlanConfigs();
      expect(secondResult).toHaveLength(1);
      expect(mockPlanConfig.findMany).toHaveBeenCalledTimes(2);
    });
  });

  describe("getActivePlanConfigs", () => {
    it("returns only active plan configurations", async () => {
      mockPlanConfig.findMany.mockResolvedValue(mockPlanConfigData);

      const activeConfigs = await getActivePlanConfigs();

      expect(activeConfigs.every((c) => c.isActive)).toBe(true);
      expect(activeConfigs).toHaveLength(2);
    });

    it("returns empty array when no active plans exist", async () => {
      const inactivePlans = mockPlanConfigData.map((p) => ({
        ...p,
        isActive: false,
      }));
      mockPlanConfig.findMany.mockResolvedValue(inactivePlans);

      const activeConfigs = await getActivePlanConfigs();

      expect(activeConfigs).toEqual([]);
    });

    it("uses cached plan configs", async () => {
      mockPlanConfig.findMany.mockResolvedValue(mockPlanConfigData);

      await getActivePlanConfigs();
      await getActivePlanConfigs();

      expect(mockPlanConfig.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe("getPlanConfig", () => {
    it("returns specific plan by plan identifier", async () => {
      mockPlanConfig.findMany.mockResolvedValue(mockPlanConfigData);

      const config = await getPlanConfig("PRO");

      expect(config).not.toBeNull();
      expect(config?.plan).toBe("PRO");
      expect(config?.name).toBe("Pro");
    });

    it("returns null for non-existent plan", async () => {
      mockPlanConfig.findMany.mockResolvedValue(mockPlanConfigData);

      const config = await getPlanConfig("ULTRA");

      expect(config).toBeNull();
    });

    it("uses cached plan configs", async () => {
      mockPlanConfig.findMany.mockResolvedValue(mockPlanConfigData);

      await getPlanConfig("FREE");
      await getPlanConfig("PRO");
      await getPlanConfig("ENTERPRISE");

      expect(mockPlanConfig.findMany).toHaveBeenCalledTimes(1);
    });

    it("returns inactive plans when queried directly", async () => {
      mockPlanConfig.findMany.mockResolvedValue(mockPlanConfigData);

      const config = await getPlanConfig("ENTERPRISE");

      expect(config).not.toBeNull();
      expect(config?.isActive).toBe(false);
    });
  });

  describe("getAppConfigs", () => {
    it("returns all app configurations", async () => {
      mockAppConfig.findMany.mockResolvedValue(mockAppConfigData);

      const configs = await getAppConfigs();

      expect(mockAppConfig.findMany).toHaveBeenCalledWith({
        orderBy: { key: "asc" },
      });
      expect(configs).toHaveLength(5);
    });

    it("caches results and returns cached data on subsequent calls", async () => {
      mockAppConfig.findMany.mockResolvedValue(mockAppConfigData);

      await getAppConfigs();
      await getAppConfigs();
      await getAppConfigs();

      expect(mockAppConfig.findMany).toHaveBeenCalledTimes(1);
    });

    it("returns empty array when no configs exist", async () => {
      mockAppConfig.findMany.mockResolvedValue([]);

      const configs = await getAppConfigs();

      expect(configs).toEqual([]);
    });
  });

  describe("getAppConfigsByCategory", () => {
    it("returns configs filtered by category", async () => {
      mockAppConfig.findMany.mockResolvedValue(mockAppConfigData);

      const featureConfigs = await getAppConfigsByCategory("features");

      expect(featureConfigs).toHaveLength(3);
      expect(featureConfigs.every((c) => c.category === "features")).toBe(true);
    });

    it("returns empty array for non-existent category", async () => {
      mockAppConfig.findMany.mockResolvedValue(mockAppConfigData);

      const configs = await getAppConfigsByCategory("non-existent");

      expect(configs).toEqual([]);
    });

    it("uses cached app configs", async () => {
      mockAppConfig.findMany.mockResolvedValue(mockAppConfigData);

      await getAppConfigsByCategory("features");
      await getAppConfigsByCategory("general");
      await getAppConfigsByCategory("limits");

      expect(mockAppConfig.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe("getAppConfig", () => {
    it("returns config value for existing key", async () => {
      mockAppConfig.findMany.mockResolvedValue(mockAppConfigData);

      const value = await getAppConfig("site_name");

      expect(value).toBe("ShipSaaS");
    });

    it("returns null for non-existent key", async () => {
      mockAppConfig.findMany.mockResolvedValue(mockAppConfigData);

      const value = await getAppConfig("non_existent_key");

      expect(value).toBeNull();
    });

    it("returns boolean values correctly", async () => {
      mockAppConfig.findMany.mockResolvedValue(mockAppConfigData);

      const darkMode = await getAppConfig<boolean>("feature_dark_mode");
      const maintenance = await getAppConfig<boolean>("feature_maintenance_mode");

      expect(darkMode).toBe(true);
      expect(maintenance).toBe(false);
    });

    it("returns number values correctly", async () => {
      mockAppConfig.findMany.mockResolvedValue(mockAppConfigData);

      const maxUpload = await getAppConfig<number>("max_upload_size");

      expect(maxUpload).toBe(10485760);
    });

    it("uses cached app configs", async () => {
      mockAppConfig.findMany.mockResolvedValue(mockAppConfigData);

      await getAppConfig("site_name");
      await getAppConfig("feature_dark_mode");
      await getAppConfig("max_upload_size");

      expect(mockAppConfig.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe("isFeatureEnabled", () => {
    it("returns true for enabled feature", async () => {
      mockAppConfig.findMany.mockResolvedValue(mockAppConfigData);

      const enabled = await isFeatureEnabled("dark_mode");

      expect(enabled).toBe(true);
    });

    it("returns false for disabled feature", async () => {
      mockAppConfig.findMany.mockResolvedValue(mockAppConfigData);

      const enabled = await isFeatureEnabled("maintenance_mode");

      expect(enabled).toBe(false);
    });

    it("returns false for non-existent feature", async () => {
      mockAppConfig.findMany.mockResolvedValue(mockAppConfigData);

      const enabled = await isFeatureEnabled("non_existent_feature");

      expect(enabled).toBe(false);
    });

    it("prepends feature_ prefix to key lookup", async () => {
      mockAppConfig.findMany.mockResolvedValue(mockAppConfigData);

      // Looking up "dark_mode" should find "feature_dark_mode"
      const enabled = await isFeatureEnabled("dark_mode");

      expect(enabled).toBe(true);
    });

    it("uses cached app configs", async () => {
      mockAppConfig.findMany.mockResolvedValue(mockAppConfigData);

      await isFeatureEnabled("dark_mode");
      await isFeatureEnabled("user_registration");
      await isFeatureEnabled("maintenance_mode");

      expect(mockAppConfig.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe("getFeatureFlags", () => {
    it("returns all feature flags as key-value pairs", async () => {
      mockAppConfig.findMany.mockResolvedValue(mockAppConfigData);

      const flags = await getFeatureFlags();

      expect(flags).toEqual({
        dark_mode: true,
        user_registration: true,
        maintenance_mode: false,
      });
    });

    it("removes feature_ prefix from keys", async () => {
      mockAppConfig.findMany.mockResolvedValue(mockAppConfigData);

      const flags = await getFeatureFlags();

      expect(Object.keys(flags)).not.toContain("feature_dark_mode");
      expect(Object.keys(flags)).toContain("dark_mode");
    });

    it("returns empty object when no feature flags exist", async () => {
      const nonFeatureConfigs = mockAppConfigData.filter(
        (c) => c.category !== "features"
      );
      mockAppConfig.findMany.mockResolvedValue(nonFeatureConfigs);

      const flags = await getFeatureFlags();

      expect(flags).toEqual({});
    });

    it("uses cached app configs", async () => {
      mockAppConfig.findMany.mockResolvedValue(mockAppConfigData);

      await getFeatureFlags();
      await getFeatureFlags();

      expect(mockAppConfig.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe("seedDefaultPlanConfigs", () => {
    it("skips seeding when plans already exist", async () => {
      mockPlanConfig.count.mockResolvedValue(3);

      await seedDefaultPlanConfigs();

      expect(mockPlanConfig.createMany).not.toHaveBeenCalled();
    });

    it("creates default plans when none exist", async () => {
      mockPlanConfig.count.mockResolvedValue(0);
      mockPlanConfig.createMany.mockResolvedValue({ count: 3 });

      await seedDefaultPlanConfigs();

      expect(mockPlanConfig.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ plan: "FREE", name: "Free" }),
          expect.objectContaining({ plan: "PRO", name: "Pro" }),
          expect.objectContaining({ plan: "ENTERPRISE", name: "Enterprise" }),
        ]),
      });
    });

    it("invalidates plan cache after seeding", async () => {
      mockPlanConfig.count.mockResolvedValue(0);
      mockPlanConfig.createMany.mockResolvedValue({ count: 3 });

      // Pre-populate cache
      mockPlanConfig.findMany.mockResolvedValue([]);
      await getPlanConfigs();

      await seedDefaultPlanConfigs();

      // Cache should be invalidated, so next call should query DB
      mockPlanConfig.findMany.mockResolvedValue(mockPlanConfigData);
      await getPlanConfigs();

      expect(mockPlanConfig.findMany).toHaveBeenCalledTimes(2);
    });

    it("creates plans with correct pricing", async () => {
      mockPlanConfig.count.mockResolvedValue(0);
      mockPlanConfig.createMany.mockResolvedValue({ count: 3 });

      await seedDefaultPlanConfigs();

      expect(mockPlanConfig.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            plan: "FREE",
            monthlyPrice: 0,
            yearlyPrice: 0,
          }),
          expect.objectContaining({
            plan: "PRO",
            monthlyPrice: 2900,
            yearlyPrice: 29000,
          }),
          expect.objectContaining({
            plan: "ENTERPRISE",
            monthlyPrice: 9900,
            yearlyPrice: 99000,
          }),
        ]),
      });
    });

    it("creates plans with correct sort order", async () => {
      mockPlanConfig.count.mockResolvedValue(0);
      mockPlanConfig.createMany.mockResolvedValue({ count: 3 });

      await seedDefaultPlanConfigs();

      expect(mockPlanConfig.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ plan: "FREE", sortOrder: 0 }),
          expect.objectContaining({ plan: "PRO", sortOrder: 1 }),
          expect.objectContaining({ plan: "ENTERPRISE", sortOrder: 2 }),
        ]),
      });
    });
  });

  describe("seedDefaultAppConfigs", () => {
    it("skips seeding when configs already exist", async () => {
      mockAppConfig.count.mockResolvedValue(5);

      await seedDefaultAppConfigs();

      expect(mockAppConfig.createMany).not.toHaveBeenCalled();
    });

    it("creates default configs when none exist", async () => {
      mockAppConfig.count.mockResolvedValue(0);
      mockAppConfig.createMany.mockResolvedValue({ count: 5 });

      await seedDefaultAppConfigs();

      expect(mockAppConfig.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ key: "site_name", category: "general" }),
          expect.objectContaining({
            key: "feature_dark_mode",
            category: "features",
          }),
        ]),
      });
    });

    it("invalidates app config cache after seeding", async () => {
      mockAppConfig.count.mockResolvedValue(0);
      mockAppConfig.createMany.mockResolvedValue({ count: 5 });

      // Pre-populate cache
      mockAppConfig.findMany.mockResolvedValue([]);
      await getAppConfigs();

      await seedDefaultAppConfigs();

      // Cache should be invalidated, so next call should query DB
      mockAppConfig.findMany.mockResolvedValue(mockAppConfigData);
      await getAppConfigs();

      expect(mockAppConfig.findMany).toHaveBeenCalledTimes(2);
    });

    it("creates feature flags with correct default values", async () => {
      mockAppConfig.count.mockResolvedValue(0);
      mockAppConfig.createMany.mockResolvedValue({ count: 5 });

      await seedDefaultAppConfigs();

      expect(mockAppConfig.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ key: "feature_dark_mode", value: true }),
          expect.objectContaining({
            key: "feature_user_registration",
            value: true,
          }),
          expect.objectContaining({ key: "feature_social_login", value: true }),
        ]),
      });
    });
  });

  describe("Cache TTL Behavior", () => {
    it("refreshes cache after TTL expires", async () => {
      mockPlanConfig.findMany.mockResolvedValue(mockPlanConfigData);

      // First call - populates cache
      await getPlanConfigs();
      expect(mockPlanConfig.findMany).toHaveBeenCalledTimes(1);

      // Advance time past TTL (5 minutes = 300000ms)
      vi.useFakeTimers();
      vi.advanceTimersByTime(5 * 60 * 1000 + 1000);

      // Second call - should refresh cache
      await getPlanConfigs();
      expect(mockPlanConfig.findMany).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    it("returns cached data within TTL", async () => {
      mockPlanConfig.findMany.mockResolvedValue(mockPlanConfigData);

      vi.useFakeTimers();

      // First call - populates cache
      await getPlanConfigs();

      // Advance time within TTL (4 minutes)
      vi.advanceTimersByTime(4 * 60 * 1000);

      // Second call - should use cache
      await getPlanConfigs();
      expect(mockPlanConfig.findMany).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });
  });

  describe("Error Handling", () => {
    it("propagates database errors from getPlanConfigs", async () => {
      mockPlanConfig.findMany.mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(getPlanConfigs()).rejects.toThrow(
        "Database connection failed"
      );
    });

    it("propagates database errors from getAppConfigs", async () => {
      mockAppConfig.findMany.mockRejectedValue(new Error("Query timeout"));

      await expect(getAppConfigs()).rejects.toThrow("Query timeout");
    });

    it("propagates database errors from seedDefaultPlanConfigs", async () => {
      mockPlanConfig.count.mockResolvedValue(0);
      mockPlanConfig.createMany.mockRejectedValue(
        new Error("Unique constraint violation")
      );

      await expect(seedDefaultPlanConfigs()).rejects.toThrow(
        "Unique constraint violation"
      );
    });

    it("propagates database errors from seedDefaultAppConfigs", async () => {
      mockAppConfig.count.mockResolvedValue(0);
      mockAppConfig.createMany.mockRejectedValue(new Error("Insert failed"));

      await expect(seedDefaultAppConfigs()).rejects.toThrow("Insert failed");
    });
  });
});
