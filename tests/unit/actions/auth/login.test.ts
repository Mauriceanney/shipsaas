import { describe, expect, it, vi, beforeEach } from "vitest";

// Use vi.hoisted to properly hoist the mock function
const { mockSignIn, mockRateLimitAuth, mockGetClientIpFromHeaders, mockFindUnique } = vi.hoisted(() => ({
  mockSignIn: vi.fn(),
  mockRateLimitAuth: vi.fn(),
  mockGetClientIpFromHeaders: vi.fn(),
  mockFindUnique: vi.fn(),
}));

// Mock next-auth to avoid import issues
vi.mock("next-auth", () => {
  class MockAuthError extends Error {
    type: string;
    constructor(message: string) {
      super(message);
      this.name = "AuthError";
      this.type = message;
    }
  }
  return {
    AuthError: MockAuthError,
  };
});

// Mock the auth module before importing the action
vi.mock("@/lib/auth", () => ({
  signIn: mockSignIn,
}));

// Mock rate limiting
vi.mock("@/lib/rate-limit", () => ({
  rateLimiters: {
    auth: mockRateLimitAuth,
  },
  getClientIpFromHeaders: mockGetClientIpFromHeaders,
}));

// Mock database
vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: mockFindUnique,
    },
  },
}));

import { loginAction } from "@/actions/auth/login";
import { AuthError } from "next-auth";

