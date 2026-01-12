"use client";

/**
 * Subscription Status Component
 *
 * Displays the current subscription status with plan details.
 */

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Plan, SubscriptionStatus as SubStatus } from "@/lib/schema";
import {
  getStatusLabel,
  getStatusColor,
  getPlanLabel,
  formatBillingDate,
  getBillingPeriodLabel,
} from "@/lib/stripe/utils";

export interface SubscriptionStatusProps {
  plan: Plan;
  status: SubStatus;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  trialEnd: Date | null;
}

export function SubscriptionStatus({
  plan,
  status,
  currentPeriodEnd,
  cancelAtPeriodEnd,
  trialEnd,
}: SubscriptionStatusProps) {
  const statusLabel = getStatusLabel(status);
  const statusColor = getStatusColor(status);
  const planLabel = getPlanLabel(plan);
  const periodLabel = getBillingPeriodLabel(currentPeriodEnd, cancelAtPeriodEnd);

  const isTrialing = status === "TRIALING" && trialEnd;
  const isPastDue = status === "PAST_DUE";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Subscription</span>
          <Badge variant={statusColor}>{statusLabel}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Current Plan</span>
          <span className="font-medium">{planLabel}</span>
        </div>

        {currentPeriodEnd && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {cancelAtPeriodEnd ? "Access Until" : "Next Billing Date"}
            </span>
            <span className="font-medium">
              {formatBillingDate(currentPeriodEnd)}
            </span>
          </div>
        )}

        {isTrialing && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Trial Ends</span>
            <span className="font-medium">{formatBillingDate(trialEnd)}</span>
          </div>
        )}

        {periodLabel && (
          <p className="text-sm text-muted-foreground">{periodLabel}</p>
        )}

        {cancelAtPeriodEnd && (
          <p className="text-sm text-amber-600 dark:text-amber-500">
            Your subscription will be canceled at the end of the current period.
          </p>
        )}

        {isPastDue && (
          <p className="text-sm text-destructive">
            Your payment is past due. Please update your payment method to avoid
            service interruption.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default SubscriptionStatus;
