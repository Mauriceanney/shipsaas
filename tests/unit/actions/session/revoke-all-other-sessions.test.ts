import { describe, expect, it, vi, beforeEach } from "vitest";

const { mockAuth, mockUpdateMany, mockRevalidatePath, mockCookies } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockUpdateMany: vi.fn(),
  mockRevalidatePath: vi.fn(),
  mockCookies: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/db", () => ({
  db: {
    userSession: {
      updateMany: mockUpdateMany,
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

vi.mock("next/headers", () => ({
  cookies: mockCookies,
}));

import { revokeAllOtherSessions } from "@/actions/session/revoke-all-other-sessions";

describe("revokeAllOtherSessions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookies.mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "current-session-token" }),
    });
  });

  describe("authentication", () => {
    it("returns error when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const result = await revokeAllOtherSessions();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
      }
    });

    it("returns error when session has no user id", async () => {
      mockAuth.mockResolvedValue({ user: { id: null } });

      const result = await revokeAllOtherSessions();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
      }
    });
  });

  describe("success cases", () => {
    it("revokes all other sessions for the user", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockUpdateMany.mockResolvedValue({ count: 3 });

      const result = await revokeAllOtherSessions();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.revokedCount).toBe(3);
      }
    });

    it("excludes current session from revocation", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockUpdateMany.mockResolvedValue({ count: 2 });

      await revokeAllOtherSessions();

      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          userId: "user-1",
          revokedAt: null,
          sessionToken: { not: "current-session-token" },
        }),
        data: { revokedAt: expect.any(Date) },
      });
    });

    it("returns zero count when no other sessions exist", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockUpdateMany.mockResolvedValue({ count: 0 });

      const result = await revokeAllOtherSessions();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.revokedCount).toBe(0);
      }
    });

    it("revalidates the sessions page after revocation", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockUpdateMany.mockResolvedValue({ count: 1 });

      await revokeAllOtherSessions();

      expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard/settings/security");
    });
  });

  describe("edge cases", () => {
    it("handles missing session token cookie gracefully", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockCookies.mockResolvedValue({
        get: vi.fn().mockReturnValue(undefined),
      });
      mockUpdateMany.mockResolvedValue({ count: 5 });

      const result = await revokeAllOtherSessions();

      // When no current session token, revokes all sessions (no exclusion)
      expect(result.success).toBe(true);
      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: {
          userId: "user-1",
          revokedAt: null,
          // No sessionToken filter when cookie is missing
        },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  describe("error handling", () => {
    it("handles database errors gracefully", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockUpdateMany.mockRejectedValue(new Error("Database error"));

      const result = await revokeAllOtherSessions();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Failed to revoke sessions");
      }
    });
  });
});
