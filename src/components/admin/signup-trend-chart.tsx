"use client";

/**
 * Signup Trend Chart
 * Displays monthly signup trends as a line chart
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SignupTrendChartProps {
  data: Array<{ month: string; count: number }>;
}

export function SignupTrendChart({ data }: SignupTrendChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Signups</CardTitle>
          <CardDescription>New user registrations over time</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <p className="text-sm text-muted-foreground">No signup data</p>
        </CardContent>
      </Card>
    );
  }

  // Format month labels (2024-01 -> Jan 24)
  const formattedData = data.map((item) => {
    const [year, month] = item.month.split("-");
    const date = new Date(parseInt(year!), parseInt(month!) - 1);
    const label = date.toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    });
    return { ...item, label };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Signups</CardTitle>
        <CardDescription>New user registrations over time</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip
              formatter={(value) => [value as number, "Signups"]}
              labelFormatter={(label) => `Month: ${label}`}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="hsl(220, 70%, 50%)"
              strokeWidth={2}
              dot={{ fill: "hsl(220, 70%, 50%)", strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
