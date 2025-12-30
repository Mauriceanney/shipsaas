import { describe, expect, it, vi, beforeEach } from "vitest";

const { mockAuth, mockFindMany } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockFindMany: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/db", () => ({
  db: {
    userSession: {
      findMany: mockFindMany,
    },
  },
}));

import { getActiveSessions } from "@/actions/session/get-active-sessions";

describe("getActiveSessions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("authentication", () => {
    it("returns error when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const result = await getActiveSessions();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
      }
    });

    it("returns error when session has no user", async () => {
      mockAuth.mockResolvedValue({ user: null });

      const result = await getActiveSessions();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
      }
    });

    it("returns error when session has no user id", async () => {
      mockAuth.mockResolvedValue({ user: { id: null } });

      const result = await getActiveSessions();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
      }
    });
  });

  describe("success cases", () => {
    it("returns empty array when user has no sessions", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockFindMany.mockResolvedValue([]);

      const result = await getActiveSessions();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it("returns active sessions for authenticated user", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });

      const sessions = [
        {
          id: "session-1",
          userId: "user-1",
          sessionToken: "token-1",
          ipAddress: "192.168.1.1",
          userAgent: "Mozilla/5.0",
          deviceName: "Chrome on macOS",
          lastActiveAt: new Date("2024-01-15T10:00:00Z"),
          expiresAt: new Date("2024-01-16T10:00:00Z"),
          revokedAt: null,
          createdAt: new Date("2024-01-15T08:00:00Z"),
        },
        {
          id: "session-2",
          userId: "user-1",
          sessionToken: "token-2",
          ipAddress: "10.0.0.1",
          userAgent: "Safari/17.0",
          deviceName: "Safari on iPhone",
          lastActiveAt: new Date("2024-01-14T15:00:00Z"),
          expiresAt: new Date("2024-01-15T15:00:00Z"),
          revokedAt: null,
          createdAt: new Date("2024-01-14T12:00:00Z"),
        },
      ];

      mockFindMany.mockResolvedValue(sessions);

      const result = await getActiveSessions();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0]).toMatchObject({
          id: "session-1",
          deviceName: "Chrome on macOS",
        });
      }
    });

    it("queries only active (non-revoked) sessions", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockFindMany.mockResolvedValue([]);

      await getActiveSessions();

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: "user-1",
            revokedAt: null,
            expiresAt: { gt: expect.any(Date) },
          },
        })
      );
    });

    it("orders sessions by lastActiveAt descending", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockFindMany.mockResolvedValue([]);

      await getActiveSessions();

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { lastActiveAt: "desc" },
        })
      );
    });
  });

  describe("error handling", () => {
    it("handles database errors gracefully", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockFindMany.mockRejectedValue(new Error("Database connection failed"));

      const result = await getActiveSessions();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Failed to fetch sessions");
      }
    });
  });
});
