"use client";

/**
 * Manage Subscription Button
 *
 * Opens the Stripe customer portal for subscription management.
 */

import { useTransition } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createPortalSession } from "@/actions/stripe/create-portal";
import { Button } from "@/components/ui/button";

export interface ManageSubscriptionButtonProps {
  hasSubscription?: boolean;
}

export function ManageSubscriptionButton({
  hasSubscription = true,
}: ManageSubscriptionButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await createPortalSession();

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      // Redirect to Stripe customer portal
      window.location.href = result.url;
    });
  }

  if (!hasSubscription) {
    return null;
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isPending}
      variant="outline"
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Opening...
        </>
      ) : (
        <>
          <ExternalLink className="mr-2 h-4 w-4" />
          Manage Subscription
        </>
      )}
    </Button>
  );
}

export default ManageSubscriptionButton;
