import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted to properly hoist the mock functions
const {
  mockSignIn,
  mockFindUnique,
  mockUpdate,
  mockCreateTrustedDevice,
  mockVerifyTOTP,
  mockVerifyBackupCode,
  mockGenerateDeviceToken,
  mockHashDeviceToken,
  mockGetTrustedDeviceExpiry,
  mockParseDeviceName,
  mockRateLimitTwoFactor,
  mockGetClientIpFromHeaders,
  mockCookiesSet,
  mockHeadersGet,
} = vi.hoisted(() => ({
  mockSignIn: vi.fn(),
  mockFindUnique: vi.fn(),
  mockUpdate: vi.fn(),
  mockCreateTrustedDevice: vi.fn(),
  mockVerifyTOTP: vi.fn(),
  mockVerifyBackupCode: vi.fn(),
  mockGenerateDeviceToken: vi.fn(),
  mockHashDeviceToken: vi.fn(),
  mockGetTrustedDeviceExpiry: vi.fn(),
  mockParseDeviceName: vi.fn(),
  mockRateLimitTwoFactor: vi.fn(),
  mockGetClientIpFromHeaders: vi.fn(),
  mockCookiesSet: vi.fn(),
  mockHeadersGet: vi.fn(),
}));

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    set: mockCookiesSet,
  })),
  headers: vi.fn(() => ({
    get: mockHeadersGet,
  })),
}));

// Mock the auth module
vi.mock("@/lib/auth", () => ({
  signIn: mockSignIn,
}));

// Mock database
vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
    trustedDevice: {
      create: mockCreateTrustedDevice,
    },
  },
}));

// Mock rate limiting
vi.mock("@/lib/rate-limit", () => ({
  rateLimiters: {
    twoFactor: mockRateLimitTwoFactor,
  },
  getClientIpFromHeaders: mockGetClientIpFromHeaders,
}));

// Mock two-factor library
vi.mock("@/lib/two-factor", () => ({
  verifyTOTP: mockVerifyTOTP,
  verifyBackupCode: mockVerifyBackupCode,
  generateDeviceToken: mockGenerateDeviceToken,
  hashDeviceToken: mockHashDeviceToken,
  getTrustedDeviceExpiry: mockGetTrustedDeviceExpiry,
  parseDeviceName: mockParseDeviceName,
  TRUSTED_DEVICE_DURATION_DAYS: 30,
  TRUSTED_DEVICE_COOKIE: "trusted_device",
}));

import { verifyTwoFactorAction } from "@/actions/auth/two-factor/verify";

