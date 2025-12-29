/**
 * TDD: Admin Utilities Tests
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

import type { Session } from "next-auth";

// Mock next/navigation - redirect throws to stop execution
const mockRedirect = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});
vi.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
}));

// Mock auth
const mockAuth = vi.fn<() => Promise<Session | null>>();
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

import { requireAdmin, isAdmin, getAdminSession } from "@/lib/admin";

describe("Admin Utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("requireAdmin", () => {
    it("redirects to login if no session", async () => {
      mockAuth.mockResolvedValue(null);

      await expect(requireAdmin()).rejects.toThrow("NEXT_REDIRECT:/login");
      expect(mockRedirect).toHaveBeenCalledWith("/login");
    });

    it("redirects to dashboard if user is not admin", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "1", role: "USER", email: "user@test.com" },
        expires: "2025-01-01",
      } as Session);

      await expect(requireAdmin()).rejects.toThrow("NEXT_REDIRECT:/dashboard");
      expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
    });

    it("returns session if user is admin", async () => {
      const adminSession = {
        user: { id: "1", role: "ADMIN", email: "admin@test.com" },
        expires: "2025-01-01",
      } as Session;
      mockAuth.mockResolvedValue(adminSession);

      const result = await requireAdmin();

      expect(result).toEqual(adminSession);
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe("isAdmin", () => {
    it("returns false if no session", async () => {
      mockAuth.mockResolvedValue(null);

      const result = await isAdmin();

      expect(result).toBe(false);
    });

    it("returns false if user is not admin", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "1", role: "USER", email: "user@test.com" },
        expires: "2025-01-01",
      } as Session);

      const result = await isAdmin();

      expect(result).toBe(false);
    });

    it("returns true if user is admin", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "1", role: "ADMIN", email: "admin@test.com" },
        expires: "2025-01-01",
      } as Session);

      const result = await isAdmin();

      expect(result).toBe(true);
    });
  });

  describe("getAdminSession", () => {
    it("returns null if no session", async () => {
      mockAuth.mockResolvedValue(null);

      const result = await getAdminSession();

      expect(result).toBeNull();
    });

    it("returns null if user is not admin", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "1", role: "USER", email: "user@test.com" },
        expires: "2025-01-01",
      } as Session);

      const result = await getAdminSession();

      expect(result).toBeNull();
    });

    it("returns session if user is admin", async () => {
      const adminSession = {
        user: { id: "1", role: "ADMIN", email: "admin@test.com" },
        expires: "2025-01-01",
      } as Session;
      mockAuth.mockResolvedValue(adminSession);

      const result = await getAdminSession();

      expect(result).toEqual(adminSession);
    });
  });
});
