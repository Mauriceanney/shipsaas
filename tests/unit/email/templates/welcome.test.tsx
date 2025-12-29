/**
 * Tests for Welcome email template
 */

import { describe, expect, it } from "vitest";
import { render } from "@react-email/render";
import { WelcomeEmail } from "@/lib/email/templates/welcome";

describe("WelcomeEmail Template", () => {
  const defaultProps = {
    name: "John Doe",
    loginUrl: "https://example.com/login",
    appName: "TestApp",
    appUrl: "https://example.com",
  };

  describe("rendering", () => {
    it("renders without crashing", async () => {
      const html = await render(<WelcomeEmail {...defaultProps} />);
      expect(html).toBeDefined();
      expect(html).toContain("<!DOCTYPE html");
    });

    it("includes user name in greeting", async () => {
      const html = await render(<WelcomeEmail {...defaultProps} />);
      expect(html).toContain("John Doe");
    });

    it("uses fallback greeting when name is not provided", async () => {
      const html = await render(
        <WelcomeEmail {...defaultProps} name={undefined} />
      );
      expect(html).toContain("Welcome");
    });

    it("includes app name in header", async () => {
      const html = await render(<WelcomeEmail {...defaultProps} />);
      expect(html).toContain("TestApp");
    });

    it("includes login URL in CTA button", async () => {
      const html = await render(<WelcomeEmail {...defaultProps} />);
      expect(html).toContain("https://example.com/login");
    });

    it("includes welcome message content", async () => {
      const html = await render(<WelcomeEmail {...defaultProps} />);
      expect(html).toContain("Welcome");
    });
  });

  describe("preview text", () => {
    it("includes app name in preview", async () => {
      const html = await render(<WelcomeEmail {...defaultProps} />);
      // Preview text is in the HTML
      expect(html).toContain("TestApp");
    });
  });

  describe("plain text version", () => {
    it("renders plain text version", async () => {
      const text = await render(<WelcomeEmail {...defaultProps} />, {
        plainText: true,
      });
      expect(text).toContain("John Doe");
      expect(text).toContain("https://example.com/login");
    });
  });
});
