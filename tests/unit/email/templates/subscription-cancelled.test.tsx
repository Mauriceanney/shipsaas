/**
 * TDD: RED PHASE - Tests for Subscription Cancelled email template
 * These tests are written BEFORE implementation
 */

import { describe, expect, it } from "vitest";
import { render } from "@react-email/render";
import { SubscriptionCancelledEmail } from "@/lib/email/templates/subscription-cancelled";

describe("SubscriptionCancelledEmail Template", () => {
  const defaultProps = {
    planName: "Pro Plan",
    endDate: "January 29, 2025",
    resubscribeUrl: "https://example.com/pricing",
    appName: "TestApp",
    appUrl: "https://example.com",
  };

  describe("rendering", () => {
    it("renders without crashing", async () => {
      const html = await render(<SubscriptionCancelledEmail {...defaultProps} />);
      expect(html).toBeDefined();
      expect(html).toContain("<!DOCTYPE html");
    });

    it("includes app name in header", async () => {
      const html = await render(<SubscriptionCancelledEmail {...defaultProps} />);
      expect(html).toContain("TestApp");
    });

    it("includes user name when provided", async () => {
      const html = await render(
        <SubscriptionCancelledEmail {...defaultProps} name="Charlie" />
      );
      expect(html).toContain("Charlie");
    });
  });

  describe("cancellation details", () => {
    it("includes plan name", async () => {
      const html = await render(<SubscriptionCancelledEmail {...defaultProps} />);
      expect(html).toContain("Pro Plan");
    });

    it("includes end date of subscription", async () => {
      const html = await render(<SubscriptionCancelledEmail {...defaultProps} />);
      expect(html).toContain("January 29, 2025");
    });

    it("includes resubscribe URL", async () => {
      const html = await render(<SubscriptionCancelledEmail {...defaultProps} />);
      expect(html).toContain("https://example.com/pricing");
    });
  });

  describe("content", () => {
    it("includes cancellation message", async () => {
      const html = await render(<SubscriptionCancelledEmail {...defaultProps} />);
      expect(html).toContain("cancel");
    });

    it("includes resubscribe CTA button", async () => {
      const html = await render(<SubscriptionCancelledEmail {...defaultProps} />);
      // Check for resubscribe button text
      expect(html).toContain("Resubscribe");
    });
  });

  describe("plain text version", () => {
    it("renders plain text version with cancellation details", async () => {
      const text = await render(<SubscriptionCancelledEmail {...defaultProps} />, {
        plainText: true,
      });
      expect(text).toContain("Pro Plan");
      expect(text).toContain("January 29, 2025");
    });
  });
});
