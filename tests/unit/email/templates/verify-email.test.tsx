/**
 * Tests for Email Verification template
 */

import { describe, expect, it } from "vitest";
import { render } from "@react-email/render";
import { VerifyEmailTemplate } from "@/lib/email/templates/verify-email";

describe("VerifyEmailTemplate", () => {
  const defaultProps = {
    verificationUrl: "https://example.com/verify-email?token=abc123",
    expiresIn: "24 hours",
    appName: "TestApp",
    appUrl: "https://example.com",
  };

  describe("rendering", () => {
    it("renders without crashing", async () => {
      const html = await render(<VerifyEmailTemplate {...defaultProps} />);
      expect(html).toBeDefined();
      expect(html).toContain("<!DOCTYPE html");
    });

    it("includes verification URL in button", async () => {
      const html = await render(<VerifyEmailTemplate {...defaultProps} />);
      expect(html).toContain(
        "https://example.com/verify-email?token=abc123"
      );
    });

    it("includes verification URL as fallback text", async () => {
      const html = await render(<VerifyEmailTemplate {...defaultProps} />);
      expect(html).toContain("verify-email?token=abc123");
    });

    it("includes expiry information", async () => {
      const html = await render(<VerifyEmailTemplate {...defaultProps} />);
      expect(html).toContain("24 hours");
    });

    it("includes app name in header", async () => {
      const html = await render(<VerifyEmailTemplate {...defaultProps} />);
      expect(html).toContain("TestApp");
    });

    it("includes user name when provided", async () => {
      const html = await render(
        <VerifyEmailTemplate {...defaultProps} name="Jane" />
      );
      expect(html).toContain("Jane");
    });
  });

  describe("content", () => {
    it("includes verify email call to action", async () => {
      const html = await render(<VerifyEmailTemplate {...defaultProps} />);
      expect(html).toContain("Verify");
    });

    it("includes instruction text", async () => {
      const html = await render(<VerifyEmailTemplate {...defaultProps} />);
      expect(html).toContain("verify your email");
    });

    it("includes fallback link instructions", async () => {
      const html = await render(<VerifyEmailTemplate {...defaultProps} />);
      expect(html).toContain("copy and paste");
    });
  });

  describe("plain text version", () => {
    it("renders plain text version with verification URL", async () => {
      const text = await render(<VerifyEmailTemplate {...defaultProps} />, {
        plainText: true,
      });
      expect(text).toContain(
        "https://example.com/verify-email?token=abc123"
      );
      expect(text).toContain("24 hours");
    });
  });
});
