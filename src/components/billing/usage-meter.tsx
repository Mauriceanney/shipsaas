"use client";

/**
 * Usage Meter Component
 *
 * Displays usage metrics against plan limits.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { UsageWithLimits } from "@/lib/stripe/types";

export interface UsageMeterProps {
  usage: UsageWithLimits;
}

function formatNumber(value: number): string {
  if (value === Infinity) return "Unlimited";
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toString();
}

function formatBytes(bytes: bigint | number): string {
  const numBytes = typeof bytes === "bigint" ? Number(bytes) : bytes;
  if (numBytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(numBytes) / Math.log(k));
  return `${parseFloat((numBytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getUsagePercentage(used: number, limit: number): number {
  if (limit === Infinity || limit === 0) return 0;
  return Math.min(100, (used / limit) * 100);
}

function getProgressColor(percentage: number): string {
  if (percentage >= 90) return "bg-destructive";
  if (percentage >= 75) return "bg-amber-500";
  return "bg-primary";
}

interface UsageItemProps {
  label: string;
  used: number | bigint;
  limit: number;
  formatValue?: (value: number | bigint) => string;
  limitLabel?: string;
}

function UsageItem({
  label,
  used,
  limit,
  formatValue = (v: number | bigint) => formatNumber(typeof v === "bigint" ? Number(v) : v),
  limitLabel,
}: UsageItemProps) {
  const numUsed = typeof used === "bigint" ? Number(used) : used;
  const percentage = getUsagePercentage(numUsed, limit);
  const progressColor = getProgressColor(percentage);
  const isUnlimited = limit === Infinity;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {formatValue(used)} / {limitLabel ?? (isUnlimited ? "Unlimited" : formatValue(limit))}
        </span>
      </div>
      <Progress
        value={isUnlimited ? 0 : percentage}
        className="h-2"
        indicatorClassName={progressColor}
      />
    </div>
  );
}

export function UsageMeter({ usage }: UsageMeterProps) {
  const { usage: usageData, limits } = usage;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage This Period</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <UsageItem
          label="API Calls"
          used={usageData.apiCalls}
          limit={limits.apiCalls}
        />
        <UsageItem
          label="Projects"
          used={usageData.projectsCount}
          limit={limits.projects}
        />
        <UsageItem
          label="Storage"
          used={usageData.storageBytes}
          limit={limits.storageGB * 1024 * 1024 * 1024}
          formatValue={(v) => formatBytes(v)}
          limitLabel={limits.storageGB === Infinity ? "Unlimited" : `${limits.storageGB} GB`}
        />
        <UsageItem
          label="Team Members"
          used={usageData.teamMembers}
          limit={limits.teamMembers}
        />
        <p className="text-xs text-muted-foreground">
          Usage resets at the start of each billing period.
        </p>
      </CardContent>
    </Card>
  );
}

export default UsageMeter;
