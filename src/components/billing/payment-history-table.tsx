"use client";

import { format } from "date-fns";
import { Download, ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { InvoiceData } from "@/actions/billing/get-invoices";

interface PaymentHistoryTableProps {
  invoices: InvoiceData[];
}

/**
 * Format amount from cents to dollars
 */
function formatAmount(cents: number, currency: string): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(dollars);
}

/**
 * Get badge variant for invoice status
 */
function getStatusVariant(
  status: string | null
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "paid":
      return "default";
    case "open":
      return "secondary";
    case "void":
    case "uncollectible":
      return "destructive";
    default:
      return "outline";
  }
}

/**
 * Capitalize first letter
 */
function capitalize(str: string | null): string {
  if (!str) return "—";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Payment history table component
 */
export function PaymentHistoryTable({ invoices }: PaymentHistoryTableProps) {
  if (invoices.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
        No invoices found. Your payment history will appear here.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Invoice</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium">
                {format(new Date(invoice.created * 1000), "MMM d, yyyy")}
              </TableCell>
              <TableCell>{invoice.number ?? "—"}</TableCell>
              <TableCell>
                {formatAmount(invoice.amountPaid, invoice.currency)}
              </TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(invoice.status)}>
                  {capitalize(invoice.status)}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {invoice.hostedInvoiceUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                    >
                      <a
                        href={invoice.hostedInvoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View
                      </a>
                    </Button>
                  )}
                  {invoice.invoicePdf && (
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                    >
                      <a
                        href={invoice.invoicePdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </a>
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
