"use client";

import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { SubscriptionInfo } from "@/lib/stripe/types";

interface SubscriptionStatusProps {
  subscription: SubscriptionInfo | null;
}

const statusColors = {
  ACTIVE: "bg-green-100 text-green-700",
  TRIALING: "bg-blue-100 text-blue-700",
  PAST_DUE: "bg-yellow-100 text-yellow-700",
  CANCELED: "bg-red-100 text-red-700",
  INACTIVE: "bg-gray-100 text-gray-700",
};

export function SubscriptionStatus({ subscription }: SubscriptionStatusProps) {
  // Show Free Plan for users without a subscription record
  if (!subscription) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Free Plan</h3>
            <Badge className={cn("mt-1", statusColors.ACTIVE)}>
              ACTIVE
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          You&apos;re on the free plan. Upgrade to unlock more features.
        </p>
      </div>
    );
  }

  const isTrialing = subscription.status === "TRIALING";
  const trialEndsAt = subscription.trialEnd;

  // Format plan name for display (FREE -> Free, PLUS -> Plus, PRO -> Pro)
  const planDisplayName = subscription.plan.charAt(0) + subscription.plan.slice(1).toLowerCase();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{planDisplayName} Plan</h3>
          <Badge className={cn("mt-1", statusColors[subscription.status])}>
            {subscription.status}
          </Badge>
        </div>
      </div>

      {isTrialing && trialEndsAt && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Trial Period</span> - Your trial ends on{" "}
            <span className="font-semibold">
              {format(trialEndsAt, "MMMM d, yyyy")}
            </span>
            . You won&apos;t be charged until then.
          </p>
        </div>
      )}

      {subscription.currentPeriodEnd && !isTrialing && (
        <div className="text-sm text-muted-foreground">
          {subscription.cancelAtPeriodEnd ? (
            <p>
              Your subscription will end on{" "}
              <span className="font-medium">
                {format(subscription.currentPeriodEnd, "MMMM d, yyyy")}
              </span>
            </p>
          ) : (
            <p>
              Next billing date:{" "}
              <span className="font-medium">
                {format(subscription.currentPeriodEnd, "MMMM d, yyyy")}
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}