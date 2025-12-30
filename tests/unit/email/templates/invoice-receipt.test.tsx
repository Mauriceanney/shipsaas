import { render } from "@react-email/render";
import { describe, it, expect } from "vitest";

import { InvoiceReceiptEmail } from "@/lib/email/templates/invoice-receipt";

describe("InvoiceReceiptEmail", () => {
  const defaultProps = {
    name: "John Doe",
    planName: "Pro",
    amount: "$19.00",
    invoiceDate: "December 30, 2025",
    invoiceNumber: "INV-0001",
    invoiceUrl: "https://invoice.stripe.com/i/acct_123/test_456",
  };

  describe("rendering", () => {
    it("renders with all props", async () => {
      const html = await render(<InvoiceReceiptEmail {...defaultProps} />);

      expect(html).toContain("John Doe");
      expect(html).toContain("Pro");
      expect(html).toContain("$19.00");
      expect(html).toContain("December 30, 2025");
      expect(html).toContain("INV-0001");
      expect(html).toContain("https://invoice.stripe.com/i/acct_123/test_456");
    });

    it("renders without optional name", async () => {
      const props = { ...defaultProps, name: undefined };
      const html = await render(<InvoiceReceiptEmail {...props} />);

      expect(html).toContain("Hi there,");
      expect(html).not.toContain("undefined");
    });

    it("renders with billing period when provided", async () => {
      const props = {
        ...defaultProps,
        billingPeriod: {
          start: "December 1, 2025",
          end: "December 31, 2025",
        },
      };
      const html = await render(<InvoiceReceiptEmail {...props} />);

      expect(html).toContain("December 1, 2025");
      expect(html).toContain("December 31, 2025");
    });

    it("renders without billing period gracefully", async () => {
      const html = await render(<InvoiceReceiptEmail {...defaultProps} />);

      // Should not have "Billing Period" label if not provided
      expect(html).not.toContain("undefined");
    });

    it("includes view invoice button with correct URL", async () => {
      const html = await render(<InvoiceReceiptEmail {...defaultProps} />);

      expect(html).toContain("View Invoice");
      expect(html).toContain("https://invoice.stripe.com/i/acct_123/test_456");
    });

    it("includes payment received heading", async () => {
      const html = await render(<InvoiceReceiptEmail {...defaultProps} />);

      expect(html).toContain("Payment Received");
    });

    it("renders custom app name", async () => {
      const props = { ...defaultProps, appName: "MyApp" };
      const html = await render(<InvoiceReceiptEmail {...props} />);

      expect(html).toContain("MyApp");
    });
  });

  describe("content sections", () => {
    it("includes invoice details box", async () => {
      const html = await render(<InvoiceReceiptEmail {...defaultProps} />);

      expect(html).toContain("Invoice");
      expect(html).toContain("Amount");
      expect(html).toContain("Date");
      expect(html).toContain("Plan");
    });

    it("includes thank you messaging", async () => {
      const html = await render(<InvoiceReceiptEmail {...defaultProps} />);

      expect(html).toContain("Thank you");
    });

    it("includes support contact info", async () => {
      const html = await render(<InvoiceReceiptEmail {...defaultProps} />);

      expect(html).toContain("contact");
      expect(html).toContain("support");
    });
  });

  describe("preview text", () => {
    it("includes appropriate preview text", async () => {
      const html = await render(<InvoiceReceiptEmail {...defaultProps} />);

      // Preview text should mention payment/receipt
      expect(html).toContain("payment");
      expect(html).toContain("$19.00");
    });
  });

  describe("edge cases", () => {
    it("handles long plan names", async () => {
      const props = { ...defaultProps, planName: "Enterprise Premium Plus" };
      const html = await render(<InvoiceReceiptEmail {...props} />);

      expect(html).toContain("Enterprise Premium Plus");
    });

    it("handles different currency formats", async () => {
      const props = { ...defaultProps, amount: "€19,00" };
      const html = await render(<InvoiceReceiptEmail {...props} />);

      expect(html).toContain("€19,00");
    });

    it("handles long invoice numbers", async () => {
      const props = { ...defaultProps, invoiceNumber: "INV-2025-12-30-001234" };
      const html = await render(<InvoiceReceiptEmail {...props} />);

      expect(html).toContain("INV-2025-12-30-001234");
    });
  });
});
