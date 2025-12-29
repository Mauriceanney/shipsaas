/**
 * Email Config - Unit Tests
 * TDD: RED phase - Define expected configuration behavior
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("Email Config", () => {
  // Store original env values
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset modules to allow re-importing with new env values
    vi.resetModules();
    // Clear relevant env vars using vi.stubEnv for type safety
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("EMAIL_FROM", "");
    vi.stubEnv("SMTP_HOST", "");
    vi.stubEnv("SMTP_PORT", "");
    vi.stubEnv("SMTP_SECURE", "");
    vi.stubEnv("SMTP_USER", "");
    vi.stubEnv("SMTP_PASS", "");
    vi.stubEnv("NEXT_PUBLIC_APP_NAME", "");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
  });

  afterEach(() => {
    // Restore original env
    process.env = { ...originalEnv };
  });

  describe("getEmailConfig", () => {
    it("should return nodemailer provider in development without RESEND_API_KEY", async () => {
      vi.stubEnv("NODE_ENV", "development");

      const { getEmailConfig } = await import("@/lib/email/config");
      const config = getEmailConfig();

      expect(config.provider).toBe("nodemailer");
    });

    it("should return nodemailer provider in test environment", async () => {
      vi.stubEnv("NODE_ENV", "test");

      const { getEmailConfig } = await import("@/lib/email/config");
      const config = getEmailConfig();

      expect(config.provider).toBe("nodemailer");
    });

    it("should return resend provider in production with RESEND_API_KEY", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("RESEND_API_KEY", "re_test_key");

      const { getEmailConfig } = await import("@/lib/email/config");
      const config = getEmailConfig();

      expect(config.provider).toBe("resend");
      expect(config.resend?.apiKey).toBe("re_test_key");
    });

    it("should throw error in production without RESEND_API_KEY", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("RESEND_API_KEY", "");

      const { getEmailConfig } = await import("@/lib/email/config");

      expect(() => getEmailConfig()).toThrow(
        "RESEND_API_KEY is required in production"
      );
    });

    it("should use default from address when EMAIL_FROM not set", async () => {
      const { getEmailConfig } = await import("@/lib/email/config");
      const config = getEmailConfig();

      expect(config.from).toBe("noreply@localhost");
    });

    it("should use EMAIL_FROM from environment", async () => {
      vi.stubEnv("EMAIL_FROM", "custom@example.com");

      const { getEmailConfig } = await import("@/lib/email/config");
      const config = getEmailConfig();

      expect(config.from).toBe("custom@example.com");
    });

    it("should use default app name when NEXT_PUBLIC_APP_NAME not set", async () => {
      const { getEmailConfig } = await import("@/lib/email/config");
      const config = getEmailConfig();

      expect(config.appName).toBe("SaaS Boilerplate");
    });

    it("should use NEXT_PUBLIC_APP_NAME from environment", async () => {
      vi.stubEnv("NEXT_PUBLIC_APP_NAME", "My Custom App");

      const { getEmailConfig } = await import("@/lib/email/config");
      const config = getEmailConfig();

      expect(config.appName).toBe("My Custom App");
    });

    it("should use default app URL when NEXT_PUBLIC_APP_URL not set", async () => {
      const { getEmailConfig } = await import("@/lib/email/config");
      const config = getEmailConfig();

      expect(config.appUrl).toBe("http://localhost:3000");
    });

    it("should use NEXT_PUBLIC_APP_URL from environment", async () => {
      vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://myapp.com");

      const { getEmailConfig } = await import("@/lib/email/config");
      const config = getEmailConfig();

      expect(config.appUrl).toBe("https://myapp.com");
    });
  });

  describe("SMTP configuration", () => {
    it("should use default SMTP host and port with secure false", async () => {
      const { getEmailConfig } = await import("@/lib/email/config");
      const config = getEmailConfig();

      expect(config.smtp?.host).toBe("localhost");
      expect(config.smtp?.port).toBe(1025);
      expect(config.smtp?.secure).toBe(false);
    });

    it("should use SMTP_SECURE environment variable when set to true", async () => {
      vi.stubEnv("SMTP_SECURE", "true");

      const { getEmailConfig } = await import("@/lib/email/config");
      const config = getEmailConfig();

      expect(config.smtp?.secure).toBe(true);
    });

    it("should use custom SMTP host and port from environment", async () => {
      vi.stubEnv("SMTP_HOST", "smtp.example.com");
      vi.stubEnv("SMTP_PORT", "587");

      const { getEmailConfig } = await import("@/lib/email/config");
      const config = getEmailConfig();

      expect(config.smtp?.host).toBe("smtp.example.com");
      expect(config.smtp?.port).toBe(587);
    });

    it("should include SMTP auth when credentials provided", async () => {
      vi.stubEnv("SMTP_USER", "smtp_user");
      vi.stubEnv("SMTP_PASS", "smtp_password");

      const { getEmailConfig } = await import("@/lib/email/config");
      const config = getEmailConfig();

      expect(config.smtp?.auth).toBeDefined();
      expect(config.smtp?.auth?.user).toBe("smtp_user");
      expect(config.smtp?.auth?.pass).toBe("smtp_password");
    });

    it("should not include SMTP auth when only user is provided", async () => {
      vi.stubEnv("SMTP_USER", "smtp_user");
      vi.stubEnv("SMTP_PASS", "");

      const { getEmailConfig } = await import("@/lib/email/config");
      const config = getEmailConfig();

      expect(config.smtp?.auth).toBeUndefined();
    });

    it("should not include SMTP auth when only password is provided", async () => {
      vi.stubEnv("SMTP_USER", "");
      vi.stubEnv("SMTP_PASS", "smtp_password");

      const { getEmailConfig } = await import("@/lib/email/config");
      const config = getEmailConfig();

      expect(config.smtp?.auth).toBeUndefined();
    });
  });

  describe("EMAIL_CONSTANTS", () => {
    it("should export verification expiry constant", async () => {
      const { EMAIL_CONSTANTS } = await import("@/lib/email/config");

      expect(EMAIL_CONSTANTS.VERIFICATION_EXPIRY).toBe("24 hours");
    });

    it("should export password reset expiry constant", async () => {
      const { EMAIL_CONSTANTS } = await import("@/lib/email/config");

      expect(EMAIL_CONSTANTS.PASSWORD_RESET_EXPIRY).toBe("1 hour");
    });

    it("should export max retries constant", async () => {
      const { EMAIL_CONSTANTS } = await import("@/lib/email/config");

      expect(EMAIL_CONSTANTS.MAX_RETRIES).toBe(3);
    });

    it("should export retry delay constant", async () => {
      const { EMAIL_CONSTANTS } = await import("@/lib/email/config");

      expect(EMAIL_CONSTANTS.RETRY_DELAY_MS).toBe(1000);
    });
  });
});
