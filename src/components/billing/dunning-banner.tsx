import { AlertCircle } from "lucide-react";

import { getDunningStatus } from "@/actions/billing/get-dunning-status";
import { redirectToPortal } from "@/actions/stripe/create-portal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

/**
 * Server Component that displays a warning banner when payment fails
 * Shows only when subscription status is PAST_DUE
 */
export async function DunningBanner() {
  const result = await getDunningStatus();

  if (!result.success || !result.data.showBanner) {
    return null;
  }

  const { daysSinceFailed } = result.data;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" aria-hidden="true" />
      <AlertTitle>Payment Failed</AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <span>
          Your payment failed {daysSinceFailed}{" "}
          {daysSinceFailed === 1 ? "day" : "days"} ago. Update your payment
          method to avoid service interruption.
        </span>
        <form
          action={async () => {
            "use server";
            await redirectToPortal();
          }}
        >
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="whitespace-nowrap"
          >
            Update Payment Method
          </Button>
        </form>
      </AlertDescription>
    </Alert>
  );
}
