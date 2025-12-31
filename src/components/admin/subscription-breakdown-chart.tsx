"use client";

/**
 * Subscription Breakdown Chart
 * Displays subscription status distribution as a pie chart
 */

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SubscriptionBreakdownChartProps {
  active: number;
  trialing: number;
  pastDue: number;
  canceled: number;
}

const COLORS = {
  active: "hsl(160, 60%, 45%)", // Green - chart-2
  trialing: "hsl(220, 70%, 50%)", // Blue - chart-1
  pastDue: "hsl(30, 80%, 55%)", // Orange - chart-3
  canceled: "hsl(340, 75%, 55%)", // Red - chart-5
};

export function SubscriptionBreakdownChart({
  active,
  trialing,
  pastDue,
  canceled,
}: SubscriptionBreakdownChartProps) {
  const data = [
    { name: "Active", value: active, color: COLORS.active },
    { name: "Trialing", value: trialing, color: COLORS.trialing },
    { name: "Past Due", value: pastDue, color: COLORS.pastDue },
    { name: "Canceled", value: canceled, color: COLORS.canceled },
  ].filter((item) => item.value > 0);

  const total = active + trialing + pastDue + canceled;

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
          <CardDescription>Current distribution by status</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <p className="text-sm text-muted-foreground">No subscription data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Status</CardTitle>
        <CardDescription>Current distribution by status</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, percent }) =>
                `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
              }
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [value as number, "Subscriptions"]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
