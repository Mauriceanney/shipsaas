"use client";

/**
 * Payment History Component
 *
 * Displays a list of past invoices with download links.
 */

import { ExternalLink, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Invoice } from "@/lib/stripe/types";
import { formatBillingDate, formatCurrency } from "@/lib/stripe/utils";

export interface PaymentHistoryProps {
  invoices: Invoice[];
}

function getStatusBadge(status: string | null) {
  switch (status) {
    case "paid":
      return <Badge variant="default">Paid</Badge>;
    case "open":
      return <Badge variant="secondary">Open</Badge>;
    case "void":
      return <Badge variant="outline">Void</Badge>;
    case "uncollectible":
      return <Badge variant="destructive">Uncollectible</Badge>;
    default:
      return <Badge variant="outline">{status ?? "Unknown"}</Badge>;
  }
}

export function PaymentHistory({ invoices }: PaymentHistoryProps) {
  if (invoices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No invoices found. Your payment history will appear here after your
            first payment.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
      </CardHeader>
      <CardContent>
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
                <TableCell>{formatBillingDate(invoice.created)}</TableCell>
                <TableCell className="font-mono text-sm">
                  {invoice.number ?? invoice.id.slice(0, 8)}
                </TableCell>
                <TableCell>
                  {formatCurrency(invoice.amountPaid, invoice.currency)}
                </TableCell>
                <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {invoice.hostedInvoiceUrl && (
                      <Button variant="ghost" size="sm" asChild>
                        <a
                          href={invoice.hostedInvoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span className="sr-only">View invoice</span>
                        </a>
                      </Button>
                    )}
                    {invoice.pdfUrl && (
                      <Button variant="ghost" size="sm" asChild>
                        <a
                          href={invoice.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FileText className="h-4 w-4" />
                          <span className="sr-only">Download PDF</span>
                        </a>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default PaymentHistory;
