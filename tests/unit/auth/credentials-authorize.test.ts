/**
 * TDD: Credentials Provider Authorization Tests
 *
 * Tests for the credentials provider authorize function that:
 * - Validates login credentials
 * - Checks email verification status
 * - Checks disabled account status
 * - Returns user data on success
 */

import bcrypt from "bcryptjs";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted for mock functions that need to be hoisted
const { mockFindUnique } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
}));

// Mock the database
vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: mockFindUnique,
    },
  },
}));

import { authConfig } from "@/lib/auth/config";

// Get the credentials provider
const getCredentialsProvider = () => {
  const provider = authConfig.providers?.find((p) => {
    const prov = typeof p === "function" ? p : p;
    return prov.name === "Credentials" || (prov as { id?: string }).id === "credentials";
  });
  return provider as {
    options?: {
      authorize?: (credentials: Record<string, unknown>) => Promise<unknown>;
    };
  };
};

describe("Credentials Provider Authorization", () => {
  const validPassword = "SecurePass123!";
  let hashedPassword: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    hashedPassword = await bcrypt.hash(validPassword, 10);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("authorize function", () => {
    it("should return null for invalid credentials format", async () => {
      const provider = getCredentialsProvider();
      const authorize = provider?.options?.authorize;

      if (!authorize) {
        throw new Error("Authorize function not found");
      }

      const result = await authorize({
        email: "invalid-email",
        password: "short",
      });

      expect(result).toBeNull();
    });

    it("should return null when user does not exist", async () => {
      mockFindUnique.mockResolvedValue(null);

      const provider = getCredentialsProvider();
      const authorize = provider?.options?.authorize;

      if (!authorize) {
        throw new Error("Authorize function not found");
      }

      const result = await authorize({
        email: "nonexistent@example.com",
        password: validPassword,
      });

      expect(result).toBeNull();
    });

    it("should return null when user has no password (OAuth user)", async () => {
      mockFindUnique.mockResolvedValue({
        id: "user-1",
        email: "oauth@example.com",
        password: null,
        emailVerified: new Date(),
        disabled: false,
        name: "OAuth User",
        role: "USER",
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        stripeCustomerId: null,
      });

      const provider = getCredentialsProvider();
      const authorize = provider?.options?.authorize;

      if (!authorize) {
        throw new Error("Authorize function not found");
      }

      const result = await authorize({
        email: "oauth@example.com",
        password: validPassword,
      });

      expect(result).toBeNull();
    });

    it("should return null when password does not match", async () => {
      mockFindUnique.mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        password: hashedPassword,
        emailVerified: new Date(),
        disabled: false,
        name: "Test User",
        role: "USER",
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        stripeCustomerId: null,
      });

      const provider = getCredentialsProvider();
      const authorize = provider?.options?.authorize;

      if (!authorize) {
        throw new Error("Authorize function not found");
      }

      const result = await authorize({
        email: "test@example.com",
        password: "WrongPassword123!",
      });

      expect(result).toBeNull();
    });

    it("should throw EmailNotVerified error when email is not verified", async () => {
      mockFindUnique.mockResolvedValue({
        id: "user-1",
        email: "unverified@example.com",
        password: hashedPassword,
        emailVerified: null,
        disabled: false,
        name: "Unverified User",
        role: "USER",
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        stripeCustomerId: null,
      });

      const provider = getCredentialsProvider();
      const authorize = provider?.options?.authorize;

      if (!authorize) {
        throw new Error("Authorize function not found");
      }

      await expect(
        authorize({
          email: "unverified@example.com",
          password: validPassword,
        })
      ).rejects.toThrow("EmailNotVerified");
    });

    it("should throw AccountDisabled error when user account is disabled", async () => {
      mockFindUnique.mockResolvedValue({
        id: "user-1",
        email: "disabled@example.com",
        password: hashedPassword,
        emailVerified: new Date(),
        disabled: true,
        name: "Disabled User",
        role: "USER",
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        stripeCustomerId: null,
      });

      const provider = getCredentialsProvider();
      const authorize = provider?.options?.authorize;

      if (!authorize) {
        throw new Error("Authorize function not found");
      }

      await expect(
        authorize({
          email: "disabled@example.com",
          password: validPassword,
        })
      ).rejects.toThrow("AccountDisabled");
    });

    it("should return user data on successful authentication", async () => {
      mockFindUnique.mockResolvedValue({
        id: "user-1",
        email: "valid@example.com",
        password: hashedPassword,
        emailVerified: new Date(),
        disabled: false,
        name: "Valid User",
        role: "USER",
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        stripeCustomerId: null,
      });

      const provider = getCredentialsProvider();
      const authorize = provider?.options?.authorize;

      if (!authorize) {
        throw new Error("Authorize function not found");
      }

      const result = await authorize({
        email: "valid@example.com",
        password: validPassword,
      });

      expect(result).toEqual({
        id: "user-1",
        email: "valid@example.com",
        name: "Valid User",
        role: "USER",
      });
    });

    it("should return admin user data when role is ADMIN", async () => {
      mockFindUnique.mockResolvedValue({
        id: "admin-1",
        email: "admin@example.com",
        password: hashedPassword,
        emailVerified: new Date(),
        disabled: false,
        name: "Admin User",
        role: "ADMIN",
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        stripeCustomerId: null,
      });

      const provider = getCredentialsProvider();
      const authorize = provider?.options?.authorize;

      if (!authorize) {
        throw new Error("Authorize function not found");
      }

      const result = await authorize({
        email: "admin@example.com",
        password: validPassword,
      });

      expect(result).toEqual({
        id: "admin-1",
        email: "admin@example.com",
        name: "Admin User",
        role: "ADMIN",
      });
    });
  });
});
