"use client";

/**
 * Revenue Overview Component
 * Displays MRR, ARR, and revenue by plan breakdown
 */

import { DollarSign, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ICON_SIZES } from "@/lib/constants/ui";

interface RevenueOverviewProps {
  mrr: number;
  arr: number;
  revenueByPlan: {
    FREE: number;
    PLUS: number;
    PRO: number;
  };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function RevenueOverview({
  mrr,
  arr,
  revenueByPlan,
}: RevenueOverviewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">MRR</CardTitle>
          <DollarSign className={ICON_SIZES.sm + " text-muted-foreground"} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(mrr)}</div>
          <p className="text-xs text-muted-foreground">
            Monthly Recurring Revenue
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">ARR</CardTitle>
          <TrendingUp className={ICON_SIZES.sm + " text-muted-foreground"} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(arr)}</div>
          <p className="text-xs text-muted-foreground">
            Annual Recurring Revenue
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Revenue by Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Plus</span>
              <span className="font-medium">
                {formatCurrency(revenueByPlan.PLUS)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Pro</span>
              <span className="font-medium">
                {formatCurrency(revenueByPlan.PRO)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
