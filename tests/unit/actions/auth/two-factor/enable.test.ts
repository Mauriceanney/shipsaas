import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted to properly hoist the mock functions
const { mockAuth, mockFindUnique, mockUpdate, mockVerifyTOTP, mockGenerateBackupCodes, mockFormatBackupCodes } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockFindUnique: vi.fn(),
  mockUpdate: vi.fn(),
  mockVerifyTOTP: vi.fn(),
  mockGenerateBackupCodes: vi.fn(),
  mockFormatBackupCodes: vi.fn(),
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

// Mock two-factor library
vi.mock("@/lib/two-factor", () => ({
  verifyTOTP: mockVerifyTOTP,
  generateBackupCodes: mockGenerateBackupCodes,
  formatBackupCodes: mockFormatBackupCodes,
}));

import { enableTwoFactorAction } from "@/actions/auth/two-factor/enable";

describe("enableTwoFactorAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("authentication", () => {
    it("returns error when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const result = await enableTwoFactorAction({ code: "123456" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
      }
    });

    it("returns error when session has no user id", async () => {
      mockAuth.mockResolvedValue({ user: {} });

      const result = await enableTwoFactorAction({ code: "123456" });

      expect(result.success).toBe(false);
    });
  });

  describe("validation", () => {
    it("returns error for empty code", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1" },
      });

      const result = await enableTwoFactorAction({ code: "" });

      expect(result.success).toBe(false);
    });

    it("returns error for code that is too short", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1" },
      });

      const result = await enableTwoFactorAction({ code: "123" });

      expect(result.success).toBe(false);
    });
  });

  describe("user validation", () => {
    it("returns error when user not found", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1" },
      });
      mockFindUnique.mockResolvedValue(null);

      const result = await enableTwoFactorAction({ code: "123456" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("User not found");
      }
    });

    it("returns error when 2FA is already enabled", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1" },
      });
      mockFindUnique.mockResolvedValue({
        twoFactorEnabled: true,
        twoFactorSecret: "SECRET",
      });

      const result = await enableTwoFactorAction({ code: "123456" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Two-factor authentication is already enabled");
      }
    });

    it("returns error when no 2FA secret exists", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1" },
      });
      mockFindUnique.mockResolvedValue({
        twoFactorEnabled: false,
        twoFactorSecret: null,
      });

      const result = await enableTwoFactorAction({ code: "123456" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Please start 2FA setup first");
      }
    });
  });

  describe("code verification", () => {
    it("returns error for invalid TOTP code", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1" },
      });
      mockFindUnique.mockResolvedValue({
        twoFactorEnabled: false,
        twoFactorSecret: "SECRET",
      });
      mockVerifyTOTP.mockReturnValue(false);

      const result = await enableTwoFactorAction({ code: "000000" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid verification code");
      }
    });
  });

  describe("success cases", () => {
    it("enables 2FA and returns backup codes", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1" },
      });
      mockFindUnique.mockResolvedValue({
        twoFactorEnabled: false,
        twoFactorSecret: "SECRET",
      });
      mockVerifyTOTP.mockReturnValue(true);
      mockGenerateBackupCodes.mockResolvedValue({
        plainCodes: ["ABCD1234", "EFGH5678"],
        hashedCodes: ["$2a$hash1", "$2a$hash2"],
      });
      mockFormatBackupCodes.mockReturnValue(["ABCD-1234", "EFGH-5678"]);
      mockUpdate.mockResolvedValue({});

      const result = await enableTwoFactorAction({ code: "123456" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.backupCodes).toEqual(["ABCD-1234", "EFGH-5678"]);
      }
    });

    it("updates user with 2FA enabled and backup codes", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1" },
      });
      mockFindUnique.mockResolvedValue({
        twoFactorEnabled: false,
        twoFactorSecret: "SECRET",
      });
      mockVerifyTOTP.mockReturnValue(true);
      mockGenerateBackupCodes.mockResolvedValue({
        plainCodes: ["ABCD1234"],
        hashedCodes: ["$2a$hashedCode"],
      });
      mockFormatBackupCodes.mockReturnValue(["ABCD-1234"]);
      mockUpdate.mockResolvedValue({});

      await enableTwoFactorAction({ code: "123456" });

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: {
          twoFactorEnabled: true,
          twoFactorBackupCodes: ["$2a$hashedCode"],
        },
      });
    });

    it("generates 10 backup codes", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1" },
      });
      mockFindUnique.mockResolvedValue({
        twoFactorEnabled: false,
        twoFactorSecret: "SECRET",
      });
      mockVerifyTOTP.mockReturnValue(true);
      mockGenerateBackupCodes.mockResolvedValue({
        plainCodes: [],
        hashedCodes: [],
      });
      mockFormatBackupCodes.mockReturnValue([]);
      mockUpdate.mockResolvedValue({});

      await enableTwoFactorAction({ code: "123456" });

      expect(mockGenerateBackupCodes).toHaveBeenCalledWith(10);
    });
  });

  describe("error handling", () => {
    it("handles database errors gracefully", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1" },
      });
      mockFindUnique.mockRejectedValue(new Error("DB Error"));

      const result = await enableTwoFactorAction({ code: "123456" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Failed to enable two-factor authentication");
      }
    });

    it("handles backup code generation errors", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1" },
      });
      mockFindUnique.mockResolvedValue({
        twoFactorEnabled: false,
        twoFactorSecret: "SECRET",
      });
      mockVerifyTOTP.mockReturnValue(true);
      mockGenerateBackupCodes.mockRejectedValue(new Error("Generation error"));

      const result = await enableTwoFactorAction({ code: "123456" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Failed to enable two-factor authentication");
      }
    });
  });
});
