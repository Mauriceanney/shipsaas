import { getAdminAnalytics } from "@/actions/admin/analytics";
import { ChurnRateCard } from "@/components/admin/churn-rate-card";
import { ExportAnalyticsButton } from "@/components/admin/export-analytics-button";
import {
  SignupTrendChart,
  SubscriptionBreakdownChart,
} from "@/components/admin/lazy-charts";
import { LtvMetrics } from "@/components/admin/ltv-metrics";
import { RevenueOverview } from "@/components/admin/revenue-overview";
import { PageHeader } from "@/components/ui/page-header";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics - Admin",
  description: "Revenue metrics and subscription analytics",
  robots: { index: false, follow: false },
};

// Force dynamic rendering - this page requires database access
export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const result = await getAdminAnalytics();

  if (!result.success) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Analytics"
          description={`Failed to load: ${result.error}`}
        />
      </div>
    );
  }

  const analytics = result.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Analytics"
          description="Revenue metrics and subscription insights"
        />
        <ExportAnalyticsButton data={analytics} />
      </div>

      <RevenueOverview
        mrr={analytics.revenue.mrr}
        arr={analytics.revenue.arr}
        revenueByPlan={analytics.revenue.byPlan}
      />

      <LtvMetrics
        ltv={analytics.ltv.value}
        arpu={analytics.ltv.arpu}
        avgLifetimeMonths={analytics.ltv.avgLifetimeMonths}
        payingCustomers={analytics.ltv.payingCustomers}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <SubscriptionBreakdownChart
          active={analytics.subscriptions.active}
          trialing={analytics.subscriptions.trialing}
          pastDue={analytics.subscriptions.pastDue}
          canceled={analytics.subscriptions.canceled}
        />

        <SignupTrendChart data={analytics.trends.signups} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ChurnRateCard
          rate={analytics.churn.rate}
          count={analytics.churn.count}
          total={analytics.churn.total}
        />
      </div>
    </div>
  );
}
