"use client";

/**
 * Usage Meter Component
 * Displays current usage with progress bars and limits
 */

import { AlertCircle, HardDrive, Layers, Users, Zap } from "lucide-react";
import { useEffect, useState } from "react";

import { getCurrentUsage } from "@/actions/usage";
import { UpgradePrompt } from "@/components/feature-gate";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatLimit, isUnlimited } from "@/lib/stripe/config";
import { getUsagePercentage, isApproachingLimit } from "@/lib/usage";

import type { Plan } from "@prisma/client";

type UsageData = {
  apiCalls: { used: number; limit: number };
  projects: { used: number; limit: number };
  storage: { used: number; limit: number };
  teamMembers: { used: number; limit: number };
};

type UsageMeterProps = {
  className?: string;
};

const usageMetrics = [
  {
    key: "apiCalls" as const,
    label: "API Calls",
    icon: Zap,
    description: "Monthly API requests",
    formatType: "count" as const,
  },
  {
    key: "projects" as const,
    label: "Projects",
    icon: Layers,
    description: "Active projects",
    formatType: "count" as const,
  },
  {
    key: "storage" as const,
    label: "Storage",
    icon: HardDrive,
    description: "File storage used",
    formatType: "bytes" as const,
  },
  {
    key: "teamMembers" as const,
    label: "Team Members",
    icon: Users,
    description: "Team seats used",
    formatType: "count" as const,
  },
];


export function UsageMeter({ className }: UsageMeterProps) {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [plan, setPlan] = useState<Plan>("FREE");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUsage() {
      const result = await getCurrentUsage();
      if (result.success) {
        setUsage(result.data.usage);
        setPlan(result.data.plan);
      }
      setIsLoading(false);
    }
    loadUsage();
  }, []);

  if (isLoading) {
    return (
      <div className={className}>
        <div className="space-y-4">
          {usageMetrics.map((metric) => (
            <div key={metric.key} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!usage) {
    return (
      <div className={className}>
        <p className="text-sm text-muted-foreground">Unable to load usage data.</p>
      </div>
    );
  }

  const showUpgradeHint = plan !== "PRO";

  return (
    <div className={className}>
      <div className="space-y-6">
        {usageMetrics.map((metric) => {
          const data = usage[metric.key];
          const Icon = metric.icon;
          const percentage = getUsagePercentage(data.used, data.limit);
          const approaching = isApproachingLimit(data.used, data.limit);
          const unlimited = isUnlimited(data.limit);

          return (
            <div key={metric.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <span className="text-sm font-medium">{metric.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {formatLimit(data.used, metric.formatType)} / {formatLimit(data.limit, metric.formatType)}
                  </span>
                  {approaching && !unlimited && (
                    <AlertCircle className="h-4 w-4 text-yellow-500" aria-label="Approaching limit" />
                  )}
                </div>
              </div>
              {!unlimited && (
                <Progress
                  value={percentage}
                  className={approaching ? "[&>div]:bg-yellow-500" : ""}
                  aria-label={`${metric.label}: ${percentage}% used`}
                />
              )}
              {unlimited && (
                <p className="text-xs text-muted-foreground">Unlimited on your plan</p>
              )}
              {approaching && showUpgradeHint && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-yellow-600 dark:text-yellow-400">
                    Approaching limit
                  </span>
                  <UpgradePrompt
                    size="sm"
                    message="Increase limit"
                    variant="subtle"
                    requiredPlan={plan === "FREE" ? "PLUS" : "PRO"}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
