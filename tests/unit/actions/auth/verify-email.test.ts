import { describe, expect, it, vi, beforeEach } from "vitest";

// Use vi.hoisted for mock functions that need to be hoisted
const { mockTokenFindFirst, mockTokenDelete, mockUserFindUnique, mockUserUpdate, mockSendWelcomeEmail } = vi.hoisted(() => ({
  mockTokenFindFirst: vi.fn(),
  mockTokenDelete: vi.fn(),
  mockUserFindUnique: vi.fn(),
  mockUserUpdate: vi.fn(),
  mockSendWelcomeEmail: vi.fn(),
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
  },
}));

// Mock email functions
vi.mock("@/lib/email", () => ({
  sendWelcomeEmail: mockSendWelcomeEmail,
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { verifyEmailAction } from "@/actions/auth/verify-email";

describe("verifyEmailAction", () => {
  const validToken = {
    identifier: "user@example.com",
    token: "valid-verification-token",
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
  };

  const expiredToken = {
    identifier: "user@example.com",
    token: "expired-token",
    expires: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
  };

  const unverifiedUser = {
    id: "user-123",
    email: "user@example.com",
    name: "Test User",
    emailVerified: null,
  };

  const verifiedUser = {
    id: "user-123",
    email: "user@example.com",
    name: "Test User",
    emailVerified: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSendWelcomeEmail.mockResolvedValue({ success: true });
  });

  describe("input validation", () => {
    it("returns error for empty token", async () => {
      const result = await verifyEmailAction({
        token: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid verification link");
      }
      expect(mockTokenFindFirst).not.toHaveBeenCalled();
    });
  });

  describe("success path", () => {
    it("verifies email successfully", async () => {
      mockTokenFindFirst.mockResolvedValue(validToken);
      mockUserFindUnique.mockResolvedValue(unverifiedUser);
      mockUserUpdate.mockResolvedValue({});
      mockTokenDelete.mockResolvedValue({});

      const result = await verifyEmailAction({
        token: "valid-verification-token",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.message).toContain("verified successfully");
      }
    });

    it("updates user emailVerified timestamp", async () => {
      mockTokenFindFirst.mockResolvedValue(validToken);
      mockUserFindUnique.mockResolvedValue(unverifiedUser);
      mockUserUpdate.mockResolvedValue({});
      mockTokenDelete.mockResolvedValue({});

      const beforeCall = Date.now();
      await verifyEmailAction({
        token: "valid-verification-token",
      });
      const afterCall = Date.now();

      expect(mockUserUpdate).toHaveBeenCalledWith({
        where: { email: "user@example.com" },
        data: {
          emailVerified: expect.any(Date),
          welcomeEmailSent: true,
        },
      });

      // Verify the date is approximately now
      const updateCall = mockUserUpdate.mock.calls[0]![0];
      const verifiedTime = updateCall.data.emailVerified.getTime();
      expect(verifiedTime).toBeGreaterThanOrEqual(beforeCall);
      expect(verifiedTime).toBeLessThanOrEqual(afterCall);
    });

    it("sets welcomeEmailSent flag to true", async () => {
      mockTokenFindFirst.mockResolvedValue(validToken);
      mockUserFindUnique.mockResolvedValue(unverifiedUser);
      mockUserUpdate.mockResolvedValue({});
      mockTokenDelete.mockResolvedValue({});

      await verifyEmailAction({
        token: "valid-verification-token",
      });

      expect(mockUserUpdate).toHaveBeenCalledWith({
        where: { email: "user@example.com" },
        data: expect.objectContaining({
          welcomeEmailSent: true,
        }),
      });
    });

    it("deletes used verification token", async () => {
      mockTokenFindFirst.mockResolvedValue(validToken);
      mockUserFindUnique.mockResolvedValue(unverifiedUser);
      mockUserUpdate.mockResolvedValue({});
      mockTokenDelete.mockResolvedValue({});

      await verifyEmailAction({
        token: "valid-verification-token",
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

    it("sends welcome email with user name", async () => {
      mockTokenFindFirst.mockResolvedValue(validToken);
      mockUserFindUnique.mockResolvedValue(unverifiedUser);
      mockUserUpdate.mockResolvedValue({});
      mockTokenDelete.mockResolvedValue({});

      await verifyEmailAction({
        token: "valid-verification-token",
      });

      expect(mockSendWelcomeEmail).toHaveBeenCalledWith(
        "user@example.com",
        "Test User"
      );
    });

    it("sends welcome email with 'there' if user has no name", async () => {
      mockTokenFindFirst.mockResolvedValue(validToken);
      mockUserFindUnique.mockResolvedValue({ ...unverifiedUser, name: null });
      mockUserUpdate.mockResolvedValue({});
      mockTokenDelete.mockResolvedValue({});

      await verifyEmailAction({
        token: "valid-verification-token",
      });

      expect(mockSendWelcomeEmail).toHaveBeenCalledWith(
        "user@example.com",
        "there"
      );
    });
  });

  describe("token validation", () => {
    it("returns error for invalid token", async () => {
      mockTokenFindFirst.mockResolvedValue(null);

      const result = await verifyEmailAction({
        token: "invalid-token",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid verification link");
      }
    });

    it("returns error for expired token", async () => {
      mockTokenFindFirst.mockResolvedValue(expiredToken);
      mockTokenDelete.mockResolvedValue({});

      const result = await verifyEmailAction({
        token: "expired-token",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("expired");
      }
    });

    it("deletes expired token", async () => {
      mockTokenFindFirst.mockResolvedValue(expiredToken);
      mockTokenDelete.mockResolvedValue({});

      await verifyEmailAction({
        token: "expired-token",
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

    it("excludes password-reset tokens from query", async () => {
      mockTokenFindFirst.mockResolvedValue(null);

      await verifyEmailAction({
        token: "some-token",
      });

      expect(mockTokenFindFirst).toHaveBeenCalledWith({
        where: {
          token: "some-token",
          identifier: { not: { startsWith: "password-reset:" } },
        },
      });
    });
  });

  describe("user validation", () => {
    it("returns error when user not found", async () => {
      mockTokenFindFirst.mockResolvedValue(validToken);
      mockUserFindUnique.mockResolvedValue(null);

      const result = await verifyEmailAction({
        token: "valid-verification-token",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("User not found");
      }
    });

    it("returns success when email is already verified", async () => {
      mockTokenFindFirst.mockResolvedValue(validToken);
      mockUserFindUnique.mockResolvedValue(verifiedUser);
      mockTokenDelete.mockResolvedValue({});

      const result = await verifyEmailAction({
        token: "valid-verification-token",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.message).toBe("Your email is already verified");
      }
    });

    it("deletes token when email is already verified", async () => {
      mockTokenFindFirst.mockResolvedValue(validToken);
      mockUserFindUnique.mockResolvedValue(verifiedUser);
      mockTokenDelete.mockResolvedValue({});

      await verifyEmailAction({
        token: "valid-verification-token",
      });

      expect(mockTokenDelete).toHaveBeenCalled();
    });

    it("does not update user when email is already verified", async () => {
      mockTokenFindFirst.mockResolvedValue(validToken);
      mockUserFindUnique.mockResolvedValue(verifiedUser);
      mockTokenDelete.mockResolvedValue({});

      await verifyEmailAction({
        token: "valid-verification-token",
      });

      expect(mockUserUpdate).not.toHaveBeenCalled();
    });

    it("does not send welcome email when email is already verified", async () => {
      mockTokenFindFirst.mockResolvedValue(validToken);
      mockUserFindUnique.mockResolvedValue(verifiedUser);
      mockTokenDelete.mockResolvedValue({});

      await verifyEmailAction({
        token: "valid-verification-token",
      });

      expect(mockSendWelcomeEmail).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("returns generic error on database error", async () => {
      mockTokenFindFirst.mockRejectedValue(new Error("Database connection failed"));

      const result = await verifyEmailAction({
        token: "valid-token",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("An error occurred while verifying your email");
      }
    });

    it("succeeds even if welcome email fails", async () => {
      mockTokenFindFirst.mockResolvedValue(validToken);
      mockUserFindUnique.mockResolvedValue(unverifiedUser);
      mockUserUpdate.mockResolvedValue({});
      mockTokenDelete.mockResolvedValue({});
      mockSendWelcomeEmail.mockRejectedValue(new Error("SMTP error"));

      const result = await verifyEmailAction({
        token: "valid-verification-token",
      });

      expect(result.success).toBe(true);
    });

    it("returns error if user update fails", async () => {
      mockTokenFindFirst.mockResolvedValue(validToken);
      mockUserFindUnique.mockResolvedValue(unverifiedUser);
      mockUserUpdate.mockRejectedValue(new Error("Update failed"));

      const result = await verifyEmailAction({
        token: "valid-verification-token",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("An error occurred while verifying your email");
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

      const result = await verifyEmailAction({
        token: "token-expiring-now",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("expired");
      }
    });

    it("handles email with plus sign in identifier", async () => {
      const tokenWithPlusEmail = {
        identifier: "user+test@example.com",
        token: "valid-token",
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };
      mockTokenFindFirst.mockResolvedValue(tokenWithPlusEmail);
      mockUserFindUnique.mockResolvedValue({
        ...unverifiedUser,
        email: "user+test@example.com",
      });
      mockUserUpdate.mockResolvedValue({});
      mockTokenDelete.mockResolvedValue({});

      const result = await verifyEmailAction({
        token: "valid-token",
      });

      expect(result.success).toBe(true);
      expect(mockUserFindUnique).toHaveBeenCalledWith({
        where: { email: "user+test@example.com" },
      });
    });

    it("handles user with empty string name", async () => {
      mockTokenFindFirst.mockResolvedValue(validToken);
      mockUserFindUnique.mockResolvedValue({ ...unverifiedUser, name: "" });
      mockUserUpdate.mockResolvedValue({});
      mockTokenDelete.mockResolvedValue({});

      await verifyEmailAction({
        token: "valid-verification-token",
      });

      // Empty string is NOT null/undefined, so ?? operator passes it through
      // The actual code uses `user.name ?? "there"` which returns empty string
      expect(mockSendWelcomeEmail).toHaveBeenCalledWith(
        "user@example.com",
        ""
      );
    });

    it("handles concurrent verification attempts gracefully", async () => {
      // First call finds token
      mockTokenFindFirst.mockResolvedValue(validToken);
      mockUserFindUnique.mockResolvedValue(unverifiedUser);
      mockUserUpdate.mockResolvedValue({});
      // Token delete might fail if already deleted
      mockTokenDelete.mockRejectedValue(new Error("Token not found"));

      const result = await verifyEmailAction({
        token: "valid-verification-token",
      });

      // The action should handle this gracefully
      expect(result.success).toBe(false);
    });
  });
});
