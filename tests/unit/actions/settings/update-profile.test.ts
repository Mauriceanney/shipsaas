/**
 * Unit tests for updateProfile action
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoist mocks for vitest
const { mockAuth, mockDbUserUpdate, mockDbUserFindUnique, mockRevalidatePath } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockDbUserUpdate: vi.fn(),
  mockDbUserFindUnique: vi.fn(),
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
      findUnique: mockDbUserFindUnique,
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

    it("returns error for invalid email format", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });

      const result = await updateProfile({ name: "John", email: "invalid-email" });

      expect(result.success).toBe(false);
      expect(result.error).toContain("valid email");
    });
  });

  describe("name update", () => {
    it("updates user name in database", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDbUserUpdate.mockResolvedValue({ id: "user-1", name: "John Doe", email: "john@example.com" });

      await updateProfile({ name: "John Doe" });

      expect(mockDbUserUpdate).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { name: "John Doe" },
        select: { id: true, name: true, email: true },
      });
    });

    it("revalidates the profile and dashboard pages", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDbUserUpdate.mockResolvedValue({ id: "user-1", name: "John Doe", email: "john@example.com" });

      await updateProfile({ name: "John Doe" });

      expect(mockRevalidatePath).toHaveBeenCalledWith("/settings/profile");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
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

  describe("email update for credential users", () => {
    it("allows email update for credential users", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDbUserFindUnique
        .mockResolvedValueOnce({ password: "hashed-password", email: "old@example.com" })
        .mockResolvedValueOnce(null); // No existing user with new email
      mockDbUserUpdate.mockResolvedValue({ id: "user-1", name: "John", email: "new@example.com" });

      const result = await updateProfile({ name: "John", email: "new@example.com" });

      expect(result.success).toBe(true);
      expect(mockDbUserUpdate).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { name: "John", email: "new@example.com" },
        select: { id: true, name: true, email: true },
      });
    });

    it("rejects email update for OAuth users", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDbUserFindUnique.mockResolvedValue({ password: null, email: "old@example.com" }); // OAuth user

      const result = await updateProfile({ name: "John", email: "new@example.com" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Email can only be changed for credential accounts");
    });

    it("rejects email update if email is already in use", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDbUserFindUnique
        .mockResolvedValueOnce({ password: "hashed-password", email: "old@example.com" })
        .mockResolvedValueOnce({ id: "user-2" }); // Another user with that email

      const result = await updateProfile({ name: "John", email: "taken@example.com" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Email is already in use");
    });

    it("skips email check if email unchanged", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDbUserFindUnique.mockResolvedValue({ password: "hashed-password", email: "same@example.com" });
      mockDbUserUpdate.mockResolvedValue({ id: "user-1", name: "John", email: "same@example.com" });

      const result = await updateProfile({ name: "John", email: "same@example.com" });

      expect(result.success).toBe(true);
      // Should only update name, not email
      expect(mockDbUserUpdate).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { name: "John" },
        select: { id: true, name: true, email: true },
      });
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
