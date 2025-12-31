"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { retryPaymentAction } from "@/actions/billing/retry-payment";
import { Button } from "@/components/ui/button";

export function RetryPaymentButton() {
  const [isPending, startTransition] = useTransition();

  const handleRetry = () => {
    startTransition(async () => {
      const result = await retryPaymentAction();

      if (result.success) {
        toast.success("Payment successful! Your subscription has been restored.");
        // Reload to update UI with new subscription status
        window.location.reload();
      } else {
        toast.error(result.error || "Payment failed");
      }
    });
  };

  return (
    <Button
      variant="default"
      size="sm"
      onClick={handleRetry}
      disabled={isPending}
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          Processing...
        </>
      ) : (
        <>
          <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
          Retry Payment
        </>
      )}
    </Button>
  );
}
