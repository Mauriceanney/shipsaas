import { describe, expect, it, vi, beforeEach } from "vitest";

const { mockAuth, mockFindFirst, mockCookies } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockFindFirst: vi.fn(),
  mockCookies: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/db", () => ({
  db: {
    userSession: {
      findFirst: mockFindFirst,
    },
  },
}));

vi.mock("next/headers", () => ({
  cookies: mockCookies,
}));

import { GET } from "@/app/api/session/validate/route";

describe("GET /api/session/validate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookies.mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "test-session-token" }),
    });
  });

  describe("authentication", () => {
    it("returns valid:false when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.valid).toBe(false);
    });

    it("returns valid:false when session has no user", async () => {
      mockAuth.mockResolvedValue({ user: null });

      const response = await GET();
      const data = await response.json();

      expect(data.valid).toBe(false);
    });
  });

  describe("session validation", () => {
    it("returns valid:true when no session token cookie exists (legacy session)", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockCookies.mockResolvedValue({
        get: vi.fn().mockReturnValue(undefined),
      });

      const response = await GET();
      const data = await response.json();

      // Legacy sessions (no cookie) should be treated as valid
      expect(data.valid).toBe(true);
    });

    it("returns valid:false when session token exists but is revoked", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockFindFirst.mockResolvedValue(null); // No valid session found

      const response = await GET();
      const data = await response.json();

      expect(data.valid).toBe(false);
    });

    it("returns valid:true when session is active", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockFindFirst.mockResolvedValue({
        id: "session-1",
        sessionToken: "test-session-token",
        revokedAt: null,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
      });

      const response = await GET();
      const data = await response.json();

      expect(data.valid).toBe(true);
    });

    it("queries for non-revoked, non-expired session", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockFindFirst.mockResolvedValue({
        id: "session-1",
        sessionToken: "test-session-token",
      });

      await GET();

      expect(mockFindFirst).toHaveBeenCalledWith({
        where: {
          sessionToken: "test-session-token",
          userId: "user-1",
          revokedAt: null,
          expiresAt: { gt: expect.any(Date) },
        },
        select: { id: true },
      });
    });
  });

  describe("error handling", () => {
    it("returns valid:true on database error (fail safe)", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockFindFirst.mockRejectedValue(new Error("Database error"));

      const response = await GET();
      const data = await response.json();

      // On error, fail safe - don't invalidate session
      expect(data.valid).toBe(true);
    });
  });
});
