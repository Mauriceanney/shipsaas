import { Calendar, CreditCard, Layers, Zap } from "lucide-react";

import { getUserDashboardMetrics } from "@/actions/dashboard/metrics";
import { MetricsCard } from "@/components/dashboard/metrics-card";
import { auth } from "@/lib/auth";
import { formatLimit, isUnlimited } from "@/lib/stripe/config";

export async function MetricsGrid() {
  const session = await auth();
  if (!session?.user?.id) return null;

  // Get dashboard metrics
  const metricsResult = await getUserDashboardMetrics();
  const metrics = metricsResult.success ? metricsResult.data : null;

  // Format member since date
  const memberSince = metrics?.account.memberSince
    ? new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(
        new Date(metrics.account.memberSince)
      )
    : "—";

  // Get plan display name
  const planDisplayName = metrics?.subscription?.plan
    ? metrics.subscription.plan.charAt(0) + metrics.subscription.plan.slice(1).toLowerCase()
    : "Free";

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricsCard
        title="Current Plan"
        value={planDisplayName}
        description={
          metrics?.subscription?.status === "ACTIVE"
            ? "Active subscription"
            : metrics?.subscription?.status === "TRIALING"
              ? "Trial period"
              : "No active subscription"
        }
        icon={CreditCard}
      />

      <MetricsCard
        title="API Calls"
        value={
          metrics?.usage.apiCalls
            ? `${formatLimit(metrics.usage.apiCalls.used)} / ${formatLimit(metrics.usage.apiCalls.limit)}`
            : "—"
        }
        description="This month's usage"
        icon={Zap}
      />

      <MetricsCard
        title="Projects"
        value={
          metrics?.usage.projects
            ? isUnlimited(metrics.usage.projects.limit)
              ? `${metrics.usage.projects.used} (Unlimited)`
              : `${metrics.usage.projects.used} / ${metrics.usage.projects.limit}`
            : "—"
        }
        description="Active projects"
        icon={Layers}
      />

      <MetricsCard
        title="Member Since"
        value={memberSince}
        description={
          metrics?.activity.recentLogins
            ? `${metrics.activity.recentLogins} logins in last 30 days`
            : "Welcome!"
        }
        icon={Calendar}
      />
    </div>
  );
}
