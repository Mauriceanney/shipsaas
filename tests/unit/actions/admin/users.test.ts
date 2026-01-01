/**
 * Admin getUsers Tests
 * TDD: Tests for cursor-based pagination
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoist mocks
const { mockAuth, mockDb, mockRedirect } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockDb: {
    user: {
      findMany: vi.fn(),
    },
  },
  mockRedirect: vi.fn(),
}));

// Mock dependencies
vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { getUsers } from "@/actions/admin/users";
import { encodeCursor } from "@/lib/db/cursor-pagination";

describe("getUsers", () => {
  const mockAdminSession = {
    user: { id: "admin-1", email: "admin@test.com", role: "ADMIN" },
    expires: "",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: admin authentication succeeds
    mockAuth.mockResolvedValue(mockAdminSession);
  });

  describe("authentication", () => {
    it("redirects to login when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);
      mockRedirect.mockImplementation(() => {
        throw new Error("NEXT_REDIRECT");
      });

      await expect(getUsers({})).rejects.toThrow("NEXT_REDIRECT");
      expect(mockRedirect).toHaveBeenCalledWith("/login");
    });

    it("redirects to dashboard when not admin", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", role: "USER" },
      });
      mockRedirect.mockImplementation(() => {
        throw new Error("NEXT_REDIRECT");
      });

      await expect(getUsers({})).rejects.toThrow("NEXT_REDIRECT");
      expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
    });
  });

  describe("cursor pagination", () => {
    const mockUsers = [
      {
        id: "user-1",
        name: "Alice",
        email: "alice@test.com",
        role: "USER",
        disabled: false,
        createdAt: new Date("2024-01-03"),
        subscription: { plan: "FREE", status: "ACTIVE" },
      },
      {
        id: "user-2",
        name: "Bob",
        email: "bob@test.com",
        role: "USER",
        disabled: false,
        createdAt: new Date("2024-01-02"),
        subscription: null,
      },
      {
        id: "user-3",
        name: "Charlie",
        email: "charlie@test.com",
        role: "ADMIN",
        disabled: true,
        createdAt: new Date("2024-01-01"),
        subscription: { plan: "PRO", status: "ACTIVE" },
      },
    ];

    it("returns first page without cursor", async () => {
      mockDb.user.findMany.mockResolvedValue(mockUsers.slice(0, 2));

      const result = await getUsers({ limit: 2 });

      expect(result.users).toHaveLength(2);
      expect(result.pagination.hasNextPage).toBe(false);
      expect(result.pagination.hasPreviousPage).toBe(false);
      expect(mockDb.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 3, // limit + 1
          cursor: undefined,
          skip: 0,
        })
      );
    });

    it("detects more pages when items exceed limit", async () => {
      // Return limit + 1 items to indicate more pages
      mockDb.user.findMany.mockResolvedValue([...mockUsers]);

      const result = await getUsers({ limit: 2 });

      expect(result.users).toHaveLength(2); // Extra item removed
      expect(result.pagination.hasNextPage).toBe(true);
      expect(result.pagination.nextCursor).toBe(encodeCursor("user-2"));
    });

    it("paginates forward with cursor", async () => {
      const cursor = encodeCursor("user-1");
      mockDb.user.findMany.mockResolvedValue(mockUsers.slice(1, 3));

      const result = await getUsers({ cursor, limit: 2 });

      expect(result.pagination.hasPreviousPage).toBe(true);
      expect(mockDb.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          cursor: { id: "user-1" },
          skip: 1, // Skip the cursor itself
        })
      );
    });

    it("handles empty results", async () => {
      mockDb.user.findMany.mockResolvedValue([]);

      const result = await getUsers({});

      expect(result.users).toHaveLength(0);
      expect(result.pagination.hasNextPage).toBe(false);
      expect(result.pagination.nextCursor).toBeNull();
    });

    it("handles single item result", async () => {
      mockDb.user.findMany.mockResolvedValue([mockUsers[0]]);

      const result = await getUsers({ limit: 10 });

      expect(result.users).toHaveLength(1);
      expect(result.pagination.hasNextPage).toBe(false);
    });

    it("handles invalid cursor gracefully", async () => {
      mockDb.user.findMany.mockResolvedValue(mockUsers);

      // Empty cursor should be treated as first page
      const result = await getUsers({ cursor: "", limit: 2 });

      expect(mockDb.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          cursor: undefined,
          skip: 0,
        })
      );
    });

    it("enforces maximum limit", async () => {
      mockDb.user.findMany.mockResolvedValue([]);

      await getUsers({ limit: 500 });

      expect(mockDb.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 101, // MAX_LIMIT (100) + 1
        })
      );
    });
  });

  describe("filters with cursor", () => {
    it("applies search filter with cursor pagination", async () => {
      mockDb.user.findMany.mockResolvedValue([]);

      await getUsers({ search: "alice", limit: 10 });

      expect(mockDb.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: "alice", mode: "insensitive" } },
              { email: { contains: "alice", mode: "insensitive" } },
            ],
          }),
        })
      );
    });

    it("applies role filter with cursor pagination", async () => {
      mockDb.user.findMany.mockResolvedValue([]);

      await getUsers({ role: "ADMIN", limit: 10 });

      expect(mockDb.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            role: "ADMIN",
          }),
        })
      );
    });

    it("applies active status filter", async () => {
      mockDb.user.findMany.mockResolvedValue([]);

      await getUsers({ status: "active", limit: 10 });

      expect(mockDb.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            disabled: false,
          }),
        })
      );
    });

    it("applies disabled status filter", async () => {
      mockDb.user.findMany.mockResolvedValue([]);

      await getUsers({ status: "disabled", limit: 10 });

      expect(mockDb.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            disabled: true,
          }),
        })
      );
    });

    it("combines all filters with cursor", async () => {
      const cursor = encodeCursor("user-1");
      mockDb.user.findMany.mockResolvedValue([]);

      await getUsers({
        cursor,
        search: "test",
        role: "USER",
        status: "active",
        limit: 5,
      });

      expect(mockDb.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          cursor: { id: "user-1" },
          skip: 1,
          take: 6,
          where: expect.objectContaining({
            OR: expect.any(Array),
            role: "USER",
            disabled: false,
          }),
        })
      );
    });
  });

  describe("ordering", () => {
    it("orders by createdAt descending with id tiebreaker", async () => {
      mockDb.user.findMany.mockResolvedValue([]);

      await getUsers({});

      expect(mockDb.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        })
      );
    });
  });
});
