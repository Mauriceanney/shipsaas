import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies BEFORE imports
const { mockSignOut, mockCookies } = vi.hoisted(() => ({
  mockSignOut: vi.fn(),
  mockCookies: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  signOut: mockSignOut,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: mockCookies,
}));

import { forceLogoutAction } from "@/actions/auth/force-logout";

describe("forceLogoutAction", () => {
  let mockCookieStore: { delete: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCookieStore = {
      delete: vi.fn(),
    };
    mockCookies.mockResolvedValue(mockCookieStore);
    mockSignOut.mockResolvedValue(undefined);
  });

  describe("cookie deletion", () => {
    it("deletes user-session-token cookie", async () => {
      await forceLogoutAction();

      expect(mockCookieStore.delete).toHaveBeenCalledWith("user-session-token");
    });

    it("always deletes cookie regardless of its existence", async () => {
      await forceLogoutAction();

      // Should call delete even if cookie doesn't exist
      expect(mockCookieStore.delete).toHaveBeenCalledTimes(1);
    });
  });

  describe("signOut behavior", () => {
    it("calls signOut with SessionRevoked error", async () => {
      await forceLogoutAction();

      expect(mockSignOut).toHaveBeenCalledWith({
        redirectTo: "/login?error=SessionRevoked",
      });
    });

    it("redirects to login page with error parameter", async () => {
      await forceLogoutAction();

      const redirectTo = mockSignOut.mock.calls[0]?.[0]?.redirectTo;
      expect(redirectTo).toContain("/login");
      expect(redirectTo).toContain("error=SessionRevoked");
    });

    it("calls signOut after deleting cookie", async () => {
      await forceLogoutAction();

      expect(mockCookieStore.delete).toHaveBeenCalled();
      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("handles cookie deletion errors", async () => {
      mockCookies.mockRejectedValue(new Error("Cookie error"));

      await expect(forceLogoutAction()).rejects.toThrow("Cookie error");
    });

    it("handles signOut errors", async () => {
      mockSignOut.mockRejectedValue(new Error("Auth error"));

      await expect(forceLogoutAction()).rejects.toThrow("Auth error");
    });

    it("handles cookie delete throwing error", async () => {
      mockCookieStore.delete.mockImplementation(() => {
        throw new Error("Delete failed");
      });

      await expect(forceLogoutAction()).rejects.toThrow("Delete failed");
    });
  });

  describe("difference from regular logout", () => {
    it("does not attempt to revoke session in database", async () => {
      // Force logout only deletes cookie, doesn't call revokeUserSession
      await forceLogoutAction();

      // Only verifies cookie delete and signOut are called
      expect(mockCookieStore.delete).toHaveBeenCalled();
      expect(mockSignOut).toHaveBeenCalled();
    });

    it("includes error parameter in redirect URL", async () => {
      await forceLogoutAction();

      const call = mockSignOut.mock.calls[0]?.[0];
      expect(call?.redirectTo).toBe("/login?error=SessionRevoked");
    });
  });

  describe("edge cases", () => {
    it("handles multiple force logout calls", async () => {
      await forceLogoutAction();
      await forceLogoutAction();

      expect(mockCookieStore.delete).toHaveBeenCalledTimes(2);
      expect(mockSignOut).toHaveBeenCalledTimes(2);
    });

    it("works when cookie store is empty", async () => {
      await forceLogoutAction();

      // Should not throw even if no cookies exist
      expect(mockSignOut).toHaveBeenCalled();
    });
  });
});
