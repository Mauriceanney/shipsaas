"use client";

/**
 * Churn Rate Card
 * Displays monthly churn rate metrics
 */

import { AlertTriangle, TrendingDown } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ICON_SIZES } from "@/lib/constants/ui";
import { cn } from "@/lib/utils";

interface ChurnRateCardProps {
  rate: number;
  count: number;
  total: number;
}

export function ChurnRateCard({ rate, count, total }: ChurnRateCardProps) {
  // Determine severity level for color coding
  const isHigh = rate > 10;
  const isMedium = rate > 5 && rate <= 10;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
          <CardDescription>Monthly customer churn</CardDescription>
        </div>
        {isHigh ? (
          <AlertTriangle
            className={cn(ICON_SIZES.sm, "text-destructive")}
          />
        ) : (
          <TrendingDown
            className={cn(
              ICON_SIZES.sm,
              isMedium ? "text-yellow-500" : "text-green-500"
            )}
          />
        )}
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "text-3xl font-bold",
            isHigh && "text-destructive",
            isMedium && "text-yellow-500"
          )}
        >
          {rate.toFixed(1)}%
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {count} of {total} customers
        </p>
        {isHigh && (
          <p className="mt-2 text-xs text-destructive">
            High churn rate - consider retention strategies
          </p>
        )}
      </CardContent>
    </Card>
  );
}
