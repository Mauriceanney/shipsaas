/**
 * Unit tests for updateProfile action
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoist mocks for vitest
const { mockAuth, mockDbUserUpdate, mockRevalidatePath } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockDbUserUpdate: vi.fn(),
  mockRevalidatePath: vi.fn(),
}));

// Mock dependencies
vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      update: mockDbUserUpdate,
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

import { updateProfile } from "@/actions/settings/update-profile";

describe("updateProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("authentication", () => {
    it("returns error when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const result = await updateProfile({ name: "John Doe" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });

    it("returns error when session has no user", async () => {
      mockAuth.mockResolvedValue({ user: null });

      const result = await updateProfile({ name: "John Doe" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });

    it("returns error when user has no id", async () => {
      mockAuth.mockResolvedValue({ user: { id: null } });

      const result = await updateProfile({ name: "John Doe" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });
  });

  describe("validation", () => {
    it("returns error for empty name", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });

      const result = await updateProfile({ name: "" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Name is required");
    });

    it("returns error for name exceeding max length", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });

      const result = await updateProfile({ name: "a".repeat(101) });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Name is too long");
    });

    it("returns error for name with invalid characters", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });

      const result = await updateProfile({ name: "John123" });

      expect(result.success).toBe(false);
      expect(result.error).toContain("can only contain letters");
    });

    it("allows valid names with spaces", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDbUserUpdate.mockResolvedValue({ id: "user-1", name: "John Doe" });

      const result = await updateProfile({ name: "John Doe" });

      expect(result.success).toBe(true);
    });

    it("allows valid names with hyphens", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDbUserUpdate.mockResolvedValue({ id: "user-1", name: "Mary-Jane" });

      const result = await updateProfile({ name: "Mary-Jane" });

      expect(result.success).toBe(true);
    });

    it("allows valid names with apostrophes", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDbUserUpdate.mockResolvedValue({ id: "user-1", name: "O'Brien" });

      const result = await updateProfile({ name: "O'Brien" });

      expect(result.success).toBe(true);
    });
  });

  describe("success cases", () => {
    it("updates user name in database", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDbUserUpdate.mockResolvedValue({ id: "user-1", name: "John Doe" });

      await updateProfile({ name: "John Doe" });

      expect(mockDbUserUpdate).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { name: "John Doe" },
      });
    });

    it("revalidates the profile page path", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDbUserUpdate.mockResolvedValue({ id: "user-1", name: "John Doe" });

      await updateProfile({ name: "John Doe" });

      expect(mockRevalidatePath).toHaveBeenCalledWith("/settings/profile");
    });

    it("returns success true with updated data", async () => {
      const updatedUser = { id: "user-1", name: "John Doe", email: "john@example.com" };
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDbUserUpdate.mockResolvedValue(updatedUser);

      const result = await updateProfile({ name: "John Doe" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(updatedUser);
      }
    });
  });

  describe("error handling", () => {
    it("handles database errors gracefully", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDbUserUpdate.mockRejectedValue(new Error("Database error"));

      const result = await updateProfile({ name: "John Doe" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to update profile");
    });
  });
});
