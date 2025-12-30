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
    loginHistory: {
      findMany: mockFindMany,
    },
  },
}));

import { getLoginHistory } from "@/actions/session/get-login-history";

describe("getLoginHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("authentication", () => {
    it("returns error when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const result = await getLoginHistory();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
      }
    });

    it("returns error when session has no user id", async () => {
      mockAuth.mockResolvedValue({ user: { id: null } });

      const result = await getLoginHistory();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
      }
    });
  });

  describe("success cases", () => {
    it("returns empty array when user has no login history", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockFindMany.mockResolvedValue([]);

      const result = await getLoginHistory();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it("returns login history for authenticated user", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });

      const history = [
        {
          id: "login-1",
          userId: "user-1",
          ipAddress: "192.168.1.1",
          userAgent: "Mozilla/5.0",
          deviceName: "Chrome on macOS",
          success: true,
          failReason: null,
          provider: "credentials",
          createdAt: new Date("2024-01-15T10:00:00Z"),
        },
        {
          id: "login-2",
          userId: "user-1",
          ipAddress: "10.0.0.1",
          userAgent: "Safari/17.0",
          deviceName: "Safari on iPhone",
          success: false,
          failReason: "invalid_credentials",
          provider: "credentials",
          createdAt: new Date("2024-01-14T09:00:00Z"),
        },
      ];

      mockFindMany.mockResolvedValue(history);

      const result = await getLoginHistory();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0]).toMatchObject({
          id: "login-1",
          success: true,
          provider: "credentials",
        });
        expect(result.data[1]).toMatchObject({
          id: "login-2",
          success: false,
          failReason: "invalid_credentials",
        });
      }
    });

    it("queries only user's own login history", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockFindMany.mockResolvedValue([]);

      await getLoginHistory();

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user-1" },
        })
      );
    });

    it("orders by createdAt descending", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockFindMany.mockResolvedValue([]);

      await getLoginHistory();

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: "desc" },
        })
      );
    });

    it("limits to 20 entries", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockFindMany.mockResolvedValue([]);

      await getLoginHistory();

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
        })
      );
    });
  });

  describe("error handling", () => {
    it("handles database errors gracefully", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockFindMany.mockRejectedValue(new Error("Database connection failed"));

      const result = await getLoginHistory();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Failed to fetch login history");
      }
    });
  });
});
