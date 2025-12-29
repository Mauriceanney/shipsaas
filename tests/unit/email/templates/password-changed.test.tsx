/**
 * Tests for Password Changed notification email template
 */

import { describe, expect, it } from "vitest";
import { render } from "@react-email/render";
import { PasswordChangedEmail } from "@/lib/email/templates/password-changed";

describe("PasswordChangedEmail Template", () => {
  const defaultProps = {
    supportEmail: "support@example.com",
    appName: "TestApp",
    appUrl: "https://example.com",
  };

  describe("rendering", () => {
    it("renders without crashing", async () => {
      const html = await render(<PasswordChangedEmail {...defaultProps} />);
      expect(html).toBeDefined();
      expect(html).toContain("<!DOCTYPE html");
    });

    it("includes app name in header", async () => {
      const html = await render(<PasswordChangedEmail {...defaultProps} />);
      expect(html).toContain("TestApp");
    });

    it("includes user name when provided", async () => {
      const html = await render(
        <PasswordChangedEmail {...defaultProps} name="Alice" />
      );
      expect(html).toContain("Alice");
    });

    it("includes support email", async () => {
      const html = await render(<PasswordChangedEmail {...defaultProps} />);
      expect(html).toContain("support@example.com");
    });
  });

  describe("content", () => {
    it("includes password changed confirmation", async () => {
      const html = await render(<PasswordChangedEmail {...defaultProps} />);
      expect(html).toContain("password");
      expect(html).toContain("changed");
    });

    it("includes security warning", async () => {
      const html = await render(<PasswordChangedEmail {...defaultProps} />);
      expect(html).toContain("did not make this change");
    });

    it("includes contact support instruction", async () => {
      const html = await render(<PasswordChangedEmail {...defaultProps} />);
      expect(html).toContain("contact");
    });
  });

  describe("plain text version", () => {
    it("renders plain text version with security notice", async () => {
      const text = await render(<PasswordChangedEmail {...defaultProps} />, {
        plainText: true,
      });
      expect(text).toContain("password");
      expect(text).toContain("support@example.com");
    });
  });
});
