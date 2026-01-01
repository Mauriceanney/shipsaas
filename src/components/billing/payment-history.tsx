import { Suspense } from "react";

import { getInvoices } from "@/actions/billing/get-invoices";
import { Skeleton } from "@/components/ui/skeleton";

import { PaymentHistoryTable } from "./payment-history-table";

import type { InvoiceData } from "@/actions/billing/get-invoices";

/**
 * Loading skeleton for payment history
 */
function PaymentHistoryLoading() {
  return (
    <div className="space-y-2">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}

/**
 * Payment history component (Server Component)
 * Fetches and displays user's invoice history
 */
async function PaymentHistoryContent() {
  const result = await getInvoices();

  if (!result.success) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        Failed to load payment history. Please try again later.
      </div>
    );
  }

  // Convert readonly array to mutable array for component props
  const invoices: InvoiceData[] = [...result.data];

  return <PaymentHistoryTable invoices={invoices} />;
}

/**
 * Payment history with suspense boundary
 */
export function PaymentHistory() {
  return (
    <Suspense fallback={<PaymentHistoryLoading />}>
      <PaymentHistoryContent />
    </Suspense>
  );
}
