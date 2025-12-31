import { describe, expect, it, vi, beforeEach } from "vitest";

// Use vi.hoisted for mock functions that need to be hoisted
const { 
  mockTokenFindFirst, 
  mockTokenDelete, 
  mockUserFindUnique, 
  mockUserUpdate, 
  mockSendPasswordChangedEmail,
  mockUserSessionUpdateMany,
  mockSessionDeleteMany,
  mockLoginHistoryCreate
} = vi.hoisted(() => ({
  mockTokenFindFirst: vi.fn(),
  mockTokenDelete: vi.fn(),
  mockUserFindUnique: vi.fn(),
  mockUserUpdate: vi.fn(),
  mockSendPasswordChangedEmail: vi.fn(),
  mockUserSessionUpdateMany: vi.fn(),
  mockSessionDeleteMany: vi.fn(),
  mockLoginHistoryCreate: vi.fn(),
}));

// Mock the database module
vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: mockUserFindUnique,
      update: mockUserUpdate,
    },
    verificationToken: {
      findFirst: mockTokenFindFirst,
      delete: mockTokenDelete,
    },
    userSession: {
      updateMany: mockUserSessionUpdateMany,
    },
    session: {
      deleteMany: mockSessionDeleteMany,
    },
    loginHistory: {
      create: mockLoginHistoryCreate,
    },
  },
}));

// Mock bcryptjs
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("new_hashed_password"),
  },
}));

// Mock email functions
vi.mock("@/lib/email", () => ({
  sendPasswordChangedEmail: mockSendPasswordChangedEmail,
}));

import { resetPasswordAction } from "@/actions/auth/reset-password";
import bcrypt from "bcryptjs";

