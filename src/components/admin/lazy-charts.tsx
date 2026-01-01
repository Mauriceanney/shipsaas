/**
 * Lazy-Loaded Chart Components
 *
 * Uses Next.js dynamic imports to lazy load recharts (~500KB),
 * reducing bundle size for non-admin users and admins who don't
 * visit the analytics page.
 */

"use client";

import dynamic from "next/dynamic";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading fallback for charts
 */
function ChartLoadingFallback() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
      </CardHeader>
      <CardContent className="h-[300px]">
        <Skeleton className="h-full w-full" />
      </CardContent>
    </Card>
  );
}

/**
 * Lazy-loaded Signup Trend Chart
 *
 * Only loads recharts library when this component is rendered
 */
export const SignupTrendChart = dynamic(
  () =>
    import("./signup-trend-chart").then((mod) => ({
      default: mod.SignupTrendChart,
    })),
  {
    ssr: false,
    loading: () => <ChartLoadingFallback />,
  }
);

/**
 * Lazy-loaded Subscription Breakdown Chart
 *
 * Only loads recharts library when this component is rendered
 */
export const SubscriptionBreakdownChart = dynamic(
  () =>
    import("./subscription-breakdown-chart").then((mod) => ({
      default: mod.SubscriptionBreakdownChart,
    })),
  {
    ssr: false,
    loading: () => <ChartLoadingFallback />,
  }
);
