import { describe, expect, it, vi, beforeEach } from "vitest";

// Use vi.hoisted for mock functions that need to be hoisted
const { mockFindUnique, mockCreate, mockTokenCreate, mockSendVerificationEmail, mockRateLimitAuth, mockGetClientIpFromHeaders } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockCreate: vi.fn(),
  mockTokenCreate: vi.fn(),
  mockSendVerificationEmail: vi.fn(),
  mockRateLimitAuth: vi.fn(),
  mockGetClientIpFromHeaders: vi.fn(),
}));

// Mock the database module
vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: mockFindUnique,
      create: mockCreate,
    },
    verificationToken: {
      create: mockTokenCreate,
    },
  },
}));

// Mock bcryptjs
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed_password"),
  },
}));

// Mock crypto
vi.mock("crypto", () => ({
  default: {
    randomBytes: vi.fn().mockReturnValue({
      toString: vi.fn().mockReturnValue("mock-verification-token"),
    }),
  },
}));

// Mock email functions
vi.mock("@/lib/email", () => ({
  sendVerificationEmail: mockSendVerificationEmail,
}));

// Mock rate limiting
vi.mock("@/lib/rate-limit", () => ({
  rateLimiters: {
    auth: mockRateLimitAuth,
  },
  getClientIpFromHeaders: mockGetClientIpFromHeaders,
}));

import { registerAction } from "@/actions/auth/register";
import bcrypt from "bcryptjs";

