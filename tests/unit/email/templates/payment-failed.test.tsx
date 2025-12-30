import { render } from "@react-email/render";
import { describe, it, expect } from "vitest";

import { PaymentFailedEmail } from "@/lib/email/templates/payment-failed";

describe("PaymentFailedEmail", () => {
  const defaultProps = {
    name: "John Doe",
    planName: "Pro",
    amount: "$19.00",
    failedDate: "December 30, 2025",
    updatePaymentUrl: "https://example.com/settings/billing",
  };

  describe("rendering", () => {
    it("renders with all props", async () => {
      const html = await render(<PaymentFailedEmail {...defaultProps} />);

      expect(html).toContain("John Doe");
      expect(html).toContain("Pro");
      expect(html).toContain("$19.00");
      expect(html).toContain("December 30, 2025");
      expect(html).toContain("https://example.com/settings/billing");
    });

    it("renders without optional name", async () => {
      const props = { ...defaultProps, name: undefined };
      const html = await render(<PaymentFailedEmail {...props} />);

      expect(html).toContain("Hi there,");
      expect(html).not.toContain("undefined");
    });

    it("renders with nextRetryDate when provided", async () => {
      const props = { ...defaultProps, nextRetryDate: "January 2, 2026" };
      const html = await render(<PaymentFailedEmail {...props} />);

      expect(html).toContain("January 2, 2026");
      expect(html).toContain("automatically retry");
    });

    it("renders without nextRetryDate gracefully", async () => {
      const html = await render(<PaymentFailedEmail {...defaultProps} />);

      expect(html).toContain("within the next few days");
    });

    it("includes update payment button with correct URL", async () => {
      const html = await render(<PaymentFailedEmail {...defaultProps} />);

      expect(html).toContain("Update Payment Method");
      expect(html).toContain("https://example.com/settings/billing");
    });

    it("includes payment failed heading", async () => {
      const html = await render(<PaymentFailedEmail {...defaultProps} />);

      expect(html).toContain("Payment Failed");
    });

    it("renders custom app name", async () => {
      const props = { ...defaultProps, appName: "MyApp" };
      const html = await render(<PaymentFailedEmail {...props} />);

      expect(html).toContain("MyApp");
    });
  });

  describe("content sections", () => {
    it("includes plan details box", async () => {
      const html = await render(<PaymentFailedEmail {...defaultProps} />);

      expect(html).toContain("Plan");
      expect(html).toContain("Amount");
      expect(html).toContain("Failed Date");
    });

    it("includes empathetic messaging", async () => {
      const html = await render(<PaymentFailedEmail {...defaultProps} />);

      // Should not be accusatory (HTML escapes apostrophe as &#x27;)
      expect(html).toContain("couldn&#x27;t process");
      expect(html).not.toContain("you failed");
    });

    it("includes support contact info", async () => {
      const html = await render(<PaymentFailedEmail {...defaultProps} />);

      expect(html).toContain("contact");
      expect(html).toContain("support");
    });
  });

  describe("preview text", () => {
    it("includes appropriate preview text", async () => {
      const html = await render(<PaymentFailedEmail {...defaultProps} />);

      // Preview text should mention payment issue
      expect(html).toContain("payment");
      expect(html).toContain("Pro");
    });
  });

  describe("edge cases", () => {
    it("handles long plan names", async () => {
      const props = { ...defaultProps, planName: "Enterprise Premium Plus" };
      const html = await render(<PaymentFailedEmail {...props} />);

      expect(html).toContain("Enterprise Premium Plus");
    });

    it("handles different currency formats", async () => {
      const props = { ...defaultProps, amount: "€19,00" };
      const html = await render(<PaymentFailedEmail {...props} />);

      expect(html).toContain("€19,00");
    });
  });
});
