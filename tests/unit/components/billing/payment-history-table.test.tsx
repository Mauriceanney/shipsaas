/**
 * Tests for PaymentHistoryTable component
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import { PaymentHistoryTable } from "@/components/billing/payment-history-table";
import type { InvoiceData } from "@/actions/billing/get-invoices";

// Mock date formatting
vi.mock("date-fns", () => ({
  format: (date: Date | number, formatStr: string) => {
    if (formatStr === "MMM d, yyyy") {
      return "Jan 1, 2024";
    }
    return date.toString();
  },
}));

describe("PaymentHistoryTable", () => {
  const mockInvoices: InvoiceData[] = [
    {
      id: "in_1",
      number: "INV-001",
      amountPaid: 1999,
      currency: "usd",
      status: "paid",
      created: 1704067200,
      hostedInvoiceUrl: "https://invoice.stripe.com/1",
      invoicePdf: "https://invoice.stripe.com/1/pdf",
    },
    {
      id: "in_2",
      number: "INV-002",
      amountPaid: 9900,
      currency: "usd",
      status: "paid",
      created: 1706745600,
      hostedInvoiceUrl: "https://invoice.stripe.com/2",
      invoicePdf: "https://invoice.stripe.com/2/pdf",
    },
  ];

  describe("rendering", () => {
    it("renders table with invoice data", () => {
      render(<PaymentHistoryTable invoices={mockInvoices} />);

      expect(screen.getByText("Date")).toBeInTheDocument();
      expect(screen.getByText("Invoice")).toBeInTheDocument();
      expect(screen.getByText("Amount")).toBeInTheDocument();
      expect(screen.getByText("Status")).toBeInTheDocument();
      expect(screen.getByText("Actions")).toBeInTheDocument();
    });

    it("displays invoice numbers", () => {
      render(<PaymentHistoryTable invoices={mockInvoices} />);

      expect(screen.getByText("INV-001")).toBeInTheDocument();
      expect(screen.getByText("INV-002")).toBeInTheDocument();
    });

    it("displays formatted amounts", () => {
      render(<PaymentHistoryTable invoices={mockInvoices} />);

      // $19.99 and $99.00
      expect(screen.getByText("$19.99")).toBeInTheDocument();
      expect(screen.getByText("$99.00")).toBeInTheDocument();
    });

    it("displays status badges", () => {
      render(<PaymentHistoryTable invoices={mockInvoices} />);

      const paidBadges = screen.getAllByText("Paid");
      expect(paidBadges).toHaveLength(2);
    });

    it("renders view and download links", () => {
      render(<PaymentHistoryTable invoices={mockInvoices} />);

      const viewLinks = screen.getAllByText("View");
      const downloadLinks = screen.getAllByText("Download");

      expect(viewLinks).toHaveLength(2);
      expect(downloadLinks).toHaveLength(2);
    });
  });

  describe("empty state", () => {
    it("shows empty message when no invoices", () => {
      render(<PaymentHistoryTable invoices={[]} />);

      expect(screen.getByText(/no invoices/i)).toBeInTheDocument();
    });
  });

  describe("links", () => {
    it("opens view links in new tab", () => {
      render(<PaymentHistoryTable invoices={mockInvoices} />);

      const viewLinks = screen.getAllByText("View");
      const firstViewLink = viewLinks[0]?.closest("a");

      expect(firstViewLink).toHaveAttribute("href", "https://invoice.stripe.com/1");
      expect(firstViewLink).toHaveAttribute("target", "_blank");
      expect(firstViewLink).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("opens download links in new tab", () => {
      render(<PaymentHistoryTable invoices={mockInvoices} />);

      const downloadLinks = screen.getAllByText("Download");
      const firstDownloadLink = downloadLinks[0]?.closest("a");

      expect(firstDownloadLink).toHaveAttribute("href", "https://invoice.stripe.com/1/pdf");
      expect(firstDownloadLink).toHaveAttribute("target", "_blank");
      expect(firstDownloadLink).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  describe("null invoice numbers", () => {
    it("handles missing invoice numbers", () => {
      const invoicesWithNull: InvoiceData[] = [
        {
          ...mockInvoices[0]!,
          number: null,
        },
      ];

      render(<PaymentHistoryTable invoices={invoicesWithNull} />);

      expect(screen.getByText("—")).toBeInTheDocument();
    });
  });

  describe("different statuses", () => {
    it("displays different status badges", () => {
      const mixedInvoices: InvoiceData[] = [
        { ...mockInvoices[0]!, status: "paid" },
        { ...mockInvoices[1]!, status: "open", id: "in_3" },
      ];

      render(<PaymentHistoryTable invoices={mixedInvoices} />);

      expect(screen.getByText("Paid")).toBeInTheDocument();
      expect(screen.getByText("Open")).toBeInTheDocument();
    });
  });
});
