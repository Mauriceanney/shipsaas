/**
 * Admin Bulk Actions Tests
 * TDD: Tests written before implementation
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoist mocks
const { mockAuth, mockDb, mockSendAdminMessage, mockCreateAuditLog } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockDb: {
    user: {
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
  mockSendAdminMessage: vi.fn(),
  mockCreateAuditLog: vi.fn(),
}));

// Mock dependencies
vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

vi.mock("@/lib/email", () => ({
  sendAdminMessage: mockSendAdminMessage,
}));

vi.mock("@/lib/audit", () => ({
  createAuditLog: mockCreateAuditLog,
}));

import {
  bulkDisableUsers,
  bulkEnableUsers,
  bulkChangeUserRole,
  bulkSendEmail,
} from "@/actions/admin/bulk-actions";

describe("bulkDisableUsers", () => {
  const mockAdminSession = {
    user: { id: "admin-1", email: "admin@example.com", role: "ADMIN" },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("authentication", () => {
    it("returns error when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const result = await bulkDisableUsers({ userIds: ["user-1"] });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
      }
    });
  });

  describe("authorization", () => {
    it("returns error when user is not admin", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", role: "USER", email: "user@example.com" },
      });

      const result = await bulkDisableUsers({ userIds: ["user-2"] });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Forbidden");
      }
    });
  });

  describe("validation", () => {
    it("returns error for empty userIds", async () => {
      mockAuth.mockResolvedValue(mockAdminSession);

      const result = await bulkDisableUsers({ userIds: [] });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("At least one user is required");
      }
    });

    it("returns error for more than 100 users", async () => {
      mockAuth.mockResolvedValue(mockAdminSession);
      const userIds = Array.from({ length: 101 }, (_, i) => `user-${i}`);

      const result = await bulkDisableUsers({ userIds });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Maximum 100 users per operation");
      }
    });
  });

  describe("security", () => {
    it("filters out current admin from operation", async () => {
      mockAuth.mockResolvedValue(mockAdminSession);
      mockDb.user.findMany.mockResolvedValue([]);

      const result = await bulkDisableUsers({ userIds: ["admin-1", "user-1"] });

      expect(mockDb.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { in: ["user-1"] }, // admin-1 filtered out
          }),
        })
      );
    });

    it("filters out admin users from results", async () => {
      mockAuth.mockResolvedValue(mockAdminSession);
      mockDb.user.findMany.mockResolvedValue([
        { id: "user-1", email: "user1@example.com", role: "USER", disabled: false },
        { id: "admin-2", email: "admin2@example.com", role: "ADMIN", disabled: false },
      ]);
      mockDb.$transaction.mockImplementation(async (fn) => fn(mockDb));

      const result = await bulkDisableUsers({ userIds: ["user-1", "admin-2"] });

      expect(result.success).toBe(true);
      if (result.success) {
        // Only user-1 should be processed, admin-2 should be skipped
        expect(result.data.successCount).toBe(1);
      }
    });
  });

  describe("success cases", () => {
    it("disables multiple users successfully", async () => {
      mockAuth.mockResolvedValue(mockAdminSession);
      mockDb.user.findMany.mockResolvedValue([
        { id: "user-1", email: "user1@example.com", role: "USER", disabled: false },
        { id: "user-2", email: "user2@example.com", role: "USER", disabled: false },
      ]);
      mockDb.$transaction.mockImplementation(async (fn) => fn(mockDb));
      mockDb.user.update.mockResolvedValue({});
      mockCreateAuditLog.mockResolvedValue({});

      const result = await bulkDisableUsers({ userIds: ["user-1", "user-2"] });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.successCount).toBe(2);
        expect(result.data.failureCount).toBe(0);
      }
    });

    it("skips already disabled users", async () => {
      mockAuth.mockResolvedValue(mockAdminSession);
      mockDb.user.findMany.mockResolvedValue([
        { id: "user-1", email: "user1@example.com", role: "USER", disabled: false },
        { id: "user-2", email: "user2@example.com", role: "USER", disabled: true },
      ]);
      mockDb.$transaction.mockImplementation(async (fn) => fn(mockDb));
      mockDb.user.update.mockResolvedValue({});
      mockCreateAuditLog.mockResolvedValue({});

      const result = await bulkDisableUsers({ userIds: ["user-1", "user-2"] });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.successCount).toBe(1);
        // user-2 skipped (already disabled)
      }
    });

    it("creates audit logs for each user", async () => {
      mockAuth.mockResolvedValue(mockAdminSession);
      mockDb.user.findMany.mockResolvedValue([
        { id: "user-1", email: "user1@example.com", role: "USER", disabled: false },
      ]);
      mockDb.$transaction.mockImplementation(async (fn) => fn(mockDb));
      mockDb.user.update.mockResolvedValue({});
      mockCreateAuditLog.mockResolvedValue({});

      await bulkDisableUsers({ userIds: ["user-1"] });

      expect(mockCreateAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: "User",
          entityId: "user-1",
          action: "UPDATE",
        })
      );
    });
  });

  describe("error handling", () => {
    it("handles database errors gracefully", async () => {
      mockAuth.mockResolvedValue(mockAdminSession);
      mockDb.user.findMany.mockRejectedValue(new Error("DB Error"));

      const result = await bulkDisableUsers({ userIds: ["user-1"] });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Failed to disable users");
      }
    });
  });
});

describe("bulkEnableUsers", () => {
  const mockAdminSession = {
    user: { id: "admin-1", email: "admin@example.com", role: "ADMIN" },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("enables multiple disabled users", async () => {
    mockAuth.mockResolvedValue(mockAdminSession);
    mockDb.user.findMany.mockResolvedValue([
      { id: "user-1", email: "user1@example.com", role: "USER", disabled: true },
      { id: "user-2", email: "user2@example.com", role: "USER", disabled: true },
    ]);
    mockDb.$transaction.mockImplementation(async (fn) => fn(mockDb));
    mockDb.user.update.mockResolvedValue({});
    mockCreateAuditLog.mockResolvedValue({});

    const result = await bulkEnableUsers({ userIds: ["user-1", "user-2"] });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.successCount).toBe(2);
    }
  });

  it("skips already enabled users", async () => {
    mockAuth.mockResolvedValue(mockAdminSession);
    mockDb.user.findMany.mockResolvedValue([
      { id: "user-1", email: "user1@example.com", role: "USER", disabled: true },
      { id: "user-2", email: "user2@example.com", role: "USER", disabled: false },
    ]);
    mockDb.$transaction.mockImplementation(async (fn) => fn(mockDb));
    mockDb.user.update.mockResolvedValue({});
    mockCreateAuditLog.mockResolvedValue({});

    const result = await bulkEnableUsers({ userIds: ["user-1", "user-2"] });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.successCount).toBe(1);
    }
  });
});

describe("bulkChangeUserRole", () => {
  const mockAdminSession = {
    user: { id: "admin-1", email: "admin@example.com", role: "ADMIN" },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validation", () => {
    it("returns error for invalid role", async () => {
      mockAuth.mockResolvedValue(mockAdminSession);

      const result = await bulkChangeUserRole({
        userIds: ["user-1"],
        role: "INVALID" as "USER",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("success cases", () => {
    it("changes role for multiple users", async () => {
      mockAuth.mockResolvedValue(mockAdminSession);
      mockDb.user.findMany.mockResolvedValue([
        { id: "user-1", email: "user1@example.com", role: "USER", disabled: false },
        { id: "user-2", email: "user2@example.com", role: "USER", disabled: false },
      ]);
      mockDb.$transaction.mockImplementation(async (fn) => fn(mockDb));
      mockDb.user.update.mockResolvedValue({});
      mockCreateAuditLog.mockResolvedValue({});

      const result = await bulkChangeUserRole({
        userIds: ["user-1", "user-2"],
        role: "ADMIN",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.successCount).toBe(2);
      }
    });

    it("skips users already with target role", async () => {
      mockAuth.mockResolvedValue(mockAdminSession);
      mockDb.user.findMany.mockResolvedValue([
        { id: "user-1", email: "user1@example.com", role: "USER", disabled: false },
        { id: "user-2", email: "user2@example.com", role: "ADMIN", disabled: false },
      ]);
      mockDb.$transaction.mockImplementation(async (fn) => fn(mockDb));
      mockDb.user.update.mockResolvedValue({});
      mockCreateAuditLog.mockResolvedValue({});

      const result = await bulkChangeUserRole({
        userIds: ["user-1", "user-2"],
        role: "ADMIN",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.successCount).toBe(1);
      }
    });
  });
});

describe("bulkSendEmail", () => {
  const mockAdminSession = {
    user: { id: "admin-1", email: "admin@example.com", role: "ADMIN" },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validation", () => {
    it("returns error for missing subject", async () => {
      mockAuth.mockResolvedValue(mockAdminSession);

      const result = await bulkSendEmail({
        userIds: ["user-1"],
        subject: "",
        body: "Hello",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Subject is required");
      }
    });

    it("returns error for missing body", async () => {
      mockAuth.mockResolvedValue(mockAdminSession);

      const result = await bulkSendEmail({
        userIds: ["user-1"],
        subject: "Test",
        body: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Message body is required");
      }
    });
  });

  describe("success cases", () => {
    it("sends email to multiple users", async () => {
      mockAuth.mockResolvedValue(mockAdminSession);
      mockDb.user.findMany.mockResolvedValue([
        { id: "user-1", email: "user1@example.com", name: "User 1", role: "USER", disabled: false },
        { id: "user-2", email: "user2@example.com", name: "User 2", role: "USER", disabled: false },
      ]);
      mockSendAdminMessage.mockResolvedValue({ success: true });
      mockCreateAuditLog.mockResolvedValue({});

      const result = await bulkSendEmail({
        userIds: ["user-1", "user-2"],
        subject: "Important Update",
        body: "Hello, this is an update.",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.successCount).toBe(2);
        expect(mockSendAdminMessage).toHaveBeenCalledTimes(2);
      }
    });

    it("skips disabled users", async () => {
      mockAuth.mockResolvedValue(mockAdminSession);
      // The DB query filters disabled users, so only return enabled users
      mockDb.user.findMany.mockResolvedValue([
        { id: "user-1", email: "user1@example.com", name: "User 1", role: "USER", disabled: false },
      ]);
      mockSendAdminMessage.mockResolvedValue({ success: true });
      mockCreateAuditLog.mockResolvedValue({});

      const result = await bulkSendEmail({
        userIds: ["user-1", "user-2"], // user-2 is disabled and filtered by DB
        subject: "Test",
        body: "Hello",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.successCount).toBe(1);
        expect(mockSendAdminMessage).toHaveBeenCalledTimes(1);
      }
    });

    it("handles partial email failures", async () => {
      mockAuth.mockResolvedValue(mockAdminSession);
      mockDb.user.findMany.mockResolvedValue([
        { id: "user-1", email: "user1@example.com", name: "User 1", role: "USER", disabled: false },
        { id: "user-2", email: "user2@example.com", name: "User 2", role: "USER", disabled: false },
      ]);
      mockSendAdminMessage
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce({ success: false, error: "Email failed" });
      mockCreateAuditLog.mockResolvedValue({});

      const result = await bulkSendEmail({
        userIds: ["user-1", "user-2"],
        subject: "Test",
        body: "Hello",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.successCount).toBe(1);
        expect(result.data.failureCount).toBe(1);
        expect(result.data.errors).toHaveLength(1);
      }
    });
  });
});
