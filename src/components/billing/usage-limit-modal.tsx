"use client";

import { AlertCircle, TrendingUp, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { trackEvent } from "@/lib/analytics/client";
import { UPGRADE_PROMPT_EVENTS } from "@/lib/analytics/events";

import type { Plan } from "@prisma/client";

export type UsageMetricKey = "apiCalls" | "projects" | "storage" | "teamMembers";

type UsageLimitModalProps = {
  metric: UsageMetricKey;
  currentUsage: number;
  limit: number;
  plan: Plan;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

const metricLabels: Record<UsageMetricKey, string> = {
  apiCalls: "API Calls",
  projects: "Projects",
  storage: "Storage",
  teamMembers: "Team Members",
};

const metricDescriptions: Record<UsageMetricKey, string> = {
  apiCalls: "monthly API requests",
  projects: "active projects",
  storage: "file storage",
  teamMembers: "team seats",
};

function formatUsage(value: number, metric: UsageMetricKey): string {
  if (metric === "storage") {
    const mb = value / (1024 * 1024);
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb.toFixed(1)} MB`;
  }
  return value.toLocaleString();
}

export function UsageLimitModal({
  metric,
  currentUsage,
  limit,
  plan,
  isOpen,
  onOpenChange,
}: UsageLimitModalProps) {
  const hasTrackedImpression = useRef(false);
  const usagePercentage = Math.min(Math.round((currentUsage / limit) * 100), 100);
  const isAtLimit = usagePercentage >= 100;
  const nextPlan = plan === "FREE" ? "Plus" : "Pro";
  const nextPlanValue = plan === "FREE" ? "PLUS" : "PRO";

  // Track impression when modal opens
  useEffect(() => {
    if (isOpen && !hasTrackedImpression.current) {
      hasTrackedImpression.current = true;
      trackEvent(
        isAtLimit
          ? UPGRADE_PROMPT_EVENTS.UPGRADE_LIMIT_BLOCKED
          : UPGRADE_PROMPT_EVENTS.UPGRADE_PROMPT_SHOWN,
        {
          metric,
          usagePercentage,
          currentUsage,
          limit,
          plan,
        }
      );
    }
  }, [isOpen, isAtLimit, metric, usagePercentage, currentUsage, limit, plan]);

  // Reset tracking when modal closes
  useEffect(() => {
    if (!isOpen) {
      hasTrackedImpression.current = false;
    }
  }, [isOpen]);

  const handleDismiss = () => {
    trackEvent(UPGRADE_PROMPT_EVENTS.UPGRADE_PROMPT_DISMISSED, {
      metric,
      usagePercentage,
      plan,
    });
    onOpenChange(false);
  };

  const handleUpgradeClick = () => {
    trackEvent(UPGRADE_PROMPT_EVENTS.UPGRADE_PROMPT_CLICKED, {
      metric,
      usagePercentage,
      plan,
      targetPlan: nextPlanValue,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div
              className={`rounded-full p-2 ${
                isAtLimit
                  ? "bg-destructive/10 text-destructive"
                  : "bg-yellow-500/10 text-yellow-600"
              }`}
            >
              <AlertCircle className="h-5 w-5" />
            </div>
            <DialogTitle>
              {isAtLimit
                ? `${metricLabels[metric]} Limit Reached`
                : `Approaching ${metricLabels[metric]} Limit`}
            </DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            {isAtLimit
              ? `You've used all your ${metricDescriptions[metric]}. Upgrade to continue using this feature.`
              : `You're using ${usagePercentage}% of your ${metricDescriptions[metric]} limit.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Usage Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{metricLabels[metric]}</span>
              <span className="font-medium">
                {formatUsage(currentUsage, metric)} / {formatUsage(limit, metric)}
              </span>
            </div>
            <Progress
              value={usagePercentage}
              className={
                isAtLimit
                  ? "[&>div]:bg-destructive"
                  : "[&>div]:bg-yellow-500"
              }
              aria-label={`${usagePercentage}% of ${metricLabels[metric]} used`}
            />
          </div>

          {/* Upgrade Benefits */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span>Upgrade to {nextPlan}</span>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Zap className="h-3 w-3 text-primary" />
                Higher {metricDescriptions[metric]} limits
              </li>
              <li className="flex items-center gap-2">
                <Zap className="h-3 w-3 text-primary" />
                Priority support
              </li>
              <li className="flex items-center gap-2">
                <Zap className="h-3 w-3 text-primary" />
                Advanced features
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleDismiss}>
            {isAtLimit ? "Maybe Later" : "Not Now"}
          </Button>
          <Button asChild onClick={handleUpgradeClick}>
            <Link
              href={`/pricing?source=usage_limit_modal&metric=${metric}&plan=${nextPlanValue}`}
            >
              Upgrade to {nextPlan}
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
