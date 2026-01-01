import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies BEFORE imports
const {
  mockRequireAdmin,
  mockDb,
  mockCreateAuditLog,
  mockComputeChanges,
  mockInvalidateCache,
} = vi.hoisted(() => ({
  mockRequireAdmin: vi.fn(),
  mockDb: {
    planConfig: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    appConfig: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    configAuditLog: {
      findMany: vi.fn(),
    },
  },
  mockCreateAuditLog: vi.fn(),
  mockComputeChanges: vi.fn(),
  mockInvalidateCache: vi.fn(),
}));

vi.mock("@/lib/admin", () => ({
  requireAdmin: mockRequireAdmin,
}));

vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

vi.mock("@/lib/audit", () => ({
  createAuditLog: mockCreateAuditLog,
  computeChanges: mockComputeChanges,
}));

vi.mock("@/lib/config", () => ({
  invalidateCache: mockInvalidateCache,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import {
  getPlanConfigs,
  updatePlanConfig,
  getAppConfigs,
  getAppConfigsByCategory,
  updateAppConfig,
  deleteAppConfig,
  getFeatureFlags,
  toggleFeatureFlag,
  getAuditLogs,
} from "@/actions/admin/config";

describe("admin/config actions", () => {
  const adminSession = {
    user: {
      id: "admin-1",
      email: "admin@example.com",
      role: "ADMIN",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue(adminSession);
    mockCreateAuditLog.mockResolvedValue(undefined);
    mockInvalidateCache.mockReturnValue(undefined);
  });

  describe("getPlanConfigs", () => {
    it("requires admin access", async () => {
      mockDb.planConfig.findMany.mockResolvedValue([]);

      await getPlanConfigs();

      expect(mockRequireAdmin).toHaveBeenCalled();
    });

    it("returns all plan configs sorted by sortOrder", async () => {
      const configs = [
        { id: "1", plan: "FREE", sortOrder: 1 },
        { id: "2", plan: "PRO", sortOrder: 2 },
      ];
      mockDb.planConfig.findMany.mockResolvedValue(configs);

      const result = await getPlanConfigs();

      expect(result).toEqual(configs);
      expect(mockDb.planConfig.findMany).toHaveBeenCalledWith({
        orderBy: { sortOrder: "asc" },
      });
    });
  });

  describe("updatePlanConfig", () => {
    const updateData = {
      name: "Pro Plan",
      description: "Professional features",
      monthlyPrice: 29,
      yearlyPrice: 290,
    };

    it("requires admin access", async () => {
      mockDb.planConfig.findUnique.mockResolvedValue(null);
      mockDb.planConfig.create.mockResolvedValue({});

      await updatePlanConfig("PRO", updateData);

      expect(mockRequireAdmin).toHaveBeenCalled();
    });

    it("creates new plan config when not exists", async () => {
      mockDb.planConfig.findUnique.mockResolvedValue(null);
      mockDb.planConfig.create.mockResolvedValue({
        id: "config-1",
        plan: "PRO",
        ...updateData,
      });

      const result = await updatePlanConfig("PRO", updateData);

      expect(mockDb.planConfig.create).toHaveBeenCalledWith({
        data: {
          plan: "PRO",
          name: updateData.name,
          ...updateData,
        },
      });
      expect(result).toBeDefined();
    });

    it("updates existing plan config", async () => {
      const existing = {
        id: "config-1",
        plan: "PRO",
        name: "Old Name",
        monthlyPrice: 20,
      };
      mockDb.planConfig.findUnique.mockResolvedValue(existing);
      mockDb.planConfig.update.mockResolvedValue({
        ...existing,
        ...updateData,
      });
      mockComputeChanges.mockReturnValue({ name: { old: "Old Name", new: "Pro Plan" } });

      await updatePlanConfig("PRO", updateData);

      expect(mockDb.planConfig.update).toHaveBeenCalledWith({
        where: { plan: "PRO" },
        data: updateData,
      });
    });

    it("creates audit log on creation", async () => {
      mockDb.planConfig.findUnique.mockResolvedValue(null);
      mockDb.planConfig.create.mockResolvedValue({
        id: "config-1",
        plan: "PRO",
      });

      await updatePlanConfig("PRO", updateData);

      expect(mockCreateAuditLog).toHaveBeenCalledWith({
        entityType: "PlanConfig",
        entityId: "config-1",
        action: "CREATE",
        changes: { plan: { old: null, new: "PRO" } },
        userId: adminSession.user.id,
        userEmail: adminSession.user.email,
      });
    });

    it("creates audit log on update with changes", async () => {
      const existing = { id: "config-1", plan: "PRO", name: "Old" };
      mockDb.planConfig.findUnique.mockResolvedValue(existing);
      mockDb.planConfig.update.mockResolvedValue({ ...existing, name: "New" });
      mockComputeChanges.mockReturnValue({ name: { old: "Old", new: "New" } });

      await updatePlanConfig("PRO", { name: "New" });

      expect(mockComputeChanges).toHaveBeenCalled();
      expect(mockCreateAuditLog).toHaveBeenCalled();
    });

    it("skips audit log when no changes detected", async () => {
      const existing = { id: "config-1", plan: "PRO", name: "Same" };
      mockDb.planConfig.findUnique.mockResolvedValue(existing);
      mockDb.planConfig.update.mockResolvedValue(existing);
      mockComputeChanges.mockReturnValue({});

      await updatePlanConfig("PRO", { name: "Same" });

      expect(mockCreateAuditLog).not.toHaveBeenCalled();
    });

    it("invalidates cache after update", async () => {
      mockDb.planConfig.findUnique.mockResolvedValue(null);
      mockDb.planConfig.create.mockResolvedValue({ id: "config-1" });

      await updatePlanConfig("PRO", updateData);

      expect(mockInvalidateCache).toHaveBeenCalledWith("plan_configs");
    });

    it("revalidates admin plans page", async () => {
      mockDb.planConfig.findUnique.mockResolvedValue(null);
      mockDb.planConfig.create.mockResolvedValue({ id: "config-1" });
      const { revalidatePath } = await import("next/cache");

      await updatePlanConfig("PRO", updateData);

      expect(revalidatePath).toHaveBeenCalledWith("/admin/plans");
    });
  });

  describe("getAppConfigs", () => {
    it("requires admin access", async () => {
      mockDb.appConfig.findMany.mockResolvedValue([]);

      await getAppConfigs();

      expect(mockRequireAdmin).toHaveBeenCalled();
    });

    it("returns all app configs sorted by category and key", async () => {
      const configs = [
        { id: "1", category: "general", key: "app_name" },
        { id: "2", category: "general", key: "app_url" },
      ];
      mockDb.appConfig.findMany.mockResolvedValue(configs);

      const result = await getAppConfigs();

      expect(result).toEqual(configs);
      expect(mockDb.appConfig.findMany).toHaveBeenCalledWith({
        orderBy: [{ category: "asc" }, { key: "asc" }],
      });
    });
  });

  describe("getAppConfigsByCategory", () => {
    it("requires admin access", async () => {
      mockDb.appConfig.findMany.mockResolvedValue([]);

      await getAppConfigsByCategory("features");

      expect(mockRequireAdmin).toHaveBeenCalled();
    });

    it("filters configs by category", async () => {
      const configs = [
        { id: "1", category: "features", key: "feature_1" },
      ];
      mockDb.appConfig.findMany.mockResolvedValue(configs);

      const result = await getAppConfigsByCategory("features");

      expect(result).toEqual(configs);
      expect(mockDb.appConfig.findMany).toHaveBeenCalledWith({
        where: { category: "features" },
        orderBy: { key: "asc" },
      });
    });
  });

  describe("updateAppConfig", () => {
    it("requires admin access", async () => {
      mockDb.appConfig.findUnique.mockResolvedValue(null);
      mockDb.appConfig.create.mockResolvedValue({});

      await updateAppConfig("test_key", "test_value");

      expect(mockRequireAdmin).toHaveBeenCalled();
    });

    it("creates new config when not exists", async () => {
      mockDb.appConfig.findUnique.mockResolvedValue(null);
      mockDb.appConfig.create.mockResolvedValue({
        id: "config-1",
        key: "test_key",
        value: "test_value",
      });

      await updateAppConfig("test_key", "test_value", {
        description: "Test config",
        category: "testing",
      });

      expect(mockDb.appConfig.create).toHaveBeenCalledWith({
        data: {
          key: "test_key",
          value: "test_value",
          description: "Test config",
          category: "testing",
        },
      });
    });

    it("uses default category when not provided", async () => {
      mockDb.appConfig.findUnique.mockResolvedValue(null);
      mockDb.appConfig.create.mockResolvedValue({ id: "config-1" });

      await updateAppConfig("test_key", "test_value");

      expect(mockDb.appConfig.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          category: "general",
        }),
      });
    });

    it("updates existing config", async () => {
      const existing = {
        id: "config-1",
        key: "test_key",
        value: "old_value",
      };
      mockDb.appConfig.findUnique.mockResolvedValue(existing);
      mockDb.appConfig.update.mockResolvedValue({
        ...existing,
        value: "new_value",
      });

      await updateAppConfig("test_key", "new_value");

      expect(mockDb.appConfig.update).toHaveBeenCalledWith({
        where: { key: "test_key" },
        data: {
          value: "new_value",
        },
      });
    });

    it("creates audit log for updates", async () => {
      const existing = {
        id: "config-1",
        key: "test_key",
        value: "old",
      };
      mockDb.appConfig.findUnique.mockResolvedValue(existing);
      mockDb.appConfig.update.mockResolvedValue({ ...existing, value: "new" });

      await updateAppConfig("test_key", "new");

      expect(mockCreateAuditLog).toHaveBeenCalledWith({
        entityType: "AppConfig",
        entityId: "config-1",
        action: "UPDATE",
        changes: { value: { old: "old", new: "new" } },
        userId: adminSession.user.id,
        userEmail: adminSession.user.email,
      });
    });

    it("invalidates cache after update", async () => {
      mockDb.appConfig.findUnique.mockResolvedValue(null);
      mockDb.appConfig.create.mockResolvedValue({ id: "config-1" });

      await updateAppConfig("test_key", "test_value");

      expect(mockInvalidateCache).toHaveBeenCalledWith("app_configs");
    });
  });

  describe("deleteAppConfig", () => {
    it("requires admin access", async () => {
      mockDb.appConfig.findUnique.mockResolvedValue({ id: "config-1", key: "test" });
      mockDb.appConfig.delete.mockResolvedValue({});

      await deleteAppConfig("test_key");

      expect(mockRequireAdmin).toHaveBeenCalled();
    });

    it("throws error when config not found", async () => {
      mockDb.appConfig.findUnique.mockResolvedValue(null);

      await expect(deleteAppConfig("nonexistent")).rejects.toThrow("Config not found");
    });

    it("deletes the config", async () => {
      const existing = { id: "config-1", key: "test_key", value: "value" };
      mockDb.appConfig.findUnique.mockResolvedValue(existing);
      mockDb.appConfig.delete.mockResolvedValue({});

      await deleteAppConfig("test_key");

      expect(mockDb.appConfig.delete).toHaveBeenCalledWith({
        where: { key: "test_key" },
      });
    });

    it("creates audit log for deletion", async () => {
      const existing = { id: "config-1", key: "test_key", value: "value" };
      mockDb.appConfig.findUnique.mockResolvedValue(existing);
      mockDb.appConfig.delete.mockResolvedValue({});

      await deleteAppConfig("test_key");

      expect(mockCreateAuditLog).toHaveBeenCalledWith({
        entityType: "AppConfig",
        entityId: "config-1",
        action: "DELETE",
        changes: {
          key: { old: "test_key", new: null },
          value: { old: "value", new: null },
        },
        userId: adminSession.user.id,
        userEmail: adminSession.user.email,
      });
    });

    it("invalidates cache after deletion", async () => {
      mockDb.appConfig.findUnique.mockResolvedValue({ id: "config-1", key: "test" });
      mockDb.appConfig.delete.mockResolvedValue({});

      await deleteAppConfig("test_key");

      expect(mockInvalidateCache).toHaveBeenCalledWith("app_configs");
    });
  });

  describe("getFeatureFlags", () => {
    it("requires admin access", async () => {
      mockDb.appConfig.findMany.mockResolvedValue([]);

      await getFeatureFlags();

      expect(mockRequireAdmin).toHaveBeenCalled();
    });

    it("filters configs by features category", async () => {
      mockDb.appConfig.findMany.mockResolvedValue([]);

      await getFeatureFlags();

      expect(mockDb.appConfig.findMany).toHaveBeenCalledWith({
        where: { category: "features" },
        orderBy: { key: "asc" },
      });
    });

    it("formats feature flags correctly", async () => {
      mockDb.appConfig.findMany.mockResolvedValue([
        { key: "feature_dark_mode", value: true, description: "Dark mode" },
        { key: "feature_export", value: false, description: "Export feature" },
      ]);

      const result = await getFeatureFlags();

      expect(result).toEqual([
        { key: "dark_mode", enabled: true, description: "Dark mode" },
        { key: "export", enabled: false, description: "Export feature" },
      ]);
    });

    it("handles non-boolean values as false", async () => {
      mockDb.appConfig.findMany.mockResolvedValue([
        { key: "feature_test", value: "not_boolean", description: "Test" },
      ]);

      const result = await getFeatureFlags();

      expect(result[0]?.enabled).toBe(false);
    });
  });

  describe("toggleFeatureFlag", () => {
    it("requires admin access", async () => {
      mockDb.appConfig.findUnique.mockResolvedValue(null);
      mockDb.appConfig.upsert.mockResolvedValue({ id: "1", key: "feature_test" });

      await toggleFeatureFlag("test_flag");

      expect(mockRequireAdmin).toHaveBeenCalled();
    });

    it("creates new feature flag when not exists", async () => {
      mockDb.appConfig.findUnique.mockResolvedValue(null);
      mockDb.appConfig.upsert.mockResolvedValue({
        id: "config-1",
        key: "feature_test",
        value: true,
      });

      await toggleFeatureFlag("test_flag");

      expect(mockDb.appConfig.upsert).toHaveBeenCalledWith({
        where: { key: "feature_test_flag" },
        update: { value: true },
        create: {
          key: "feature_test_flag",
          value: true,
          category: "features",
          description: "Feature flag: test_flag",
        },
      });
    });

    it("toggles existing flag from true to false", async () => {
      mockDb.appConfig.findUnique.mockResolvedValue({
        id: "config-1",
        key: "feature_test",
        value: true,
      });
      mockDb.appConfig.upsert.mockResolvedValue({
        id: "config-1",
        key: "feature_test",
        value: false,
      });

      const result = await toggleFeatureFlag("test");

      expect(result).toEqual({ key: "test", enabled: false });
    });

    it("toggles existing flag from false to true", async () => {
      mockDb.appConfig.findUnique.mockResolvedValue({
        id: "config-1",
        key: "feature_test",
        value: false,
      });
      mockDb.appConfig.upsert.mockResolvedValue({
        id: "config-1",
        key: "feature_test",
        value: true,
      });

      const result = await toggleFeatureFlag("test");

      expect(result).toEqual({ key: "test", enabled: true });
    });

    it("creates audit log with correct action", async () => {
      mockDb.appConfig.findUnique.mockResolvedValue(null);
      mockDb.appConfig.upsert.mockResolvedValue({
        id: "config-1",
        key: "feature_test",
      });

      await toggleFeatureFlag("test");

      expect(mockCreateAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "CREATE",
        })
      );
    });

    it("invalidates cache after toggle", async () => {
      mockDb.appConfig.findUnique.mockResolvedValue(null);
      mockDb.appConfig.upsert.mockResolvedValue({ id: "config-1" });

      await toggleFeatureFlag("test");

      expect(mockInvalidateCache).toHaveBeenCalledWith("app_configs");
    });
  });

  describe("getAuditLogs", () => {
    it("requires admin access", async () => {
      mockDb.configAuditLog.findMany.mockResolvedValue([]);

      await getAuditLogs();

      expect(mockRequireAdmin).toHaveBeenCalled();
    });

    it("returns logs with default limit of 50", async () => {
      mockDb.configAuditLog.findMany.mockResolvedValue([]);

      await getAuditLogs();

      expect(mockDb.configAuditLog.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    });

    it("respects custom limit", async () => {
      mockDb.configAuditLog.findMany.mockResolvedValue([]);

      await getAuditLogs(100);

      expect(mockDb.configAuditLog.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: "desc" },
        take: 100,
      });
    });

    it("returns logs in descending order by createdAt", async () => {
      const logs = [
        { id: "1", createdAt: new Date("2024-01-02") },
        { id: "2", createdAt: new Date("2024-01-01") },
      ];
      mockDb.configAuditLog.findMany.mockResolvedValue(logs);

      const result = await getAuditLogs();

      expect(result).toEqual(logs);
    });
  });
});
