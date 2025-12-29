import { describe, expect, it, vi, beforeEach } from "vitest";

// Use vi.hoisted for mock functions that need to be hoisted
const { mockFindUnique, mockDeleteMany, mockTokenCreate, mockSendPasswordResetEmail } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockDeleteMany: vi.fn(),
  mockTokenCreate: vi.fn(),
  mockSendPasswordResetEmail: vi.fn(),
}));

// Mock the database module
vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: mockFindUnique,
    },
    verificationToken: {
      deleteMany: mockDeleteMany,
      create: mockTokenCreate,
    },
  },
}));

// Mock crypto
vi.mock("crypto", () => ({
  default: {
    randomBytes: vi.fn().mockReturnValue({
      toString: vi.fn().mockReturnValue("mock-reset-token"),
    }),
  },
}));

// Mock email functions
vi.mock("@/lib/email", () => ({
  sendPasswordResetEmail: mockSendPasswordResetEmail,
}));

import { forgotPasswordAction } from "@/actions/auth/forgot-password";

describe("forgotPasswordAction", () => {
  const successMessage = "If an account exists with this email, you will receive a reset link";

  beforeEach(() => {
    vi.clearAllMocks();
    mockSendPasswordResetEmail.mockResolvedValue({ success: true });
  });

  describe("input validation", () => {
    it("returns success even for invalid email format (prevents enumeration)", async () => {
      const result = await forgotPasswordAction({
        email: "invalid-email",
      });

      // Always returns success to prevent email enumeration
      expect(result.success).toBe(true);
      expect(result.message).toBe(successMessage);
      expect(mockFindUnique).not.toHaveBeenCalled();
    });

    it("returns success even for empty email (prevents enumeration)", async () => {
      const result = await forgotPasswordAction({
        email: "",
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe(successMessage);
      expect(mockFindUnique).not.toHaveBeenCalled();
    });
  });

  describe("success path", () => {
    it("creates reset token for existing user", async () => {
      mockFindUnique.mockResolvedValue({
        id: "user-123",
        email: "user@example.com",
        name: "Test User",
      });
      mockDeleteMany.mockResolvedValue({ count: 0 });
      mockTokenCreate.mockResolvedValue({});

      const result = await forgotPasswordAction({
        email: "user@example.com",
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe(successMessage);
      expect(mockTokenCreate).toHaveBeenCalled();
    });

    it("deletes existing reset tokens before creating new one", async () => {
      const callOrder: string[] = [];
      mockFindUnique.mockResolvedValue({
        id: "user-123",
        email: "user@example.com",
        name: "Test User",
      });
      mockDeleteMany.mockImplementation(() => {
        callOrder.push("deleteMany");
        return Promise.resolve({ count: 1 });
      });
      mockTokenCreate.mockImplementation(() => {
        callOrder.push("create");
        return Promise.resolve({});
      });

      await forgotPasswordAction({
        email: "user@example.com",
      });

      expect(mockDeleteMany).toHaveBeenCalledWith({
        where: {
          identifier: "password-reset:user@example.com",
        },
      });
      // Verify delete is called before create
      expect(callOrder).toEqual(["deleteMany", "create"]);
    });

    it("creates token with correct identifier prefix", async () => {
      mockFindUnique.mockResolvedValue({
        id: "user-123",
        email: "user@example.com",
        name: "Test User",
      });
      mockDeleteMany.mockResolvedValue({ count: 0 });
      mockTokenCreate.mockResolvedValue({});

      await forgotPasswordAction({
        email: "user@example.com",
      });

      expect(mockTokenCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          identifier: "password-reset:user@example.com",
          token: "mock-reset-token",
        }),
      });
    });

    it("creates token with 1 hour expiry", async () => {
      mockFindUnique.mockResolvedValue({
        id: "user-123",
        email: "user@example.com",
        name: "Test User",
      });
      mockDeleteMany.mockResolvedValue({ count: 0 });
      mockTokenCreate.mockResolvedValue({});

      const beforeCall = Date.now();
      await forgotPasswordAction({
        email: "user@example.com",
      });
      const afterCall = Date.now();

      const tokenCall = mockTokenCreate.mock.calls[0]![0];
      const expiresTime = tokenCall.data.expires.getTime();
      const expectedMinTime = beforeCall + 60 * 60 * 1000 - 1000; // 1 hour - 1 second
      const expectedMaxTime = afterCall + 60 * 60 * 1000 + 1000; // 1 hour + 1 second
      expect(expiresTime).toBeGreaterThanOrEqual(expectedMinTime);
      expect(expiresTime).toBeLessThanOrEqual(expectedMaxTime);
    });

    it("sends password reset email with user name", async () => {
      mockFindUnique.mockResolvedValue({
        id: "user-123",
        email: "user@example.com",
        name: "Test User",
      });
      mockDeleteMany.mockResolvedValue({ count: 0 });
      mockTokenCreate.mockResolvedValue({});

      await forgotPasswordAction({
        email: "user@example.com",
      });

      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
        "user@example.com",
        "mock-reset-token",
        "Test User"
      );
    });

    it("sends password reset email with undefined name if user has no name", async () => {
      mockFindUnique.mockResolvedValue({
        id: "user-123",
        email: "user@example.com",
        name: null,
      });
      mockDeleteMany.mockResolvedValue({ count: 0 });
      mockTokenCreate.mockResolvedValue({});

      await forgotPasswordAction({
        email: "user@example.com",
      });

      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
        "user@example.com",
        "mock-reset-token",
        undefined
      );
    });
  });

  describe("user not found (security - prevents enumeration)", () => {
    it("returns success when user does not exist", async () => {
      mockFindUnique.mockResolvedValue(null);

      const result = await forgotPasswordAction({
        email: "nonexistent@example.com",
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe(successMessage);
    });

    it("does not create token when user does not exist", async () => {
      mockFindUnique.mockResolvedValue(null);

      await forgotPasswordAction({
        email: "nonexistent@example.com",
      });

      expect(mockTokenCreate).not.toHaveBeenCalled();
    });

    it("does not send email when user does not exist", async () => {
      mockFindUnique.mockResolvedValue(null);

      await forgotPasswordAction({
        email: "nonexistent@example.com",
      });

      expect(mockSendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("returns success even on database error (prevents enumeration)", async () => {
      mockFindUnique.mockRejectedValue(new Error("Database connection failed"));

      const result = await forgotPasswordAction({
        email: "user@example.com",
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe(successMessage);
    });

    it("succeeds even if email sending fails", async () => {
      mockFindUnique.mockResolvedValue({
        id: "user-123",
        email: "user@example.com",
        name: "Test User",
      });
      mockDeleteMany.mockResolvedValue({ count: 0 });
      mockTokenCreate.mockResolvedValue({});
      mockSendPasswordResetEmail.mockRejectedValue(new Error("SMTP error"));

      const result = await forgotPasswordAction({
        email: "user@example.com",
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe(successMessage);
    });

    it("succeeds even if token creation fails", async () => {
      mockFindUnique.mockResolvedValue({
        id: "user-123",
        email: "user@example.com",
        name: "Test User",
      });
      mockDeleteMany.mockResolvedValue({ count: 0 });
      mockTokenCreate.mockRejectedValue(new Error("Token creation failed"));

      const result = await forgotPasswordAction({
        email: "user@example.com",
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe(successMessage);
    });
  });

  describe("edge cases", () => {
    it("handles email with uppercase letters", async () => {
      mockFindUnique.mockResolvedValue({
        id: "user-123",
        email: "User@Example.COM",
        name: "Test User",
      });
      mockDeleteMany.mockResolvedValue({ count: 0 });
      mockTokenCreate.mockResolvedValue({});

      const result = await forgotPasswordAction({
        email: "User@Example.COM",
      });

      expect(result.success).toBe(true);
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { email: "User@Example.COM" },
      });
    });

    it("handles email with plus sign", async () => {
      mockFindUnique.mockResolvedValue({
        id: "user-123",
        email: "user+test@example.com",
        name: "Test User",
      });
      mockDeleteMany.mockResolvedValue({ count: 0 });
      mockTokenCreate.mockResolvedValue({});

      const result = await forgotPasswordAction({
        email: "user+test@example.com",
      });

      expect(result.success).toBe(true);
    });

    it("handles multiple existing tokens for same user", async () => {
      mockFindUnique.mockResolvedValue({
        id: "user-123",
        email: "user@example.com",
        name: "Test User",
      });
      mockDeleteMany.mockResolvedValue({ count: 3 }); // Multiple existing tokens
      mockTokenCreate.mockResolvedValue({});

      const result = await forgotPasswordAction({
        email: "user@example.com",
      });

      expect(result.success).toBe(true);
      expect(mockDeleteMany).toHaveBeenCalled();
    });
  });
});
