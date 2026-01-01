"use client";

import { DollarSign } from "lucide-react";

import { Button } from "@/components/ui/button";

import { RefundDialog } from "./refund-dialog";

interface RefundButtonProps {
  userId: string;
  subscriptionId: string;
  customerEmail: string;
  hasPaymentHistory: boolean;
}

export function RefundButton({
  subscriptionId,
  customerEmail,
  hasPaymentHistory,
}: RefundButtonProps) {
  // Don't show button if no payment history
  if (!hasPaymentHistory) {
    return null;
  }

  return (
    <RefundDialog
      subscriptionId={subscriptionId}
      customerEmail={customerEmail}
    >
      <Button variant="outline" size="sm">
        <DollarSign className="mr-2 h-4 w-4" />
        Process Refund
      </Button>
    </RefundDialog>
  );
}
