import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted to properly hoist the mock functions
const { mockAuth, mockFindUnique, mockUpdate, mockVerifyTOTP, mockVerifyBackupCode, mockRevalidatePath } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockFindUnique: vi.fn(),
  mockUpdate: vi.fn(),
  mockVerifyTOTP: vi.fn(),
  mockVerifyBackupCode: vi.fn(),
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
  verifyTOTP: mockVerifyTOTP,
  verifyBackupCode: mockVerifyBackupCode,
}));

import { disableTwoFactorAction } from "@/actions/auth/two-factor/disable";

describe("disableTwoFactorAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("authentication", () => {
    it("returns error when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const result = await disableTwoFactorAction({ code: "123456" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
      }
    });

    it("returns error when session has no user id", async () => {
      mockAuth.mockResolvedValue({ user: {} });

      const result = await disableTwoFactorAction({ code: "123456" });

      expect(result.success).toBe(false);
    });
  });

  describe("validation", () => {
    it("returns error for empty code", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1" },
      });

      const result = await disableTwoFactorAction({ code: "" });

      expect(result.success).toBe(false);
    });
  });

  describe("user validation", () => {
    it("returns error when user not found", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1" },
      });
      mockFindUnique.mockResolvedValue(null);

      const result = await disableTwoFactorAction({ code: "123456" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("User not found");
      }
    });

    it("returns error when 2FA is not enabled", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1" },
      });
      mockFindUnique.mockResolvedValue({
        twoFactorEnabled: false,
        twoFactorSecret: "SECRET",
        twoFactorBackupCodes: [],
      });

      const result = await disableTwoFactorAction({ code: "123456" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Two-factor authentication is not enabled");
      }
    });

    it("returns error when 2FA secret is missing", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1" },
      });
      mockFindUnique.mockResolvedValue({
        twoFactorEnabled: true,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      });

      const result = await disableTwoFactorAction({ code: "123456" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid 2FA configuration");
      }
    });
  });

  describe("TOTP verification", () => {
    it("disables 2FA with valid TOTP code", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1" },
      });
      mockFindUnique.mockResolvedValue({
        twoFactorEnabled: true,
        twoFactorSecret: "SECRET",
        twoFactorBackupCodes: [],
      });
      mockVerifyTOTP.mockReturnValue(true);
      mockUpdate.mockResolvedValue({});

      const result = await disableTwoFactorAction({ code: "123456" });

      expect(result.success).toBe(true);
      expect(mockVerifyTOTP).toHaveBeenCalledWith("123456", "SECRET");
    });

    it("returns error for invalid TOTP code", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1" },
      });
      mockFindUnique.mockResolvedValue({
        twoFactorEnabled: true,
        twoFactorSecret: "SECRET",
        twoFactorBackupCodes: [],
      });
      mockVerifyTOTP.mockReturnValue(false);

      const result = await disableTwoFactorAction({ code: "000000" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid verification code");
      }
    });
  });

  describe("backup code verification", () => {
    it("disables 2FA with valid backup code", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1" },
      });
      mockFindUnique.mockResolvedValue({
        twoFactorEnabled: true,
        twoFactorSecret: "SECRET",
        twoFactorBackupCodes: ["$hash1", "$hash2"],
      });
      mockVerifyTOTP.mockReturnValue(false);
      mockVerifyBackupCode.mockResolvedValue(0);
      mockUpdate.mockResolvedValue({});

      const result = await disableTwoFactorAction({ code: "ABCD1234" });

      expect(result.success).toBe(true);
      expect(mockVerifyBackupCode).toHaveBeenCalledWith("ABCD1234", ["$hash1", "$hash2"]);
    });

    it("returns error for invalid backup code", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1" },
      });
      mockFindUnique.mockResolvedValue({
        twoFactorEnabled: true,
        twoFactorSecret: "SECRET",
        twoFactorBackupCodes: ["$hash1"],
      });
      mockVerifyTOTP.mockReturnValue(false);
      mockVerifyBackupCode.mockResolvedValue(-1);

      const result = await disableTwoFactorAction({ code: "INVALID1" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid verification code");
      }
    });
  });

  describe("success cases", () => {
    it("clears 2FA data from user record", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1" },
      });
      mockFindUnique.mockResolvedValue({
        twoFactorEnabled: true,
        twoFactorSecret: "SECRET",
        twoFactorBackupCodes: ["$hash1"],
      });
      mockVerifyTOTP.mockReturnValue(true);
      mockUpdate.mockResolvedValue({});

      await disableTwoFactorAction({ code: "123456" });

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
          twoFactorBackupCodes: [],
        },
      });
    });
  });

  describe("error handling", () => {
    it("handles database errors gracefully", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1" },
      });
      mockFindUnique.mockRejectedValue(new Error("DB Error"));

      const result = await disableTwoFactorAction({ code: "123456" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Failed to disable two-factor authentication");
      }
    });

    it("handles update errors gracefully", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1" },
      });
      mockFindUnique.mockResolvedValue({
        twoFactorEnabled: true,
        twoFactorSecret: "SECRET",
        twoFactorBackupCodes: [],
      });
      mockVerifyTOTP.mockReturnValue(true);
      mockUpdate.mockRejectedValue(new Error("Update error"));

      const result = await disableTwoFactorAction({ code: "123456" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Failed to disable two-factor authentication");
      }
    });
  });
});
