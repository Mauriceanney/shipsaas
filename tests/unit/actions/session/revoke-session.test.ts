import { describe, expect, it, vi, beforeEach } from "vitest";

const { mockAuth, mockFindFirst, mockUpdate, mockRevalidatePath } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockFindFirst: vi.fn(),
  mockUpdate: vi.fn(),
  mockRevalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/db", () => ({
  db: {
    userSession: {
      findFirst: mockFindFirst,
      update: mockUpdate,
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

import { revokeSession } from "@/actions/session/revoke-session";

describe("revokeSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("authentication", () => {
    it("returns error when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const result = await revokeSession({ sessionId: "session-1" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
      }
    });

    it("returns error when session has no user id", async () => {
      mockAuth.mockResolvedValue({ user: { id: null } });

      const result = await revokeSession({ sessionId: "session-1" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
      }
    });
  });

  describe("validation", () => {
    it("returns error for empty session id", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });

      const result = await revokeSession({ sessionId: "" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Session ID is required");
      }
    });

    it("returns error for missing session id", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });

      const result = await revokeSession({} as { sessionId: string });

      expect(result.success).toBe(false);
    });
  });

  describe("authorization", () => {
    it("returns error when session does not exist", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockFindFirst.mockResolvedValue(null);

      const result = await revokeSession({ sessionId: "session-1" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Session not found");
      }
    });

    it("returns error when session belongs to different user", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockFindFirst.mockResolvedValue(null); // userId filter excludes it

      const result = await revokeSession({ sessionId: "session-2" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Session not found");
      }
      expect(mockFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: "session-2",
            userId: "user-1",
          },
        })
      );
    });

    it("returns error when session is already revoked", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockFindFirst.mockResolvedValue({
        id: "session-1",
        userId: "user-1",
        revokedAt: new Date(),
      });

      const result = await revokeSession({ sessionId: "session-1" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Session already revoked");
      }
    });
  });

  describe("success cases", () => {
    it("revokes a valid session", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockFindFirst.mockResolvedValue({
        id: "session-1",
        userId: "user-1",
        revokedAt: null,
      });
      mockUpdate.mockResolvedValue({
        id: "session-1",
        revokedAt: new Date(),
      });

      const result = await revokeSession({ sessionId: "session-1" });

      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "session-1" },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it("revalidates the sessions page after revocation", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockFindFirst.mockResolvedValue({
        id: "session-1",
        userId: "user-1",
        revokedAt: null,
      });
      mockUpdate.mockResolvedValue({ id: "session-1" });

      await revokeSession({ sessionId: "session-1" });

      expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard/settings/security");
    });
  });

  describe("error handling", () => {
    it("handles database errors gracefully", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockFindFirst.mockRejectedValue(new Error("Database error"));

      const result = await revokeSession({ sessionId: "session-1" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Failed to revoke session");
      }
    });

    it("handles update errors gracefully", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockFindFirst.mockResolvedValue({
        id: "session-1",
        userId: "user-1",
        revokedAt: null,
      });
      mockUpdate.mockRejectedValue(new Error("Update failed"));

      const result = await revokeSession({ sessionId: "session-1" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Failed to revoke session");
      }
    });
  });
});
