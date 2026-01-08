/**
 * Admin Impersonation Actions Tests
 * TDD: Tests written before implementation
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoist mocks
const {
  mockAuth,
  mockDb,
  mockSetImpersonationCookie,
  mockClearImpersonationCookie,
  mockGetImpersonationSession,
  mockCalculateExpiresAt,
  mockHeaders,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockDb: {
    user: {
      findUnique: vi.fn(),
    },
    impersonationLog: {
      create: vi.fn(),
      update: vi.fn(),
    },
  },
  mockSetImpersonationCookie: vi.fn(),
  mockClearImpersonationCookie: vi.fn(),
  mockGetImpersonationSession: vi.fn(),
  mockCalculateExpiresAt: vi.fn(),
  mockHeaders: vi.fn(),
}));

// Mock dependencies
vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

vi.mock("@/lib/impersonation", () => ({
  setImpersonationCookie: mockSetImpersonationCookie,
  clearImpersonationCookie: mockClearImpersonationCookie,
  getImpersonationSession: mockGetImpersonationSession,
  calculateExpiresAt: mockCalculateExpiresAt,
}));

vi.mock("next/headers", () => ({
  headers: mockHeaders,
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));


import { startImpersonation, endImpersonation, getImpersonationStatus } from "@/actions/admin/impersonation";

describe("startImpersonation", () => {
  const mockExpiresAt = new Date(Date.now() + 3600000);

  beforeEach(() => {
    vi.clearAllMocks();
    mockCalculateExpiresAt.mockReturnValue(mockExpiresAt);
    mockHeaders.mockResolvedValue({
      get: (key: string) => {
        if (key === "x-forwarded-for") return "192.168.1.1";
        if (key === "user-agent") return "Test Browser";
        return null;
      },
    });
  });

  describe("authentication", () => {
    it("returns error when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const result = await startImpersonation({ targetUserId: "user-123" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
      }
    });

    it("returns error when session has no user", async () => {
      mockAuth.mockResolvedValue({ user: null });

      const result = await startImpersonation({ targetUserId: "user-123" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
      }
    });
  });

  describe("authorization", () => {
    it("returns error when user is not admin", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-1", role: "USER", email: "user@example.com" },
      });

      const result = await startImpersonation({ targetUserId: "user-123" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Forbidden");
      }
    });
  });

  describe("validation", () => {
    it("returns error for empty targetUserId", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN", email: "admin@example.com" },
      });

      const result = await startImpersonation({ targetUserId: "" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Target user ID is required");
      }
    });

    it("returns error for reason exceeding max length", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN", email: "admin@example.com" },
      });

      const result = await startImpersonation({
        targetUserId: "user-123",
        reason: "a".repeat(501),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Reason must be 500 characters or less");
      }
    });
  });

  describe("target user validation", () => {
    it("returns error when target user does not exist", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN", email: "admin@example.com" },
      });
      mockDb.user.findUnique.mockResolvedValue(null);

      const result = await startImpersonation({ targetUserId: "non-existent" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("User not found");
      }
    });

    it("returns error when trying to impersonate an admin", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN", email: "admin@example.com" },
      });
      mockDb.user.findUnique.mockResolvedValue({
        id: "admin-2",
        role: "ADMIN",
        email: "other-admin@example.com",
        name: "Other Admin",
        disabled: false,
      });

      const result = await startImpersonation({ targetUserId: "admin-2" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Cannot impersonate admin users");
      }
    });

    it("returns error when trying to impersonate yourself", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN", email: "admin@example.com" },
      });

      const result = await startImpersonation({ targetUserId: "admin-1" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Cannot impersonate yourself");
      }
    });

    it("returns error when target user is disabled", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN", email: "admin@example.com" },
      });
      mockDb.user.findUnique.mockResolvedValue({
        id: "user-123",
        role: "USER",
        email: "disabled@example.com",
        name: "Disabled User",
        disabled: true,
      });

      const result = await startImpersonation({ targetUserId: "user-123" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Cannot impersonate disabled users");
      }
    });
  });

  describe("success cases", () => {
    it("creates impersonation log and sets cookie", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN", email: "admin@example.com" },
      });
      mockDb.user.findUnique.mockResolvedValue({
        id: "user-123",
        role: "USER",
        email: "user@example.com",
        name: "Test User",
        disabled: false,
      });
      mockDb.impersonationLog.create.mockResolvedValue({
        id: "log-1",
        adminId: "admin-1",
        targetUserId: "user-123",
        reason: "Customer support",
        startedAt: new Date(),
        expiresAt: mockExpiresAt,
        endedAt: null,
        ipAddress: "192.168.1.1",
        userAgent: "Test Browser",
        createdAt: new Date(),
      });
      mockSetImpersonationCookie.mockResolvedValue(undefined);

      const result = await startImpersonation({
        targetUserId: "user-123",
        reason: "Customer support",
      });

      expect(result.success).toBe(true);
      expect(mockDb.impersonationLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          adminId: "admin-1",
          targetUserId: "user-123",
          reason: "Customer support",
          ipAddress: "192.168.1.1",
          userAgent: "Test Browser",
        }),
      });
      expect(mockSetImpersonationCookie).toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("handles database errors gracefully", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN", email: "admin@example.com" },
      });
      mockDb.user.findUnique.mockResolvedValue({
        id: "user-123",
        role: "USER",
        email: "user@example.com",
        name: "Test User",
        disabled: false,
      });
      mockDb.impersonationLog.create.mockRejectedValue(new Error("DB Error"));

      const result = await startImpersonation({ targetUserId: "user-123" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Failed to start impersonation");
      }
    });
  });
});

describe("endImpersonation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validation", () => {
    it("returns error when not impersonating", async () => {
      mockGetImpersonationSession.mockResolvedValue(null);

      const result = await endImpersonation();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Not currently impersonating");
      }
    });
  });

  describe("success cases", () => {
    it("clears cookie and updates log", async () => {
      mockGetImpersonationSession.mockResolvedValue({
        originalAdminId: "admin-1",
        originalAdminEmail: "admin@example.com",
        targetUserId: "user-123",
        impersonationLogId: "log-1",
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      });
      mockDb.impersonationLog.update.mockResolvedValue({
        id: "log-1",
        adminId: "admin-1",
        targetUserId: "user-123",
        endedAt: new Date(),
      });
      mockClearImpersonationCookie.mockResolvedValue(undefined);

      const result = await endImpersonation();

      expect(result.success).toBe(true);
      expect(mockDb.impersonationLog.update).toHaveBeenCalledWith({
        where: { id: "log-1" },
        data: { endedAt: expect.any(Date) },
      });
      expect(mockClearImpersonationCookie).toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("handles database errors gracefully", async () => {
      mockGetImpersonationSession.mockResolvedValue({
        originalAdminId: "admin-1",
        originalAdminEmail: "admin@example.com",
        targetUserId: "user-123",
        impersonationLogId: "log-1",
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      });
      mockDb.impersonationLog.update.mockRejectedValue(new Error("DB Error"));

      const result = await endImpersonation();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Failed to end impersonation");
      }
    });
  });
});

describe("getImpersonationStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns not impersonating when no session exists", async () => {
    mockGetImpersonationSession.mockResolvedValue(null);

    const result = await getImpersonationStatus();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isImpersonating).toBe(false);
      expect(result.data.impersonation).toBeNull();
    }
  });

  it("returns impersonation details when session exists", async () => {
    mockGetImpersonationSession.mockResolvedValue({
      originalAdminId: "admin-1",
      originalAdminEmail: "admin@example.com",
      targetUserId: "user-123",
      impersonationLogId: "log-1",
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    });
    mockDb.user.findUnique.mockResolvedValue({
      id: "user-123",
      email: "user@example.com",
      name: "Test User",
    });

    const result = await getImpersonationStatus();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isImpersonating).toBe(true);
      expect(result.data.impersonation).toMatchObject({
        originalAdminEmail: "admin@example.com",
        targetUserEmail: "user@example.com",
        targetUserName: "Test User",
      });
    }
  });
});
