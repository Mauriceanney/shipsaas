"use client";

/**
 * Dunning Banner Component
 *
 * Displays a warning banner when payment is past due.
 */

import Link from "next/link";
import { AlertTriangle, CreditCard } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SUSPENSION_GRACE_PERIOD_DAYS } from "@/lib/stripe/config";
import type { DunningStatus } from "@/lib/stripe/types";

export interface DunningBannerProps {
  status: DunningStatus;
  className?: string;
}

export function DunningBanner({ status, className }: DunningBannerProps) {
  if (!status.isInDunning) {
    return null;
  }

  const daysRemaining = SUSPENSION_GRACE_PERIOD_DAYS - status.daysSinceFailure;
  const isUrgent = daysRemaining <= 3;
  const isSuspended = daysRemaining <= 0;

  if (isSuspended) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Subscription Suspended</AlertTitle>
        <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Your subscription has been suspended due to payment failure. Update
            your payment method to restore access.
          </span>
          <Button size="sm" variant="outline" asChild>
            <Link href="/settings/billing">
              <CreditCard className="mr-2 h-4 w-4" />
              Update Payment
            </Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert
      variant={isUrgent ? "destructive" : "default"}
      className={className}
    >
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Payment Required</AlertTitle>
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>
          {isUrgent
            ? `Your subscription will be suspended in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}. Please update your payment method immediately.`
            : `Your payment failed. Please update your payment method within ${daysRemaining} days to avoid service interruption.`}
        </span>
        <Button
          size="sm"
          variant={isUrgent ? "default" : "outline"}
          asChild
        >
          <Link href="/settings/billing">
            <CreditCard className="mr-2 h-4 w-4" />
            Update Payment
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}

export default DunningBanner;