describe("verifyTwoFactorAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetClientIpFromHeaders.mockResolvedValue("127.0.0.1");
    mockRateLimitTwoFactor.mockResolvedValue({ success: true });
    mockHeadersGet.mockReturnValue("Mozilla/5.0 Chrome");
  });

  describe("rate limiting", () => {
    it("returns error when rate limited", async () => {
      mockRateLimitTwoFactor.mockResolvedValue({ success: false });

      const result = await verifyTwoFactorAction({
        code: "123456",
        userId: "user-1",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Too many verification attempts. Please try again later.");
      }
    });
  });

  describe("validation", () => {
    it("returns error for empty code", async () => {
      const result = await verifyTwoFactorAction({
        code: "",
        userId: "user-1",
      });

      expect(result.success).toBe(false);
    });

    it("returns error for empty userId", async () => {
      const result = await verifyTwoFactorAction({
        code: "123456",
        userId: "",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("user validation", () => {
    it("returns error when user not found", async () => {
      mockFindUnique.mockResolvedValue(null);

      const result = await verifyTwoFactorAction({
        code: "123456",
        userId: "user-1",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("User not found");
      }
    });

    it("returns error when 2FA is not enabled", async () => {
      mockFindUnique.mockResolvedValue({
        id: "user-1",
        twoFactorEnabled: false,
        twoFactorSecret: "SECRET",
        twoFactorBackupCodes: [],
      });

      const result = await verifyTwoFactorAction({
        code: "123456",
        userId: "user-1",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Two-factor authentication is not enabled");
      }
    });

    it("returns error when 2FA secret is missing", async () => {
      mockFindUnique.mockResolvedValue({
        id: "user-1",
        twoFactorEnabled: true,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      });

      const result = await verifyTwoFactorAction({
        code: "123456",
        userId: "user-1",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Two-factor authentication is not enabled");
      }
    });
  });

  describe("TOTP verification", () => {
    it("verifies valid TOTP code", async () => {
      mockFindUnique.mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        twoFactorEnabled: true,
        twoFactorSecret: "SECRET",
        twoFactorBackupCodes: [],
      });
      mockVerifyTOTP.mockReturnValue(true);
      mockSignIn.mockResolvedValue(undefined);

      const result = await verifyTwoFactorAction({
        code: "123456",
        userId: "user-1",
      });

      expect(result.success).toBe(true);
      expect(mockVerifyTOTP).toHaveBeenCalledWith("123456", "SECRET");
    });

    it("returns error for invalid TOTP code", async () => {
      mockFindUnique.mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        twoFactorEnabled: true,
        twoFactorSecret: "SECRET",
        twoFactorBackupCodes: [],
      });
      mockVerifyTOTP.mockReturnValue(false);

      const result = await verifyTwoFactorAction({
        code: "000000",
        userId: "user-1",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid verification code");
      }
    });
  });

  describe("backup code verification", () => {
    it("verifies valid backup code", async () => {
      mockFindUnique.mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        twoFactorEnabled: true,
        twoFactorSecret: "SECRET",
        twoFactorBackupCodes: ["$hash1", "$hash2"],
      });
      mockVerifyTOTP.mockReturnValue(false);
      mockVerifyBackupCode.mockResolvedValue(0);
      mockUpdate.mockResolvedValue({});
      mockSignIn.mockResolvedValue(undefined);

      const result = await verifyTwoFactorAction({
        code: "ABCD1234",
        userId: "user-1",
      });

      expect(result.success).toBe(true);
      expect(mockVerifyBackupCode).toHaveBeenCalledWith("ABCD1234", ["$hash1", "$hash2"]);
    });

    it("removes used backup code from database", async () => {
      mockFindUnique.mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        twoFactorEnabled: true,
        twoFactorSecret: "SECRET",
        twoFactorBackupCodes: ["$hash1", "$hash2", "$hash3"],
      });
      mockVerifyTOTP.mockReturnValue(false);
      mockVerifyBackupCode.mockResolvedValue(1); // Second code used
      mockUpdate.mockResolvedValue({});
      mockSignIn.mockResolvedValue(undefined);

      await verifyTwoFactorAction({
        code: "BACKUP12",
        userId: "user-1",
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { twoFactorBackupCodes: ["$hash1", "$hash3"] },
      });
    });

    it("returns error for invalid backup code", async () => {
      mockFindUnique.mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        twoFactorEnabled: true,
        twoFactorSecret: "SECRET",
        twoFactorBackupCodes: ["$hash1"],
      });
      mockVerifyTOTP.mockReturnValue(false);
      mockVerifyBackupCode.mockResolvedValue(-1);

      const result = await verifyTwoFactorAction({
        code: "INVALID1",
        userId: "user-1",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid verification code");
      }
    });
  });

  describe("trusted device", () => {
    it("creates trusted device when rememberDevice is true", async () => {
      mockFindUnique.mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        twoFactorEnabled: true,
        twoFactorSecret: "SECRET",
        twoFactorBackupCodes: [],
      });
      mockVerifyTOTP.mockReturnValue(true);
      mockGenerateDeviceToken.mockReturnValue("device-token");
      mockHashDeviceToken.mockResolvedValue("hashed-token");
      mockGetTrustedDeviceExpiry.mockReturnValue(new Date("2025-01-30"));
      mockParseDeviceName.mockReturnValue("Chrome on macOS");
      mockCreateTrustedDevice.mockResolvedValue({});
      mockSignIn.mockResolvedValue(undefined);

      const result = await verifyTwoFactorAction({
        code: "123456",
        userId: "user-1",
        rememberDevice: true,
      });

      expect(result.success).toBe(true);
      expect(mockCreateTrustedDevice).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          tokenHash: "hashed-token",
          deviceName: "Chrome on macOS",
          expiresAt: new Date("2025-01-30"),
        },
      });
    });

    it("does not create trusted device when rememberDevice is false", async () => {
      mockFindUnique.mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        twoFactorEnabled: true,
        twoFactorSecret: "SECRET",
        twoFactorBackupCodes: [],
      });
      mockVerifyTOTP.mockReturnValue(true);
      mockSignIn.mockResolvedValue(undefined);

      await verifyTwoFactorAction({
        code: "123456",
        userId: "user-1",
        rememberDevice: false,
      });

      expect(mockCreateTrustedDevice).not.toHaveBeenCalled();
    });
  });

  describe("session creation", () => {
    it("signs in with two-factor provider on success", async () => {
      mockFindUnique.mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        twoFactorEnabled: true,
        twoFactorSecret: "SECRET",
        twoFactorBackupCodes: [],
      });
      mockVerifyTOTP.mockReturnValue(true);
      mockSignIn.mockResolvedValue(undefined);

      await verifyTwoFactorAction({
        code: "123456",
        userId: "user-1",
      });

      expect(mockSignIn).toHaveBeenCalledWith("two-factor", {
        userId: "user-1",
        redirect: false,
      });
    });
  });

  describe("error handling", () => {
    it("handles database errors gracefully", async () => {
      mockFindUnique.mockRejectedValue(new Error("DB Error"));

      const result = await verifyTwoFactorAction({
        code: "123456",
        userId: "user-1",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Verification failed");
      }
    });

    it("handles signIn errors gracefully", async () => {
      mockFindUnique.mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        twoFactorEnabled: true,
        twoFactorSecret: "SECRET",
        twoFactorBackupCodes: [],
      });
      mockVerifyTOTP.mockReturnValue(true);
      mockSignIn.mockRejectedValue(new Error("SignIn error"));

      const result = await verifyTwoFactorAction({
        code: "123456",
        userId: "user-1",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Verification failed");
      }
    });
  });
});
