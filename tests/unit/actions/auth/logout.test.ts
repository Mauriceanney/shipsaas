import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies BEFORE imports
const { mockSignOut, mockRevokeUserSession, mockCookies } = vi.hoisted(() => ({
  mockSignOut: vi.fn(),
  mockRevokeUserSession: vi.fn(),
  mockCookies: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  signOut: mockSignOut,
}));

vi.mock("@/lib/auth/session-tracking", () => ({
  revokeUserSession: mockRevokeUserSession,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: mockCookies,
}));

import { logoutAction } from "@/actions/auth/logout";

describe("logoutAction", () => {
  const mockCookieStore = {
    get: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCookies.mockResolvedValue(mockCookieStore);
    mockSignOut.mockResolvedValue(undefined);
    mockRevokeUserSession.mockResolvedValue(undefined);
  });

  describe("session token handling", () => {
    it("revokes session when token exists", async () => {
      const sessionToken = "session-token-123";
      mockCookieStore.get.mockReturnValue({ value: sessionToken });

      await logoutAction();

      expect(mockCookieStore.get).toHaveBeenCalledWith("user-session-token");
      expect(mockRevokeUserSession).toHaveBeenCalledWith(sessionToken);
      expect(mockCookieStore.delete).toHaveBeenCalledWith("user-session-token");
    });

    it("deletes cookie when session token exists", async () => {
      const sessionToken = "session-token-456";
      mockCookieStore.get.mockReturnValue({ value: sessionToken });

      await logoutAction();

      expect(mockCookieStore.delete).toHaveBeenCalledWith("user-session-token");
    });

    it("skips revocation when no session token", async () => {
      mockCookieStore.get.mockReturnValue(undefined);

      await logoutAction();

      expect(mockRevokeUserSession).not.toHaveBeenCalled();
      expect(mockCookieStore.delete).not.toHaveBeenCalled();
    });

    it("handles empty session token value", async () => {
      mockCookieStore.get.mockReturnValue({ value: "" });

      await logoutAction();

      expect(mockRevokeUserSession).not.toHaveBeenCalled();
    });
  });

  describe("signOut behavior", () => {
    it("calls signOut with redirect to login", async () => {
      mockCookieStore.get.mockReturnValue(undefined);

      await logoutAction();

      expect(mockSignOut).toHaveBeenCalledWith({ redirectTo: "/login" });
    });

    it("calls signOut even when no session token", async () => {
      mockCookieStore.get.mockReturnValue(undefined);

      await logoutAction();

      expect(mockSignOut).toHaveBeenCalled();
    });

    it("calls signOut after revoking session", async () => {
      const sessionToken = "token-123";
      mockCookieStore.get.mockReturnValue({ value: sessionToken });

      await logoutAction();

      // Verify order: revoke first, then signOut
      expect(mockRevokeUserSession).toHaveBeenCalled();
      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("continues logout even if session revocation fails", async () => {
      const sessionToken = "token-123";
      mockCookieStore.get.mockReturnValue({ value: sessionToken });
      mockRevokeUserSession.mockRejectedValue(new Error("Database error"));

      // Should not throw - signOut should still be called
      await expect(logoutAction()).rejects.toThrow("Database error");
    });

    it("handles signOut errors", async () => {
      mockCookieStore.get.mockReturnValue(undefined);
      mockSignOut.mockRejectedValue(new Error("Auth error"));

      await expect(logoutAction()).rejects.toThrow("Auth error");
    });

    it("handles cookie store errors", async () => {
      mockCookies.mockRejectedValue(new Error("Cookie error"));

      await expect(logoutAction()).rejects.toThrow("Cookie error");
    });
  });

  describe("edge cases", () => {
    it("handles multiple logout calls", async () => {
      mockCookieStore.get.mockReturnValue({ value: "token-1" });

      await logoutAction();
      await logoutAction();

      expect(mockSignOut).toHaveBeenCalledTimes(2);
    });

    it("handles null cookie value", async () => {
      mockCookieStore.get.mockReturnValue({ value: null });

      await logoutAction();

      expect(mockRevokeUserSession).not.toHaveBeenCalled();
    });

    it("handles undefined cookie object", async () => {
      mockCookieStore.get.mockReturnValue(null);

      await logoutAction();

      expect(mockRevokeUserSession).not.toHaveBeenCalled();
    });
  });
});