describe("resetPasswordAction", () => {
  const validToken = {
    identifier: "password-reset:user@example.com",
    token: "valid-token",
    expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
  };

  const expiredToken = {
    identifier: "password-reset:user@example.com",
    token: "expired-token",
    expires: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSendPasswordChangedEmail.mockResolvedValue({ success: true });
    mockUserSessionUpdateMany.mockResolvedValue({ count: 0 });
    mockSessionDeleteMany.mockResolvedValue({ count: 0 });
    mockLoginHistoryCreate.mockResolvedValue({});
  });

  describe("input validation", () => {
    it("returns error for empty token", async () => {
      const result = await resetPasswordAction({
        token: "",
        password: "NewSecurePass123!",
        confirmPassword: "NewSecurePass123!",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("required");
      }
      expect(mockTokenFindFirst).not.toHaveBeenCalled();
    });

    it("returns error for password without uppercase", async () => {
      const result = await resetPasswordAction({
        token: "valid-token",
        password: "newsecurepass123!",
        confirmPassword: "newsecurepass123!",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("uppercase");
      }
    });

    it("returns error for password without lowercase", async () => {
      const result = await resetPasswordAction({
        token: "valid-token",
        password: "NEWSECUREPASS123!",
        confirmPassword: "NEWSECUREPASS123!",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("lowercase");
      }
    });

    it("returns error for password without number", async () => {
      const result = await resetPasswordAction({
        token: "valid-token",
        password: "NewSecurePassword!",
        confirmPassword: "NewSecurePassword!",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("number");
      }
    });

    it("returns error for password without special character", async () => {
      const result = await resetPasswordAction({
        token: "valid-token",
        password: "NewSecurePass123",
        confirmPassword: "NewSecurePass123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("special character");
      }
    });

    it("returns error for password too short", async () => {
      const result = await resetPasswordAction({
        token: "valid-token",
        password: "Pass1!",
        confirmPassword: "Pass1!",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("8 characters");
      }
    });

    it("returns error when passwords do not match", async () => {
      const result = await resetPasswordAction({
        token: "valid-token",
        password: "NewSecurePass123!",
        confirmPassword: "DifferentPass123!",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("match");
      }
    });
  });

  describe("success path", () => {
    it("resets password successfully", async () => {
      mockTokenFindFirst.mockResolvedValue(validToken);
      mockUserFindUnique.mockResolvedValue({ id: "user-123", name: "Test User" });
      mockUserUpdate.mockResolvedValue({});
      mockTokenDelete.mockResolvedValue({});

      const result = await resetPasswordAction({
        token: "valid-token",
        password: "NewSecurePass123!",
        confirmPassword: "NewSecurePass123!",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.message).toContain("reset successfully");
      }
    });

    it("hashes new password with bcrypt", async () => {
      mockTokenFindFirst.mockResolvedValue(validToken);
      mockUserFindUnique.mockResolvedValue({ id: "user-123", name: "Test User" });
      mockUserUpdate.mockResolvedValue({});
      mockTokenDelete.mockResolvedValue({});

      await resetPasswordAction({
        token: "valid-token",
        password: "NewSecurePass123!",
        confirmPassword: "NewSecurePass123!",
      });

      expect(bcrypt.hash).toHaveBeenCalledWith("NewSecurePass123!", 12);
    });

    it("updates user password in database", async () => {
      mockTokenFindFirst.mockResolvedValue(validToken);
      mockUserFindUnique.mockResolvedValue({ id: "user-123", name: "Test User" });
      mockUserUpdate.mockResolvedValue({});
      mockTokenDelete.mockResolvedValue({});

      await resetPasswordAction({
        token: "valid-token",
        password: "NewSecurePass123!",
        confirmPassword: "NewSecurePass123!",
      });

      expect(mockUserUpdate).toHaveBeenCalledWith({
        where: { email: "user@example.com" },
        data: { password: "new_hashed_password" },
      });
    });

    it("deletes used token after password reset", async () => {
      mockTokenFindFirst.mockResolvedValue(validToken);
      mockUserFindUnique.mockResolvedValue({ id: "user-123", name: "Test User" });
      mockUserUpdate.mockResolvedValue({});
      mockTokenDelete.mockResolvedValue({});

      await resetPasswordAction({
        token: "valid-token",
        password: "NewSecurePass123!",
        confirmPassword: "NewSecurePass123!",
      });

      expect(mockTokenDelete).toHaveBeenCalledWith({
        where: {
          identifier_token: {
            identifier: validToken.identifier,
            token: validToken.token,
          },
        },
      });
    });

    it("sends password changed email with user name", async () => {
      mockTokenFindFirst.mockResolvedValue(validToken);
      mockUserFindUnique.mockResolvedValue({ id: "user-123", name: "Test User" });
      mockUserUpdate.mockResolvedValue({});
      mockTokenDelete.mockResolvedValue({});

      await resetPasswordAction({
        token: "valid-token",
        password: "NewSecurePass123!",
        confirmPassword: "NewSecurePass123!",
      });

      expect(mockSendPasswordChangedEmail).toHaveBeenCalledWith(
        "user@example.com",
        "Test User"
      );
    });

    it("sends password changed email with undefined name if user has no name", async () => {
      mockTokenFindFirst.mockResolvedValue(validToken);
      mockUserFindUnique.mockResolvedValue({ id: "user-123", name: null });
      mockUserUpdate.mockResolvedValue({});
      mockTokenDelete.mockResolvedValue({});

      await resetPasswordAction({
        token: "valid-token",
        password: "NewSecurePass123!",
        confirmPassword: "NewSecurePass123!",
      });

      expect(mockSendPasswordChangedEmail).toHaveBeenCalledWith(
        "user@example.com",
        undefined
      );
    });
  });

  describe("session invalidation", () => {
    it("invalidates all user sessions after password reset", async () => {
      mockTokenFindFirst.mockResolvedValue(validToken);
      mockUserFindUnique.mockResolvedValue({ id: "user-123", name: "Test User" });
      mockUserUpdate.mockResolvedValue({});
      mockTokenDelete.mockResolvedValue({});
      mockUserSessionUpdateMany.mockResolvedValue({ count: 3 });

      await resetPasswordAction({
        token: "valid-token",
        password: "NewSecurePass123!",
        confirmPassword: "NewSecurePass123!",
      });

      expect(mockUserSessionUpdateMany).toHaveBeenCalledWith({
        where: { 
          userId: "user-123",
          revokedAt: null,
        },
        data: { 
          revokedAt: expect.any(Date),
        },
      });
    });

    it("deletes all auth.js sessions after password reset", async () => {
      mockTokenFindFirst.mockResolvedValue(validToken);
      mockUserFindUnique.mockResolvedValue({ id: "user-123", name: "Test User" });
      mockUserUpdate.mockResolvedValue({});
      mockTokenDelete.mockResolvedValue({});
      mockSessionDeleteMany.mockResolvedValue({ count: 2 });

      await resetPasswordAction({
        token: "valid-token",
        password: "NewSecurePass123!",
        confirmPassword: "NewSecurePass123!",
      });

      expect(mockSessionDeleteMany).toHaveBeenCalledWith({
        where: { userId: "user-123" },
      });
    });

    it("creates login history entry for session termination", async () => {
      mockTokenFindFirst.mockResolvedValue(validToken);
      mockUserFindUnique.mockResolvedValue({ id: "user-123", name: "Test User" });
      mockUserUpdate.mockResolvedValue({});
      mockTokenDelete.mockResolvedValue({});

      await resetPasswordAction({
        token: "valid-token",
        password: "NewSecurePass123!",
        confirmPassword: "NewSecurePass123!",
      });

      expect(mockLoginHistoryCreate).toHaveBeenCalledWith({
        data: {
          userId: "user-123",
          success: true,
          provider: "password-reset",
          deviceName: "All sessions terminated",
        },
      });
    });

    it("succeeds even if no sessions exist to invalidate", async () => {
      mockTokenFindFirst.mockResolvedValue(validToken);
      mockUserFindUnique.mockResolvedValue({ id: "user-123", name: "Test User" });
      mockUserUpdate.mockResolvedValue({});
      mockTokenDelete.mockResolvedValue({});
      mockUserSessionUpdateMany.mockResolvedValue({ count: 0 });
      mockSessionDeleteMany.mockResolvedValue({ count: 0 });

      const result = await resetPasswordAction({
        token: "valid-token",
        password: "NewSecurePass123!",
        confirmPassword: "NewSecurePass123!",
      });

      expect(result.success).toBe(true);
    });

    it("succeeds even if session invalidation fails", async () => {
      mockTokenFindFirst.mockResolvedValue(validToken);
      mockUserFindUnique.mockResolvedValue({ id: "user-123", name: "Test User" });
      mockUserUpdate.mockResolvedValue({});
      mockTokenDelete.mockResolvedValue({});
      mockUserSessionUpdateMany.mockRejectedValue(new Error("Session DB error"));

      const result = await resetPasswordAction({
        token: "valid-token",
        password: "NewSecurePass123!",
        confirmPassword: "NewSecurePass123!",
      });

      // Password reset should still succeed even if session invalidation fails
      expect(result.success).toBe(true);
    });
  });

  describe("token validation", () => {
    it("returns error for invalid token", async () => {
      mockTokenFindFirst.mockResolvedValue(null);

      const result = await resetPasswordAction({
        token: "invalid-token",
        password: "NewSecurePass123!",
        confirmPassword: "NewSecurePass123!",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid or expired");
      }
    });

    it("returns error for expired token", async () => {
      mockTokenFindFirst.mockResolvedValue(expiredToken);
      mockTokenDelete.mockResolvedValue({});

      const result = await resetPasswordAction({
        token: "expired-token",
        password: "NewSecurePass123!",
        confirmPassword: "NewSecurePass123!",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("expired");
      }
    });

    it("deletes expired token", async () => {
      mockTokenFindFirst.mockResolvedValue(expiredToken);
      mockTokenDelete.mockResolvedValue({});

      await resetPasswordAction({
        token: "expired-token",
        password: "NewSecurePass123!",
        confirmPassword: "NewSecurePass123!",
      });

      expect(mockTokenDelete).toHaveBeenCalledWith({
        where: {
          identifier_token: {
            identifier: expiredToken.identifier,
            token: expiredToken.token,
          },
        },
      });
    });

    it("queries token with password-reset prefix filter", async () => {
      mockTokenFindFirst.mockResolvedValue(null);

      await resetPasswordAction({
        token: "some-token",
        password: "NewSecurePass123!",
        confirmPassword: "NewSecurePass123!",
      });

      expect(mockTokenFindFirst).toHaveBeenCalledWith({
        where: {
          token: "some-token",
          identifier: { startsWith: "password-reset:" },
        },
      });
    });
  });

  describe("error handling", () => {
    it("returns generic error on database error", async () => {
      mockTokenFindFirst.mockRejectedValue(new Error("Database connection failed"));

      const result = await resetPasswordAction({
        token: "valid-token",
        password: "NewSecurePass123!",
        confirmPassword: "NewSecurePass123!",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("An error occurred while resetting your password");
      }
    });

    it("succeeds even if confirmation email fails", async () => {
      mockTokenFindFirst.mockResolvedValue(validToken);
      mockUserFindUnique.mockResolvedValue({ id: "user-123", name: "Test User" });
      mockUserUpdate.mockResolvedValue({});
      mockTokenDelete.mockResolvedValue({});
      mockSendPasswordChangedEmail.mockRejectedValue(new Error("SMTP error"));

      const result = await resetPasswordAction({
        token: "valid-token",
        password: "NewSecurePass123!",
        confirmPassword: "NewSecurePass123!",
      });

      expect(result.success).toBe(true);
    });

    it("returns error if user update fails", async () => {
      mockTokenFindFirst.mockResolvedValue(validToken);
      mockUserFindUnique.mockResolvedValue({ id: "user-123", name: "Test User" });
      mockUserUpdate.mockRejectedValue(new Error("Update failed"));

      const result = await resetPasswordAction({
        token: "valid-token",
        password: "NewSecurePass123!",
        confirmPassword: "NewSecurePass123!",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("An error occurred while resetting your password");
      }
    });
  });

  describe("edge cases", () => {
    it("handles token that expires exactly now", async () => {
      const tokenExpiringNow = {
        ...validToken,
        expires: new Date(Date.now() - 1), // Just expired
      };
      mockTokenFindFirst.mockResolvedValue(tokenExpiringNow);
      mockTokenDelete.mockResolvedValue({});

      const result = await resetPasswordAction({
        token: "token-expiring-now",
        password: "NewSecurePass123!",
        confirmPassword: "NewSecurePass123!",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("expired");
      }
    });

    it("extracts email correctly from identifier", async () => {
      const tokenWithDomain = {
        identifier: "password-reset:user+test@example.com",
        token: "valid-token",
        expires: new Date(Date.now() + 60 * 60 * 1000),
      };
      mockTokenFindFirst.mockResolvedValue(tokenWithDomain);
      mockUserFindUnique.mockResolvedValue({ id: "user-123", name: "Test User" });
      mockUserUpdate.mockResolvedValue({});
      mockTokenDelete.mockResolvedValue({});

      await resetPasswordAction({
        token: "valid-token",
        password: "NewSecurePass123!",
        confirmPassword: "NewSecurePass123!",
      });

      expect(mockUserUpdate).toHaveBeenCalledWith({
        where: { email: "user+test@example.com" },
        data: { password: "new_hashed_password" },
      });
    });

    it("handles user not found in database gracefully", async () => {
      mockTokenFindFirst.mockResolvedValue(validToken);
      mockUserFindUnique.mockResolvedValue(null);
      mockUserUpdate.mockResolvedValue({});
      mockTokenDelete.mockResolvedValue({});

      const result = await resetPasswordAction({
        token: "valid-token",
        password: "NewSecurePass123!",
        confirmPassword: "NewSecurePass123!",
      });

      // The action proceeds even if user is not found (for the name lookup)
      // because it updates by email from the token
      expect(result.success).toBe(true);
    });

    it("handles password with various special characters", async () => {
      mockTokenFindFirst.mockResolvedValue(validToken);
      mockUserFindUnique.mockResolvedValue({ id: "user-123", name: "Test User" });
      mockUserUpdate.mockResolvedValue({});
      mockTokenDelete.mockResolvedValue({});

      const result = await resetPasswordAction({
        token: "valid-token",
        password: "NewPass123!@#$%",
        confirmPassword: "NewPass123!@#$%",
      });

      expect(result.success).toBe(true);
    });
  });
});
