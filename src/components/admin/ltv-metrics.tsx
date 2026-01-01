"use client";

/**
 * LTV Metrics Component
 * Displays Lifetime Value, ARPU, and average customer lifetime
 */

import { Users, Clock, Calculator } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ICON_SIZES } from "@/lib/constants/ui";

interface LtvMetricsProps {
  ltv: number;
  arpu: number;
  avgLifetimeMonths: number;
  payingCustomers: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatMonths(months: number): string {
  if (months >= 12) {
    const years = months / 12;
    return years === 1 ? "1 year" : `${years.toFixed(1)} years`;
  }
  return months === 1 ? "1 month" : `${months.toFixed(1)} months`;
}

export function LtvMetrics({
  ltv,
  arpu,
  avgLifetimeMonths,
  payingCustomers,
}: LtvMetricsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">LTV</CardTitle>
          <Calculator className={ICON_SIZES.sm + " text-muted-foreground"} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(ltv)}</div>
          <p className="text-xs text-muted-foreground">
            Customer Lifetime Value
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">ARPU</CardTitle>
          <Users className={ICON_SIZES.sm + " text-muted-foreground"} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(arpu)}</div>
          <p className="text-xs text-muted-foreground">
            Avg Revenue Per User
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Lifetime</CardTitle>
          <Clock className={ICON_SIZES.sm + " text-muted-foreground"} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatMonths(avgLifetimeMonths)}</div>
          <p className="text-xs text-muted-foreground">
            Average Customer Duration
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Paying Customers</CardTitle>
          <Users className={ICON_SIZES.sm + " text-muted-foreground"} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{payingCustomers}</div>
          <p className="text-xs text-muted-foreground">
            Active & Trialing
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
