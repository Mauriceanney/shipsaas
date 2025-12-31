import { Calendar, CreditCard, Layers, Zap } from "lucide-react";

import { getUserDashboardMetrics } from "@/actions/dashboard/metrics";
import { MetricsCard } from "@/components/dashboard/metrics-card";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { UpgradeBanner } from "@/components/feature-gate";
import { PageHeader } from "@/components/ui/page-header";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatLimit, isUnlimited } from "@/lib/stripe/config";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your personal dashboard",
};

export default async function DashboardPage() {
  const session = await auth();

  // Get user data for onboarding and subscription
  const user = session?.user?.id
    ? await db.user.findUnique({
        where: { id: session.user.id },
        select: {
          name: true,
          image: true,
          onboardingCompleted: true,
          subscription: {
            select: {
              status: true,
              plan: true,
            },
          },
        },
      })
    : null;

  // Get dashboard metrics
  const metricsResult = await getUserDashboardMetrics();
  const metrics = metricsResult.success ? metricsResult.data : null;

  const showOnboarding = user && !user.onboardingCompleted;
  const hasSubscription =
    user?.subscription?.status === "ACTIVE" ||
    user?.subscription?.status === "TRIALING";
  const isFreePlan = !hasSubscription || user?.subscription?.plan === "FREE";

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
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${session?.user?.name ?? "User"}!`}
      />

      {/* Onboarding Checklist for new users */}
      {showOnboarding && (
        <OnboardingChecklist
          user={{ name: user.name, image: user.image }}
          hasSubscription={hasSubscription}
        />
      )}

      {/* Upgrade Banner for FREE users (show only if not in onboarding) */}
      {!showOnboarding && isFreePlan && (
        <UpgradeBanner
          feature="Advanced Analytics"
          description="Get detailed insights, custom reports, and real-time metrics with Pro."
          dismissible
          variant="gradient"
        />
      )}

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
    </div>
  );
}
