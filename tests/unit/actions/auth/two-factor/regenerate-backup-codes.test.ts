import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies BEFORE imports
const {
  mockAuth,
  mockDb,
  mockVerifyTOTP,
  mockGenerateBackupCodes,
  mockFormatBackupCodes,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockDb: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
  mockVerifyTOTP: vi.fn(),
  mockGenerateBackupCodes: vi.fn(),
  mockFormatBackupCodes: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

vi.mock("@/lib/two-factor", () => ({
  verifyTOTP: mockVerifyTOTP,
  generateBackupCodes: mockGenerateBackupCodes,
  formatBackupCodes: mockFormatBackupCodes,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { regenerateBackupCodesAction } from "@/actions/auth/two-factor/regenerate-backup-codes";

describe("regenerateBackupCodesAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("authentication", () => {
    it("returns error when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const result = await regenerateBackupCodesAction({ code: "123456" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
      }
      expect(mockDb.user.findUnique).not.toHaveBeenCalled();
    });

    it("returns error when session has no user", async () => {
      mockAuth.mockResolvedValue({ user: null });

      const result = await regenerateBackupCodesAction({ code: "123456" });

      expect(result.success).toBe(false);
    });

    it("returns error when session has no user id", async () => {
      mockAuth.mockResolvedValue({ user: { email: "test@example.com" } });

      const result = await regenerateBackupCodesAction({ code: "123456" });

      expect(result.success).toBe(false);
    });
  });

  describe("validation", () => {
    it("returns error for empty code", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });

      const result = await regenerateBackupCodesAction({ code: "" });

      expect(result.success).toBe(false);
      expect(mockDb.user.findUnique).not.toHaveBeenCalled();
    });

    it("returns error for invalid code format", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });

      const result = await regenerateBackupCodesAction({ code: "12345" });

      expect(result.success).toBe(false);
    });

    it("returns error for code with invalid characters", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });

      const result = await regenerateBackupCodesAction({ code: "abcdef" });

      expect(result.success).toBe(false);
    });

    it("accepts valid 6-digit numeric code", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDb.user.findUnique.mockResolvedValue({
        twoFactorSecret: "secret",
        twoFactorEnabled: true,
      });
      mockVerifyTOTP.mockReturnValue(true);
      mockGenerateBackupCodes.mockResolvedValue({
        plainCodes: ["CODE1", "CODE2"],
        hashedCodes: ["hash1", "hash2"],
      });
      mockFormatBackupCodes.mockReturnValue(["CODE-1", "CODE-2"]);

      const result = await regenerateBackupCodesAction({ code: "123456" });

      expect(result.success).toBe(true);
    });

    it("returns error for code with spaces (validation fails)", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });

      const result = await regenerateBackupCodesAction({ code: " 123456 " });

      expect(result.success).toBe(false);
      // Schema requires exact length of 6, spaces make it fail
    });
  });

  describe("2FA verification", () => {
    it("returns error when user not found", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDb.user.findUnique.mockResolvedValue(null);

      const result = await regenerateBackupCodesAction({ code: "123456" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("User not found");
      }
    });

    it("returns error when 2FA not enabled", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDb.user.findUnique.mockResolvedValue({
        twoFactorSecret: "secret",
        twoFactorEnabled: false,
      });

      const result = await regenerateBackupCodesAction({ code: "123456" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Two-factor authentication is not enabled");
      }
    });

    it("returns error when 2FA secret missing", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDb.user.findUnique.mockResolvedValue({
        twoFactorSecret: null,
        twoFactorEnabled: true,
      });

      const result = await regenerateBackupCodesAction({ code: "123456" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Two-factor authentication is not enabled");
      }
    });

    it("returns error for invalid TOTP code", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDb.user.findUnique.mockResolvedValue({
        twoFactorSecret: "secret123",
        twoFactorEnabled: true,
      });
      mockVerifyTOTP.mockReturnValue(false);

      const result = await regenerateBackupCodesAction({ code: "999999" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid verification code");
      }
      expect(mockVerifyTOTP).toHaveBeenCalledWith("999999", "secret123");
    });

    it("verifies TOTP code with user's secret", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDb.user.findUnique.mockResolvedValue({
        twoFactorSecret: "user-secret",
        twoFactorEnabled: true,
      });
      mockVerifyTOTP.mockReturnValue(true);
      mockGenerateBackupCodes.mockResolvedValue({
        plainCodes: ["CODE1"],
        hashedCodes: ["hash1"],
      });
      mockFormatBackupCodes.mockReturnValue(["CODE-1"]);

      await regenerateBackupCodesAction({ code: "123456" });

      expect(mockVerifyTOTP).toHaveBeenCalledWith("123456", "user-secret");
    });
  });

  describe("success cases", () => {
    it("generates 10 new backup codes", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDb.user.findUnique.mockResolvedValue({
        twoFactorSecret: "secret",
        twoFactorEnabled: true,
      });
      mockVerifyTOTP.mockReturnValue(true);
      mockGenerateBackupCodes.mockResolvedValue({
        plainCodes: Array(10).fill("CODE"),
        hashedCodes: Array(10).fill("hash"),
      });
      mockFormatBackupCodes.mockReturnValue(Array(10).fill("CODE-CODE"));

      await regenerateBackupCodesAction({ code: "123456" });

      expect(mockGenerateBackupCodes).toHaveBeenCalledWith(10);
    });

    it("updates user with new hashed backup codes", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDb.user.findUnique.mockResolvedValue({
        twoFactorSecret: "secret",
        twoFactorEnabled: true,
      });
      mockVerifyTOTP.mockReturnValue(true);
      const hashedCodes = ["hash1", "hash2", "hash3"];
      mockGenerateBackupCodes.mockResolvedValue({
        plainCodes: ["CODE1", "CODE2", "CODE3"],
        hashedCodes,
      });
      mockFormatBackupCodes.mockReturnValue(["CODE-1", "CODE-2", "CODE-3"]);

      await regenerateBackupCodesAction({ code: "123456" });

      expect(mockDb.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { twoFactorBackupCodes: hashedCodes },
      });
    });

    it("returns formatted backup codes", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDb.user.findUnique.mockResolvedValue({
        twoFactorSecret: "secret",
        twoFactorEnabled: true,
      });
      mockVerifyTOTP.mockReturnValue(true);
      const plainCodes = ["ABCD1234", "EFGH5678"];
      const formattedCodes = ["ABCD-1234", "EFGH-5678"];
      mockGenerateBackupCodes.mockResolvedValue({
        plainCodes,
        hashedCodes: ["hash1", "hash2"],
      });
      mockFormatBackupCodes.mockReturnValue(formattedCodes);

      const result = await regenerateBackupCodesAction({ code: "123456" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.backupCodes).toEqual(formattedCodes);
      }
      expect(mockFormatBackupCodes).toHaveBeenCalledWith(plainCodes);
    });

    it("revalidates security settings page", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDb.user.findUnique.mockResolvedValue({
        twoFactorSecret: "secret",
        twoFactorEnabled: true,
      });
      mockVerifyTOTP.mockReturnValue(true);
      mockGenerateBackupCodes.mockResolvedValue({
        plainCodes: ["CODE1"],
        hashedCodes: ["hash1"],
      });
      mockFormatBackupCodes.mockReturnValue(["CODE-1"]);

      const { revalidatePath } = await import("next/cache");
      
      await regenerateBackupCodesAction({ code: "123456" });

      expect(revalidatePath).toHaveBeenCalledWith("/dashboard/security");
    });
  });

  describe("error handling", () => {
    it("handles database errors gracefully", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDb.user.findUnique.mockRejectedValue(new Error("Database error"));

      const result = await regenerateBackupCodesAction({ code: "123456" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Failed to regenerate backup codes");
      }
    });

    it("handles backup code generation errors", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDb.user.findUnique.mockResolvedValue({
        twoFactorSecret: "secret",
        twoFactorEnabled: true,
      });
      mockVerifyTOTP.mockReturnValue(true);
      mockGenerateBackupCodes.mockRejectedValue(new Error("Crypto error"));

      const result = await regenerateBackupCodesAction({ code: "123456" });

      expect(result.success).toBe(false);
    });

    it("handles database update errors", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDb.user.findUnique.mockResolvedValue({
        twoFactorSecret: "secret",
        twoFactorEnabled: true,
      });
      mockVerifyTOTP.mockReturnValue(true);
      mockGenerateBackupCodes.mockResolvedValue({
        plainCodes: ["CODE1"],
        hashedCodes: ["hash1"],
      });
      mockDb.user.update.mockRejectedValue(new Error("Update error"));

      const result = await regenerateBackupCodesAction({ code: "123456" });

      expect(result.success).toBe(false);
    });

    it("logs errors to console", async () => {
      const consoleError = vi.spyOn(console, "error");
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDb.user.findUnique.mockRejectedValue(new Error("Test error"));

      await regenerateBackupCodesAction({ code: "123456" });

      expect(consoleError).toHaveBeenCalledWith(
        "Backup code regeneration error:",
        expect.any(Error)
      );
    });
  });

  describe("security", () => {
    it("requires valid TOTP before regenerating codes", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDb.user.findUnique.mockResolvedValue({
        twoFactorSecret: "secret",
        twoFactorEnabled: true,
      });
      mockVerifyTOTP.mockReturnValue(false);

      const result = await regenerateBackupCodesAction({ code: "000000" });

      expect(result.success).toBe(false);
      expect(mockGenerateBackupCodes).not.toHaveBeenCalled();
      expect(mockDb.user.update).not.toHaveBeenCalled();
    });

    it("invalidates all previous backup codes", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDb.user.findUnique.mockResolvedValue({
        twoFactorSecret: "secret",
        twoFactorEnabled: true,
      });
      mockVerifyTOTP.mockReturnValue(true);
      const newHashedCodes = ["new1", "new2"];
      mockGenerateBackupCodes.mockResolvedValue({
        plainCodes: ["CODE1", "CODE2"],
        hashedCodes: newHashedCodes,
      });
      mockFormatBackupCodes.mockReturnValue(["CODE-1", "CODE-2"]);

      await regenerateBackupCodesAction({ code: "123456" });

      // Verify the update replaces all old codes with new ones
      expect(mockDb.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { twoFactorBackupCodes: newHashedCodes },
      });
    });
  });
});
