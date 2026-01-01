import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted to properly hoist the mock functions
const { mockAuth, mockFindUnique, mockUpdate, mockGenerateTOTPSecret, mockGenerateTOTPUri, mockGenerateQRCode, mockRevalidatePath } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockFindUnique: vi.fn(),
  mockUpdate: vi.fn(),
  mockGenerateTOTPSecret: vi.fn(),
  mockGenerateTOTPUri: vi.fn(),
  mockGenerateQRCode: vi.fn(),
  mockRevalidatePath: vi.fn(),
}));

// Mock the auth module
vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

// Mock database
vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
  },
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

// Mock two-factor library
vi.mock("@/lib/two-factor", () => ({
  generateTOTPSecret: mockGenerateTOTPSecret,
  generateTOTPUri: mockGenerateTOTPUri,
  generateQRCode: mockGenerateQRCode,
}));

import { setupTwoFactorAction } from "@/actions/auth/two-factor/setup";

describe("setupTwoFactorAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("authentication", () => {
    it("returns error when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const result = await setupTwoFactorAction();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
      }
    });

    it("returns error when session has no user", async () => {
      mockAuth.mockResolvedValue({ user: null });

      const result = await setupTwoFactorAction();

      expect(result.success).toBe(false);
    });

    it("returns error when session has no user id", async () => {
      mockAuth.mockResolvedValue({ user: { email: "test@example.com" } });

      const result = await setupTwoFactorAction();

      expect(result.success).toBe(false);
    });
  });

  describe("user validation", () => {
    it("returns error when user not found", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", email: "test@example.com" },
      });
      mockFindUnique.mockResolvedValue(null);

      const result = await setupTwoFactorAction();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("User not found");
      }
    });

    it("returns error when 2FA is already enabled", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", email: "test@example.com" },
      });
      mockFindUnique.mockResolvedValue({
        twoFactorEnabled: true,
        email: "test@example.com",
      });

      const result = await setupTwoFactorAction();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Two-factor authentication is already enabled");
      }
    });
  });

  describe("success cases", () => {
    it("generates and returns secret, QR code, and manual entry", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", email: "test@example.com" },
      });
      mockFindUnique.mockResolvedValue({
        twoFactorEnabled: false,
        email: "test@example.com",
      });
      mockGenerateTOTPSecret.mockReturnValue("TESTSECRET123");
      mockGenerateTOTPUri.mockReturnValue("otpauth://totp/test");
      mockGenerateQRCode.mockResolvedValue("data:image/png;base64,QRCode");
      mockUpdate.mockResolvedValue({});

      const result = await setupTwoFactorAction();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.secret).toBe("TESTSECRET123");
        expect(result.qrCode).toBe("data:image/png;base64,QRCode");
        expect(result.manualEntry).toBe("TESTSECRET123");
      }
    });

    it("stores the secret in the database", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", email: "test@example.com" },
      });
      mockFindUnique.mockResolvedValue({
        twoFactorEnabled: false,
        email: "test@example.com",
      });
      mockGenerateTOTPSecret.mockReturnValue("TESTSECRET123");
      mockGenerateTOTPUri.mockReturnValue("otpauth://totp/test");
      mockGenerateQRCode.mockResolvedValue("data:image/png;base64,QRCode");
      mockUpdate.mockResolvedValue({});

      await setupTwoFactorAction();

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { twoFactorSecret: "TESTSECRET123" },
      });
    });

    it("calls generateTOTPUri with correct parameters", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", email: "test@example.com" },
      });
      mockFindUnique.mockResolvedValue({
        twoFactorEnabled: false,
        email: "user@domain.com",
      });
      mockGenerateTOTPSecret.mockReturnValue("SECRET");
      mockGenerateTOTPUri.mockReturnValue("otpauth://totp/test");
      mockGenerateQRCode.mockResolvedValue("data:image/png");
      mockUpdate.mockResolvedValue({});

      await setupTwoFactorAction();

      expect(mockGenerateTOTPUri).toHaveBeenCalledWith("user@domain.com", "SECRET");
    });
  });

  describe("error handling", () => {
    it("handles database errors gracefully", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", email: "test@example.com" },
      });
      mockFindUnique.mockRejectedValue(new Error("DB Error"));

      const result = await setupTwoFactorAction();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Failed to setup two-factor authentication");
      }
    });

    it("handles QR code generation errors", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", email: "test@example.com" },
      });
      mockFindUnique.mockResolvedValue({
        twoFactorEnabled: false,
        email: "test@example.com",
      });
      mockGenerateTOTPSecret.mockReturnValue("SECRET");
      mockGenerateTOTPUri.mockReturnValue("otpauth://totp/test");
      mockGenerateQRCode.mockRejectedValue(new Error("QR Error"));

      const result = await setupTwoFactorAction();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Failed to setup two-factor authentication");
      }
    });
  });
});