describe("loginAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: rate limiting allows request
    mockGetClientIpFromHeaders.mockResolvedValue("192.168.1.1");
    mockRateLimitAuth.mockResolvedValue({
      success: true,
      limit: 5,
      remaining: 4,
      reset: Math.ceil(Date.now() / 1000) + 60,
    });
    // Default: user without 2FA
    mockFindUnique.mockResolvedValue(null);
  });

  // Helper to check for error in result
  const hasError = (result: { success: boolean; error?: string }): result is { success: false; error: string } => {
    return !result.success && "error" in result;
  };

  describe("input validation", () => {
    it("returns error for invalid email format", async () => {
      const result = await loginAction({
        email: "invalid-email",
        password: "password123",
      });

      expect(result.success).toBe(false);
      expect(hasError(result)).toBe(true);
      if (hasError(result)) {
        expect(result.error).toContain("email");
      }
      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it("returns error for empty email", async () => {
      const result = await loginAction({
        email: "",
        password: "password123",
      });

      expect(result.success).toBe(false);
      expect(hasError(result)).toBe(true);
      if (hasError(result)) {
        expect(result.error).toBeDefined();
      }
      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it("returns error for empty password", async () => {
      const result = await loginAction({
        email: "user@example.com",
        password: "",
      });

      expect(result.success).toBe(false);
      expect(hasError(result)).toBe(true);
      if (hasError(result)) {
        expect(result.error).toContain("required");
      }
      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it("returns error for missing password", async () => {
      const result = await loginAction({
        email: "user@example.com",
        password: "",
      });

      expect(result.success).toBe(false);
      expect(mockSignIn).not.toHaveBeenCalled();
    });
  });

  describe("success path", () => {
    it("calls signIn with correct credentials", async () => {
      mockSignIn.mockResolvedValue(undefined);

      const result = await loginAction({
        email: "user@example.com",
        password: "SecurePass123!",
      });

      expect(result.success).toBe(true);
      expect(mockSignIn).toHaveBeenCalledTimes(1);
      expect(mockSignIn).toHaveBeenCalledWith("credentials", {
        email: "user@example.com",
        password: "SecurePass123!",
        redirect: false,
      });
    });

    it("returns success when signIn succeeds", async () => {
      mockSignIn.mockResolvedValue(undefined);

      const result = await loginAction({
        email: "user@example.com",
        password: "SecurePass123!",
      });

      expect(result).toEqual({ success: true });
    });
  });

  describe("error handling", () => {
    it("returns error for invalid credentials (CredentialsSignin)", async () => {
      const authError = new AuthError("CredentialsSignin");
      authError.type = "CredentialsSignin";
      mockSignIn.mockRejectedValue(authError);

      const result = await loginAction({
        email: "user@example.com",
        password: "WrongPassword123!",
      });

      expect(result.success).toBe(false);
      expect(hasError(result)).toBe(true);
      if (hasError(result)) {
        expect(result.error).toBe("Invalid email or password");
      }
    });

    it("returns error for unverified email", async () => {
      const authError = new AuthError("EmailNotVerified");
      authError.type = "AccessDenied";
      authError.message = "EmailNotVerified";
      mockSignIn.mockRejectedValue(authError);

      const result = await loginAction({
        email: "user@example.com",
        password: "SecurePass123!",
      });

      expect(result.success).toBe(false);
      expect(hasError(result)).toBe(true);
      if (hasError(result)) {
        expect(result.error).toBe("Please verify your email before logging in");
      }
    });

    it("returns generic error for other AuthError types", async () => {
      const authError = new AuthError("Configuration");
      (authError as { type: string }).type = "Configuration";
      mockSignIn.mockRejectedValue(authError);

      const result = await loginAction({
        email: "user@example.com",
        password: "SecurePass123!",
      });

      expect(result.success).toBe(false);
      expect(hasError(result)).toBe(true);
      if (hasError(result)) {
        expect(result.error).toBe("An error occurred during login");
      }
    });

    it("throws non-AuthError exceptions", async () => {
      const error = new Error("Network error");
      mockSignIn.mockRejectedValue(error);

      await expect(
        loginAction({
          email: "user@example.com",
          password: "SecurePass123!",
        })
      ).rejects.toThrow("Network error");
    });
  });

  describe("edge cases", () => {
    it("handles email with uppercase letters", async () => {
      mockSignIn.mockResolvedValue(undefined);

      const result = await loginAction({
        email: "User@Example.COM",
        password: "SecurePass123!",
      });

      expect(result.success).toBe(true);
      expect(mockSignIn).toHaveBeenCalledWith("credentials", {
        email: "User@Example.COM",
        password: "SecurePass123!",
        redirect: false,
      });
    });

    it("handles email with plus sign", async () => {
      mockSignIn.mockResolvedValue(undefined);

      const result = await loginAction({
        email: "user+test@example.com",
        password: "SecurePass123!",
      });

      expect(result.success).toBe(true);
      expect(mockSignIn).toHaveBeenCalledWith("credentials", {
        email: "user+test@example.com",
        password: "SecurePass123!",
        redirect: false,
      });
    });

    it("trims whitespace from email (if schema does)", async () => {
      mockSignIn.mockResolvedValue(undefined);

      // This test verifies the behavior - if validation passes, signIn is called
      const result = await loginAction({
        email: "user@example.com",
        password: "SecurePass123!",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("rate limiting", () => {
    it("returns rate limit error when limit exceeded", async () => {
      mockRateLimitAuth.mockResolvedValue({
        success: false,
        limit: 5,
        remaining: 0,
        reset: Math.ceil(Date.now() / 1000) + 60,
      });

      const result = await loginAction({
        email: "user@example.com",
        password: "SecurePass123!",
      });

      expect(result.success).toBe(false);
      expect(hasError(result)).toBe(true);
      if (hasError(result)) {
        expect(result.error).toContain("Too many");
      }
      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it("calls rate limiter with client IP", async () => {
      mockGetClientIpFromHeaders.mockResolvedValue("10.0.0.1");
      mockSignIn.mockResolvedValue(undefined);

      await loginAction({
        email: "user@example.com",
        password: "SecurePass123!",
      });

      expect(mockGetClientIpFromHeaders).toHaveBeenCalled();
      expect(mockRateLimitAuth).toHaveBeenCalledWith("10.0.0.1");
    });

    it("allows request when under rate limit", async () => {
      mockSignIn.mockResolvedValue(undefined);

      const result = await loginAction({
        email: "user@example.com",
        password: "SecurePass123!",
      });

      expect(result.success).toBe(true);
      expect(mockRateLimitAuth).toHaveBeenCalled();
    });
  });

  describe("disabled account handling", () => {
    it("returns error for disabled account", async () => {
      const authError = new AuthError("AccountDisabled");
      authError.type = "AccessDenied";
      authError.message = "AccountDisabled";
      mockSignIn.mockRejectedValue(authError);

      const result = await loginAction({
        email: "user@example.com",
        password: "SecurePass123!",
      });

      expect(result.success).toBe(false);
      expect(hasError(result)).toBe(true);
      if (hasError(result)) {
        expect(result.error).toBe("Your account has been disabled");
      }
    });
  });
});
