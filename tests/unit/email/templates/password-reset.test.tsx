/**
 * Tests for Password Reset email template
 */

import { describe, expect, it } from "vitest";
import { render } from "@react-email/render";
import { PasswordResetEmail } from "@/lib/email/templates/password-reset";

describe("PasswordResetEmail Template", () => {
  const defaultProps = {
    resetUrl: "https://example.com/reset-password?token=xyz789",
    expiresIn: "1 hour",
    appName: "TestApp",
    appUrl: "https://example.com",
  };

  describe("rendering", () => {
    it("renders without crashing", async () => {
      const html = await render(<PasswordResetEmail {...defaultProps} />);
      expect(html).toBeDefined();
      expect(html).toContain("<!DOCTYPE html");
    });

    it("includes reset URL in button", async () => {
      const html = await render(<PasswordResetEmail {...defaultProps} />);
      expect(html).toContain(
        "https://example.com/reset-password?token=xyz789"
      );
    });

    it("includes reset URL as fallback text", async () => {
      const html = await render(<PasswordResetEmail {...defaultProps} />);
      expect(html).toContain("reset-password?token=xyz789");
    });

    it("includes expiry information", async () => {
      const html = await render(<PasswordResetEmail {...defaultProps} />);
      expect(html).toContain("1 hour");
    });

    it("includes app name in header", async () => {
      const html = await render(<PasswordResetEmail {...defaultProps} />);
      expect(html).toContain("TestApp");
    });

    it("includes user name when provided", async () => {
      const html = await render(
        <PasswordResetEmail {...defaultProps} name="Bob" />
      );
      expect(html).toContain("Bob");
    });
  });

  describe("content", () => {
    it("includes reset password call to action", async () => {
      const html = await render(<PasswordResetEmail {...defaultProps} />);
      expect(html).toContain("Reset");
    });

    it("includes password reset instruction text", async () => {
      const html = await render(<PasswordResetEmail {...defaultProps} />);
      expect(html).toContain("password");
    });

    it("includes security notice about not requesting reset", async () => {
      const html = await render(<PasswordResetEmail {...defaultProps} />);
      // HTML entities encode the apostrophe, so check for the phrase without it
      expect(html).toContain("you can safely ignore");
    });
  });

  describe("plain text version", () => {
    it("renders plain text version with reset URL", async () => {
      const text = await render(<PasswordResetEmail {...defaultProps} />, {
        plainText: true,
      });
      expect(text).toContain(
        "https://example.com/reset-password?token=xyz789"
      );
      expect(text).toContain("1 hour");
    });
  });
});
