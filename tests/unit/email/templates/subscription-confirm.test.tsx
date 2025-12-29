/**
 * Tests for Subscription Confirmation email template
 */

import { describe, expect, it } from "vitest";
import { render } from "@react-email/render";
import { SubscriptionConfirmEmail } from "@/lib/email/templates/subscription-confirm";

describe("SubscriptionConfirmEmail Template", () => {
  const defaultProps = {
    planName: "Pro Plan",
    amount: "$29.00",
    billingCycle: "monthly" as const,
    nextBillingDate: "January 29, 2025",
    manageUrl: "https://example.com/billing",
    appName: "TestApp",
    appUrl: "https://example.com",
  };

  describe("rendering", () => {
    it("renders without crashing", async () => {
      const html = await render(<SubscriptionConfirmEmail {...defaultProps} />);
      expect(html).toBeDefined();
      expect(html).toContain("<!DOCTYPE html");
    });

    it("includes app name in header", async () => {
      const html = await render(<SubscriptionConfirmEmail {...defaultProps} />);
      expect(html).toContain("TestApp");
    });

    it("includes user name when provided", async () => {
      const html = await render(
        <SubscriptionConfirmEmail {...defaultProps} name="Charlie" />
      );
      expect(html).toContain("Charlie");
    });
  });

  describe("subscription details", () => {
    it("includes plan name", async () => {
      const html = await render(<SubscriptionConfirmEmail {...defaultProps} />);
      expect(html).toContain("Pro Plan");
    });

    it("includes amount", async () => {
      const html = await render(<SubscriptionConfirmEmail {...defaultProps} />);
      expect(html).toContain("$29.00");
    });

    it("includes billing cycle", async () => {
      const html = await render(<SubscriptionConfirmEmail {...defaultProps} />);
      expect(html).toContain("Monthly");
    });

    it("includes yearly billing cycle", async () => {
      const html = await render(
        <SubscriptionConfirmEmail {...defaultProps} billingCycle="yearly" />
      );
      expect(html).toContain("Yearly");
    });

    it("includes next billing date", async () => {
      const html = await render(<SubscriptionConfirmEmail {...defaultProps} />);
      expect(html).toContain("January 29, 2025");
    });

    it("includes manage subscription URL", async () => {
      const html = await render(<SubscriptionConfirmEmail {...defaultProps} />);
      expect(html).toContain("https://example.com/billing");
    });
  });

  describe("content", () => {
    it("includes subscription confirmation message", async () => {
      const html = await render(<SubscriptionConfirmEmail {...defaultProps} />);
      expect(html).toContain("subscription");
    });

    it("includes thank you message", async () => {
      const html = await render(<SubscriptionConfirmEmail {...defaultProps} />);
      expect(html).toContain("Thank");
    });
  });

  describe("plain text version", () => {
    it("renders plain text version with subscription details", async () => {
      const text = await render(<SubscriptionConfirmEmail {...defaultProps} />, {
        plainText: true,
      });
      expect(text).toContain("Pro Plan");
      expect(text).toContain("$29.00");
      expect(text).toContain("Monthly");
    });
  });
});