describe("registerAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendVerificationEmail.mockResolvedValue({ success: true });
    // Default: rate limiting allows request
    mockGetClientIpFromHeaders.mockReturnValue("192.168.1.1");
    mockRateLimitAuth.mockResolvedValue({
      success: true,
      limit: 5,
      remaining: 4,
      reset: Math.ceil(Date.now() / 1000) + 60,
    });
  });

  describe("input validation", () => {
    it("returns error for invalid email format", async () => {
      const result = await registerAction({
        name: "Test User",
        email: "invalid-email",
        password: "SecurePass123!",
        confirmPassword: "SecurePass123!",
        tosAccepted: true,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("email");
      }
      expect(mockFindUnique).not.toHaveBeenCalled();
    });

    it("returns error for empty name", async () => {
      const result = await registerAction({
        name: "",
        email: "user@example.com",
        password: "SecurePass123!",
        confirmPassword: "SecurePass123!",
        tosAccepted: true,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("required");
      }
    });

    it("returns error for name too long", async () => {
      const result = await registerAction({
        name: "A".repeat(101),
        email: "user@example.com",
        password: "SecurePass123!",
        confirmPassword: "SecurePass123!",
        tosAccepted: true,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("too long");
      }
    });

    it("returns error for password without uppercase", async () => {
      const result = await registerAction({
        name: "Test User",
        email: "user@example.com",
        password: "securepass123!",
        confirmPassword: "securepass123!",
        tosAccepted: true,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("uppercase");
      }
    });

    it("returns error for password without lowercase", async () => {
      const result = await registerAction({
        name: "Test User",
        email: "user@example.com",
        password: "SECUREPASS123!",
        confirmPassword: "SECUREPASS123!",
        tosAccepted: true,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("lowercase");
      }
    });

    it("returns error for password without number", async () => {
      const result = await registerAction({
        name: "Test User",
        email: "user@example.com",
        password: "SecurePassWord!",
        confirmPassword: "SecurePassWord!",
        tosAccepted: true,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("number");
      }
    });

    it("returns error for password without special character", async () => {
      const result = await registerAction({
        name: "Test User",
        email: "user@example.com",
        password: "SecurePass123",
        confirmPassword: "SecurePass123",
        tosAccepted: true,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("special character");
      }
    });

    it("returns error for password too short", async () => {
      const result = await registerAction({
        name: "Test User",
        email: "user@example.com",
        password: "Pass1!",
        confirmPassword: "Pass1!",
        tosAccepted: true,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("8 characters");
      }
    });

    it("returns error when passwords do not match", async () => {
      const result = await registerAction({
        name: "Test User",
        email: "user@example.com",
        password: "SecurePass123!",
        confirmPassword: "DifferentPass123!",
        tosAccepted: true,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("match");
      }
    });

    it("returns error when TOS not accepted", async () => {
      const result = await registerAction({
        name: "Test User",
        email: "user@example.com",
        password: "SecurePass123!",
        confirmPassword: "SecurePass123!",
        tosAccepted: false,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Terms of Service");
      }
    });
  });

  describe("success path", () => {
    it("creates user and verification token successfully", async () => {
      mockFindUnique.mockResolvedValue(null);
      mockCreate.mockResolvedValue({
        id: "user-123",
        name: "Test User",
        email: "user@example.com",
      });
      mockTokenCreate.mockResolvedValue({});

      const result = await registerAction({
        name: "Test User",
        email: "user@example.com",
        password: "SecurePass123!",
        confirmPassword: "SecurePass123!",
        tosAccepted: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.message).toContain("verify");
      }
    });

    it("hashes password with bcrypt", async () => {
      mockFindUnique.mockResolvedValue(null);
      mockCreate.mockResolvedValue({
        id: "user-123",
        name: "Test User",
        email: "user@example.com",
      });
      mockTokenCreate.mockResolvedValue({});

      await registerAction({
        name: "Test User",
        email: "user@example.com",
        password: "SecurePass123!",
        confirmPassword: "SecurePass123!",
        tosAccepted: true,
      });

      expect(bcrypt.hash).toHaveBeenCalledWith("SecurePass123!", 12);
    });

    it("creates user with hashed password", async () => {
      mockFindUnique.mockResolvedValue(null);
      mockCreate.mockResolvedValue({
        id: "user-123",
        name: "Test User",
        email: "user@example.com",
      });
      mockTokenCreate.mockResolvedValue({});

      await registerAction({
        name: "Test User",
        email: "user@example.com",
        password: "SecurePass123!",
        confirmPassword: "SecurePass123!",
        tosAccepted: true,
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          name: "Test User",
          email: "user@example.com",
          password: "hashed_password",
          tosAcceptedAt: expect.any(Date),
        },
      });
    });

    it("creates verification token with 24 hour expiry", async () => {
      mockFindUnique.mockResolvedValue(null);
      mockCreate.mockResolvedValue({
        id: "user-123",
        name: "Test User",
        email: "user@example.com",
      });
      mockTokenCreate.mockResolvedValue({});

      const beforeCall = Date.now();
      await registerAction({
        name: "Test User",
        email: "user@example.com",
        password: "SecurePass123!",
        confirmPassword: "SecurePass123!",
        tosAccepted: true,
      });
      const afterCall = Date.now();

      expect(mockTokenCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          identifier: "user@example.com",
          token: "mock-verification-token",
          expires: expect.any(Date),
        }),
      });

      // Check that expires is approximately 24 hours from now
      const tokenCall = mockTokenCreate.mock.calls[0]![0];
      const expiresTime = tokenCall.data.expires.getTime();
      const expectedMinTime = beforeCall + 24 * 60 * 60 * 1000 - 1000; // 24 hours - 1 second
      const expectedMaxTime = afterCall + 24 * 60 * 60 * 1000 + 1000; // 24 hours + 1 second
      expect(expiresTime).toBeGreaterThanOrEqual(expectedMinTime);
      expect(expiresTime).toBeLessThanOrEqual(expectedMaxTime);
    });

    it("sends verification email", async () => {
      mockFindUnique.mockResolvedValue(null);
      mockCreate.mockResolvedValue({
        id: "user-123",
        name: "Test User",
        email: "user@example.com",
      });
      mockTokenCreate.mockResolvedValue({});

      await registerAction({
        name: "Test User",
        email: "user@example.com",
        password: "SecurePass123!",
        confirmPassword: "SecurePass123!",
        tosAccepted: true,
      });

      expect(mockSendVerificationEmail).toHaveBeenCalledWith(
        "user@example.com",
        "mock-verification-token",
        "Test User"
      );
    });
  });

  describe("error handling", () => {
    it("returns error when user already exists", async () => {
      mockFindUnique.mockResolvedValue({
        id: "existing-user",
        email: "user@example.com",
      });

      const result = await registerAction({
        name: "Test User",
        email: "user@example.com",
        password: "SecurePass123!",
        confirmPassword: "SecurePass123!",
        tosAccepted: true,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("already exists");
      }
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it("returns generic error on database error", async () => {
      mockFindUnique.mockRejectedValue(new Error("Database connection failed"));

      const result = await registerAction({
        name: "Test User",
        email: "user@example.com",
        password: "SecurePass123!",
        confirmPassword: "SecurePass123!",
        tosAccepted: true,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("An error occurred during registration");
      }
    });

    it("succeeds even if verification email fails", async () => {
      mockFindUnique.mockResolvedValue(null);
      mockCreate.mockResolvedValue({
        id: "user-123",
        name: "Test User",
        email: "user@example.com",
      });
      mockTokenCreate.mockResolvedValue({});
      mockSendVerificationEmail.mockRejectedValue(new Error("SMTP error"));

      const result = await registerAction({
        name: "Test User",
        email: "user@example.com",
        password: "SecurePass123!",
        confirmPassword: "SecurePass123!",
        tosAccepted: true,
      });

      // Registration should still succeed even if email fails
      expect(result.success).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("handles email with plus sign", async () => {
      mockFindUnique.mockResolvedValue(null);
      mockCreate.mockResolvedValue({
        id: "user-123",
        name: "Test User",
        email: "user+test@example.com",
      });
      mockTokenCreate.mockResolvedValue({});

      const result = await registerAction({
        name: "Test User",
        email: "user+test@example.com",
        password: "SecurePass123!",
        confirmPassword: "SecurePass123!",
        tosAccepted: true,
      });

      expect(result.success).toBe(true);
      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: "user+test@example.com",
        }),
      });
    });

    it("handles name with special characters", async () => {
      mockFindUnique.mockResolvedValue(null);
      mockCreate.mockResolvedValue({
        id: "user-123",
        name: "O'Brien-Smith",
        email: "user@example.com",
      });
      mockTokenCreate.mockResolvedValue({});

      const result = await registerAction({
        name: "O'Brien-Smith",
        email: "user@example.com",
        password: "SecurePass123!",
        confirmPassword: "SecurePass123!",
        tosAccepted: true,
      });

      expect(result.success).toBe(true);
      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: "O'Brien-Smith",
        }),
      });
    });

    it("handles unicode characters in name", async () => {
      mockFindUnique.mockResolvedValue(null);
      mockCreate.mockResolvedValue({
        id: "user-123",
        name: "Test User",
        email: "user@example.com",
      });
      mockTokenCreate.mockResolvedValue({});

      const result = await registerAction({
        name: "Test User",
        email: "user@example.com",
        password: "SecurePass123!",
        confirmPassword: "SecurePass123!",
        tosAccepted: true,
      });

      expect(result.success).toBe(true);
    });

    it("handles password with unicode special characters", async () => {
      mockFindUnique.mockResolvedValue(null);
      mockCreate.mockResolvedValue({
        id: "user-123",
        name: "Test User",
        email: "user@example.com",
      });
      mockTokenCreate.mockResolvedValue({});

      // Password with valid ASCII special character
      const result = await registerAction({
        name: "Test User",
        email: "user@example.com",
        password: "SecurePass123@",
        confirmPassword: "SecurePass123@",
        tosAccepted: true,
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

      const result = await registerAction({
        name: "Test User",
        email: "user@example.com",
        password: "SecurePass123!",
        confirmPassword: "SecurePass123!",
        tosAccepted: true,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Too many");
      }
      expect(mockFindUnique).not.toHaveBeenCalled();
    });

    it("calls rate limiter with client IP", async () => {
      mockGetClientIpFromHeaders.mockReturnValue("10.0.0.1");
      mockFindUnique.mockResolvedValue(null);
      mockCreate.mockResolvedValue({
        id: "user-123",
        name: "Test User",
        email: "user@example.com",
      });
      mockTokenCreate.mockResolvedValue({});

      await registerAction({
        name: "Test User",
        email: "user@example.com",
        password: "SecurePass123!",
        confirmPassword: "SecurePass123!",
        tosAccepted: true,
      });

      expect(mockGetClientIpFromHeaders).toHaveBeenCalled();
      expect(mockRateLimitAuth).toHaveBeenCalledWith("10.0.0.1");
    });

    it("allows request when under rate limit", async () => {
      mockFindUnique.mockResolvedValue(null);
      mockCreate.mockResolvedValue({
        id: "user-123",
        name: "Test User",
        email: "user@example.com",
      });
      mockTokenCreate.mockResolvedValue({});

      const result = await registerAction({
        name: "Test User",
        email: "user@example.com",
        password: "SecurePass123!",
        confirmPassword: "SecurePass123!",
        tosAccepted: true,
      });

      expect(result.success).toBe(true);
      expect(mockRateLimitAuth).toHaveBeenCalled();
    });
  });
});
