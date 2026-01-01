/**
 * Tests for lazy QR code loading
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

describe("lazy-qrcode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset module cache between tests
    vi.resetModules();
  });

  describe("generateQRCodeLazy", () => {
    it("loads qrcode module and generates QR code", async () => {
      // Mock qrcode module
      vi.doMock("qrcode", () => ({
        default: {
          toDataURL: vi.fn().mockResolvedValue("data:image/png;base64,mock"),
        },
      }));

      const { generateQRCodeLazy } = await import("@/lib/two-factor/lazy-qrcode");

      const result = await generateQRCodeLazy("otpauth://totp/test");

      expect(result).toBe("data:image/png;base64,mock");
    });

    it("handles errors gracefully", async () => {
      // Mock qrcode module with error
      vi.doMock("qrcode", () => ({
        default: {
          toDataURL: vi.fn().mockRejectedValue(new Error("QR generation failed")),
        },
      }));

      const { generateQRCodeLazy } = await import("@/lib/two-factor/lazy-qrcode");

      await expect(
        generateQRCodeLazy("invalid")
      ).rejects.toThrow("QR generation failed");
    });
  });
});
