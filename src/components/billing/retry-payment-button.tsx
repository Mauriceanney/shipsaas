"use client";

/**
 * Retry Payment Button
 *
 * Allows users to retry a failed payment.
 */

import { useState, useTransition } from "react";
import { RefreshCw, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { retryPayment } from "@/actions/billing/retry-payment";
import { Button } from "@/components/ui/button";

export interface RetryPaymentButtonProps {
  disabled?: boolean;
  onSuccess?: () => void;
}

export function RetryPaymentButton({
  disabled = false,
  onSuccess,
}: RetryPaymentButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [succeeded, setSucceeded] = useState(false);

  function handleClick() {
    startTransition(async () => {
      const result = await retryPayment();

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      if (result.paid) {
        setSucceeded(true);
        toast.success("Payment successful! Your subscription is now active.");
        onSuccess?.();
      } else {
        toast.error(
          "Payment could not be processed. Please update your payment method."
        );
      }
    });
  }

  if (succeeded) {
    return (
      <Button disabled variant="outline">
        <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
        Payment Successful
      </Button>
    );
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isPending || disabled}
      variant="default"
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry Payment
        </>
      )}
    </Button>
  );
}

export default RetryPaymentButton;
