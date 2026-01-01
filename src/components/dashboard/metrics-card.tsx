/**
 * MetricsCard Component
 * Displays a single metric with icon and optional trend indicator
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { LucideIcon } from "lucide-react";

type MetricsCardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  className?: string;
};

export function MetricsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: MetricsCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <p
            className={cn(
              "text-xs",
              trend.isPositive ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
            )}
          >
            {trend.isPositive && "+"}
            {trend.value}% {trend.label}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
