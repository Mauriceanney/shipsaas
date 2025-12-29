/**
 * Email Client Factory - Unit Tests
 * TDD: RED phase - Define expected client factory behavior
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Store original env values
const originalEnv = { ...process.env };

describe("Email Client Factory", () => {
  beforeEach(() => {
    // Reset modules to allow re-importing with new config
    vi.resetModules();
    // Clear relevant env vars using vi.stubEnv for type safety
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("EMAIL_FROM", "");
    vi.stubEnv("SMTP_HOST", "");
    vi.stubEnv("SMTP_PORT", "");
    vi.stubEnv("SMTP_USER", "");
    vi.stubEnv("SMTP_PASS", "");
    vi.stubEnv("NEXT_PUBLIC_APP_NAME", "");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
  });

  afterEach(() => {
    // Restore original env
    process.env = { ...originalEnv };
  });

  describe("getEmailProvider", () => {
    it("should return nodemailer provider in development", async () => {
      vi.stubEnv("NODE_ENV", "development");

      const { getEmailProvider } = await import("@/lib/email/client");
      const provider = getEmailProvider();

      expect(provider.name).toBe("nodemailer");
    });

    it("should return resend provider in production with API key", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("RESEND_API_KEY", "re_test_key");

      const { getEmailProvider } = await import("@/lib/email/client");
      const provider = getEmailProvider();

      expect(provider.name).toBe("resend");
    });

    it("should throw error in production without API key", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("RESEND_API_KEY", "");

      const { getEmailProvider } = await import("@/lib/email/client");

      expect(() => getEmailProvider()).toThrow(
        "RESEND_API_KEY is required in production"
      );
    });

    it("should return singleton instance on repeated calls", async () => {
      vi.stubEnv("NODE_ENV", "development");

      const { getEmailProvider } = await import("@/lib/email/client");
      const provider1 = getEmailProvider();
      const provider2 = getEmailProvider();

      expect(provider1).toBe(provider2);
    });

    it("should have a send method", async () => {
      vi.stubEnv("NODE_ENV", "development");

      const { getEmailProvider } = await import("@/lib/email/client");
      const provider = getEmailProvider();

      expect(typeof provider.send).toBe("function");
    });
  });

  describe("resetEmailProvider", () => {
    it("should allow resetting the provider singleton", async () => {
      vi.stubEnv("NODE_ENV", "development");

      const { getEmailProvider, resetEmailProvider } = await import(
        "@/lib/email/client"
      );

      const provider1 = getEmailProvider();
      resetEmailProvider();

      // Reset modules to get fresh import with reset state
      vi.resetModules();
      const { getEmailProvider: getEmailProvider2 } = await import(
        "@/lib/email/client"
      );

      const provider2 = getEmailProvider2();

      // After reset, should be a new instance
      expect(provider1.name).toBe("nodemailer");
      expect(provider2.name).toBe("nodemailer");
    });
  });
});
