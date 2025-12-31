"use client";

import { format } from "date-fns";
import { Check, Sparkles, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { SubscriptionInfo } from "@/lib/stripe/types";

interface SubscriptionStatusProps {
  subscription: SubscriptionInfo | null;
}

const statusConfig = {
  ACTIVE: { color: "bg-green-100 text-green-700", label: "Active" },
  TRIALING: { color: "bg-blue-100 text-blue-700", label: "Trial" },
  PAST_DUE: { color: "bg-yellow-100 text-yellow-700", label: "Past Due" },
  CANCELED: { color: "bg-red-100 text-red-700", label: "Canceled" },
  INACTIVE: { color: "bg-gray-100 text-gray-700", label: "Inactive" },
};

const FREE_PLAN_FEATURES = [
  "1 project",
  "5GB storage",
  "Community support",
];

export function SubscriptionStatus({ subscription }: SubscriptionStatusProps) {
  // Show Free Plan for users without a subscription record or with FREE plan
  const isFreePlan = !subscription || subscription.plan === "FREE";

  if (isFreePlan) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Zap className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Free Plan</h3>
            <p className="text-sm text-muted-foreground">
              Basic features to get started
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-sm font-medium mb-3">Your current features:</p>
          <ul className="space-y-2">
            {FREE_PLAN_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-green-600" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>Upgrade to unlock unlimited projects, priority support, and more.</span>
        </div>
      </div>
    );
  }

  const isTrialing = subscription.status === "TRIALING";
  const trialEndsAt = subscription.trialEnd;
  const status = statusConfig[subscription.status];

  // Format plan name for display (PLUS -> Plus, PRO -> Pro)
  const planDisplayName = subscription.plan.charAt(0) + subscription.plan.slice(1).toLowerCase();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">{planDisplayName} Plan</h3>
            <Badge className={cn(status.color)}>
              {status.label}
            </Badge>
          </div>
          {subscription.plan === "PLUS" && (
            <p className="text-sm text-muted-foreground">Professional features for growing teams</p>
          )}
          {subscription.plan === "PRO" && (
            <p className="text-sm text-muted-foreground">Enterprise-grade features with dedicated support</p>
          )}
        </div>
      </div>

      {isTrialing && trialEndsAt && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
              <Sparkles className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-blue-900">Trial Period Active</p>
              <p className="text-sm text-blue-700 mt-1">
                Your trial ends on{" "}
                <span className="font-semibold">
                  {format(trialEndsAt, "MMMM d, yyyy")}
                </span>
                . You won&apos;t be charged until then.
              </p>
            </div>
          </div>
        </div>
      )}

      {subscription.currentPeriodEnd && !isTrialing && (
        <div className="rounded-lg border bg-muted/30 p-4">
          {subscription.cancelAtPeriodEnd ? (
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100">
                <Zap className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium text-foreground">Subscription Ending</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your subscription will end on{" "}
                  <span className="font-medium">
                    {format(subscription.currentPeriodEnd, "MMMM d, yyyy")}
                  </span>
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Next billing date</span>
              <span className="text-sm font-medium">
                {format(subscription.currentPeriodEnd, "MMMM d, yyyy")}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}