/**
 * Unit tests for audit.ts - Audit logging utilities
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

// Hoist mocks for vitest
const { mockConfigAuditLog } = vi.hoisted(() => ({
  mockConfigAuditLog: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
}));

// Mock database
vi.mock("@/lib/db", () => ({
  db: {
    configAuditLog: mockConfigAuditLog,
  },
}));

import {
  createAuditLog,
  getAuditLogs,
  getRecentAuditLogs,
  computeChanges,
} from "@/lib/audit";

describe("Audit Logging", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createAuditLog", () => {
    it("creates an audit log entry with all required fields", async () => {
      const mockLogEntry = {
        id: "log_123",
        entityType: "PlanConfig",
        entityId: "plan_123",
        action: "CREATE",
        changes: { name: { old: null, new: "Pro Plan" } },
        userId: "user_123",
        userEmail: "admin@test.com",
        createdAt: new Date(),
      };
      mockConfigAuditLog.create.mockResolvedValue(mockLogEntry);

      const result = await createAuditLog({
        entityType: "PlanConfig",
        entityId: "plan_123",
        action: "CREATE",
        changes: { name: { old: null, new: "Pro Plan" } },
        userId: "user_123",
        userEmail: "admin@test.com",
      });

      expect(mockConfigAuditLog.create).toHaveBeenCalledWith({
        data: {
          entityType: "PlanConfig",
          entityId: "plan_123",
          action: "CREATE",
          changes: { name: { old: null, new: "Pro Plan" } },
          userId: "user_123",
          userEmail: "admin@test.com",
        },
      });
      expect(result).toEqual(mockLogEntry);
    });

    it("creates audit log for UPDATE action", async () => {
      const mockLogEntry = {
        id: "log_124",
        entityType: "AppConfig",
        entityId: "config_123",
        action: "UPDATE",
        changes: { value: { old: "old_value", new: "new_value" } },
        userId: "user_456",
        userEmail: "admin@test.com",
        createdAt: new Date(),
      };
      mockConfigAuditLog.create.mockResolvedValue(mockLogEntry);

      const result = await createAuditLog({
        entityType: "AppConfig",
        entityId: "config_123",
        action: "UPDATE",
        changes: { value: { old: "old_value", new: "new_value" } },
        userId: "user_456",
        userEmail: "admin@test.com",
      });

      expect(mockConfigAuditLog.create).toHaveBeenCalledWith({
        data: {
          entityType: "AppConfig",
          entityId: "config_123",
          action: "UPDATE",
          changes: { value: { old: "old_value", new: "new_value" } },
          userId: "user_456",
          userEmail: "admin@test.com",
        },
      });
      expect(result.action).toBe("UPDATE");
    });

    it("creates audit log for DELETE action", async () => {
      const mockLogEntry = {
        id: "log_125",
        entityType: "User",
        entityId: "user_789",
        action: "DELETE",
        changes: { status: { old: "active", new: "deleted" } },
        userId: "admin_123",
        userEmail: "superadmin@test.com",
        createdAt: new Date(),
      };
      mockConfigAuditLog.create.mockResolvedValue(mockLogEntry);

      const result = await createAuditLog({
        entityType: "User",
        entityId: "user_789",
        action: "DELETE",
        changes: { status: { old: "active", new: "deleted" } },
        userId: "admin_123",
        userEmail: "superadmin@test.com",
      });

      expect(result.action).toBe("DELETE");
      expect(result.entityType).toBe("User");
    });

    it("handles complex nested changes in the changes field", async () => {
      const complexChanges = {
        features: {
          old: ["feature1"],
          new: ["feature1", "feature2", "feature3"],
        },
        pricing: {
          old: { monthly: 10, yearly: 100 },
          new: { monthly: 15, yearly: 150 },
        },
      };
      mockConfigAuditLog.create.mockResolvedValue({
        id: "log_126",
        changes: complexChanges,
      });

      await createAuditLog({
        entityType: "PlanConfig",
        entityId: "plan_456",
        action: "UPDATE",
        changes: complexChanges,
        userId: "user_123",
        userEmail: "admin@test.com",
      });

      expect(mockConfigAuditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          changes: complexChanges,
        }),
      });
    });

    it("propagates database errors", async () => {
      mockConfigAuditLog.create.mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(
        createAuditLog({
          entityType: "PlanConfig",
          entityId: "plan_123",
          action: "CREATE",
          changes: {},
          userId: "user_123",
          userEmail: "admin@test.com",
        })
      ).rejects.toThrow("Database connection failed");
    });
  });

  describe("getAuditLogs", () => {
    const mockLogs = [
      {
        id: "log_1",
        entityType: "PlanConfig",
        entityId: "plan_123",
        action: "CREATE",
        createdAt: new Date("2024-01-03"),
      },
      {
        id: "log_2",
        entityType: "PlanConfig",
        entityId: "plan_123",
        action: "UPDATE",
        createdAt: new Date("2024-01-02"),
      },
      {
        id: "log_3",
        entityType: "AppConfig",
        entityId: "config_456",
        action: "UPDATE",
        createdAt: new Date("2024-01-01"),
      },
    ];

    it("returns all logs when no filters provided", async () => {
      mockConfigAuditLog.findMany.mockResolvedValue(mockLogs);

      const result = await getAuditLogs();

      expect(mockConfigAuditLog.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      expect(result).toEqual(mockLogs);
    });

    it("filters logs by entityType", async () => {
      const filteredLogs = mockLogs.filter(
        (log) => log.entityType === "PlanConfig"
      );
      mockConfigAuditLog.findMany.mockResolvedValue(filteredLogs);

      const result = await getAuditLogs("PlanConfig");

      expect(mockConfigAuditLog.findMany).toHaveBeenCalledWith({
        where: { entityType: "PlanConfig" },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      expect(result).toHaveLength(2);
    });

    it("filters logs by entityType and entityId", async () => {
      const filteredLogs = mockLogs.filter(
        (log) =>
          log.entityType === "PlanConfig" && log.entityId === "plan_123"
      );
      mockConfigAuditLog.findMany.mockResolvedValue(filteredLogs);

      const result = await getAuditLogs("PlanConfig", "plan_123");

      expect(mockConfigAuditLog.findMany).toHaveBeenCalledWith({
        where: { entityType: "PlanConfig", entityId: "plan_123" },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      expect(result).toHaveLength(2);
    });

    it("respects custom limit parameter", async () => {
      mockConfigAuditLog.findMany.mockResolvedValue([mockLogs[0]]);

      const result = await getAuditLogs(undefined, undefined, 1);

      expect(mockConfigAuditLog.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: "desc" },
        take: 1,
      });
      expect(result).toHaveLength(1);
    });

    it("filters by entityId only when entityType is undefined", async () => {
      mockConfigAuditLog.findMany.mockResolvedValue([]);

      await getAuditLogs(undefined, "plan_123");

      expect(mockConfigAuditLog.findMany).toHaveBeenCalledWith({
        where: { entityId: "plan_123" },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    });

    it("returns empty array when no logs found", async () => {
      mockConfigAuditLog.findMany.mockResolvedValue([]);

      const result = await getAuditLogs("NonExistentType");

      expect(result).toEqual([]);
    });

    it("orders logs by createdAt descending", async () => {
      mockConfigAuditLog.findMany.mockResolvedValue(mockLogs);

      await getAuditLogs();

      expect(mockConfigAuditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: "desc" },
        })
      );
    });
  });

  describe("getRecentAuditLogs", () => {
    const mockRecentLogs = [
      { id: "log_1", action: "CREATE", createdAt: new Date("2024-01-03") },
      { id: "log_2", action: "UPDATE", createdAt: new Date("2024-01-02") },
    ];

    it("returns recent logs with default limit of 20", async () => {
      mockConfigAuditLog.findMany.mockResolvedValue(mockRecentLogs);

      const result = await getRecentAuditLogs();

      expect(mockConfigAuditLog.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: "desc" },
        take: 20,
      });
      expect(result).toEqual(mockRecentLogs);
    });

    it("respects custom limit parameter", async () => {
      mockConfigAuditLog.findMany.mockResolvedValue([mockRecentLogs[0]]);

      const result = await getRecentAuditLogs(5);

      expect(mockConfigAuditLog.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: "desc" },
        take: 5,
      });
      expect(result).toHaveLength(1);
    });

    it("returns empty array when no recent logs", async () => {
      mockConfigAuditLog.findMany.mockResolvedValue([]);

      const result = await getRecentAuditLogs();

      expect(result).toEqual([]);
    });

    it("handles large limit values", async () => {
      mockConfigAuditLog.findMany.mockResolvedValue([]);

      await getRecentAuditLogs(1000);

      expect(mockConfigAuditLog.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: "desc" },
        take: 1000,
      });
    });
  });

  describe("computeChanges", () => {
    it("detects changes in tracked fields", () => {
      const oldObj = { name: "Old Name", price: 100, description: "Old desc" };
      const newObj = { name: "New Name", price: 100, description: "New desc" };

      const changes = computeChanges(oldObj, newObj, ["name", "description"]);

      expect(changes).toEqual({
        name: { old: "Old Name", new: "New Name" },
        description: { old: "Old desc", new: "New desc" },
      });
    });

    it("returns empty object when no changes detected", () => {
      const oldObj = { name: "Same", price: 100 };
      const newObj = { name: "Same", price: 100 };

      const changes = computeChanges(oldObj, newObj, ["name", "price"]);

      expect(changes).toEqual({});
    });

    it("handles null old object (creation scenario)", () => {
      const newObj = { name: "New Item", price: 50 };

      const changes = computeChanges(null, newObj, ["name", "price"]);

      expect(changes).toEqual({
        name: { old: undefined, new: "New Item" },
        price: { old: undefined, new: 50 },
      });
    });

    it("only tracks specified fields", () => {
      const oldObj = { name: "Old", price: 100, hidden: "secret" };
      const newObj = { name: "New", price: 200, hidden: "new_secret" };

      const changes = computeChanges(oldObj, newObj, ["name"]);

      expect(changes).toEqual({
        name: { old: "Old", new: "New" },
      });
      expect(changes).not.toHaveProperty("price");
      expect(changes).not.toHaveProperty("hidden");
    });

    it("handles array field changes", () => {
      const oldObj = { features: ["a", "b"] };
      const newObj = { features: ["a", "b", "c"] };

      const changes = computeChanges(oldObj, newObj, ["features"]);

      expect(changes).toEqual({
        features: { old: ["a", "b"], new: ["a", "b", "c"] },
      });
    });

    it("handles object field changes", () => {
      const oldObj = { settings: { theme: "dark", notifications: true } };
      const newObj = { settings: { theme: "light", notifications: true } };

      const changes = computeChanges(oldObj, newObj, ["settings"]);

      expect(changes).toEqual({
        settings: {
          old: { theme: "dark", notifications: true },
          new: { theme: "light", notifications: true },
        },
      });
    });

    it("treats identical arrays as unchanged", () => {
      const oldObj = { items: [1, 2, 3] };
      const newObj = { items: [1, 2, 3] };

      const changes = computeChanges(oldObj, newObj, ["items"]);

      expect(changes).toEqual({});
    });

    it("treats identical objects as unchanged", () => {
      const oldObj = { config: { a: 1, b: 2 } };
      const newObj = { config: { a: 1, b: 2 } };

      const changes = computeChanges(oldObj, newObj, ["config"]);

      expect(changes).toEqual({});
    });

    it("handles undefined values in new object", () => {
      const oldObj: { name: string; optional: string | undefined } = { name: "Test", optional: "value" };
      const newObj: { name: string; optional: string | undefined } = { name: "Test", optional: undefined };

      const changes = computeChanges(oldObj, newObj, ["optional"]);

      expect(changes).toEqual({
        optional: { old: "value", new: undefined },
      });
    });

    it("handles empty tracked fields array", () => {
      const oldObj = { name: "Old", price: 100 };
      const newObj = { name: "New", price: 200 };

      const changes = computeChanges(oldObj, newObj, []);

      expect(changes).toEqual({});
    });

    it("handles boolean field changes", () => {
      const oldObj = { isActive: true };
      const newObj = { isActive: false };

      const changes = computeChanges(oldObj, newObj, ["isActive"]);

      expect(changes).toEqual({
        isActive: { old: true, new: false },
      });
    });

    it("handles number field changes", () => {
      const oldObj = { count: 0 };
      const newObj = { count: 1 };

      const changes = computeChanges(oldObj, newObj, ["count"]);

      expect(changes).toEqual({
        count: { old: 0, new: 1 },
      });
    });

    it("handles null to value changes", () => {
      const oldObj: { value: string | null } = { value: null };
      const newObj: { value: string | null } = { value: "new_value" };

      const changes = computeChanges(oldObj, newObj, ["value"]);

      expect(changes).toEqual({
        value: { old: null, new: "new_value" },
      });
    });

    it("handles value to null changes", () => {
      const oldObj: { value: string | null } = { value: "old_value" };
      const newObj: { value: string | null } = { value: null };

      const changes = computeChanges(oldObj, newObj, ["value"]);

      expect(changes).toEqual({
        value: { old: "old_value", new: null },
      });
    });
  });
});
