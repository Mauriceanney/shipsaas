import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { UpgradeBanner } from "@/components/feature-gate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

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

  const showOnboarding = user && !user.onboardingCompleted;
  const hasSubscription =
    user?.subscription?.status === "ACTIVE" ||
    user?.subscription?.status === "TRIALING";
  const isFreePlan = !hasSubscription || user?.subscription?.plan === "FREE";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session?.user?.name ?? "User"}!
        </p>
      </div>

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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231.89</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+2,350</div>
            <p className="text-xs text-muted-foreground">
              +180.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12,234</div>
            <p className="text-xs text-muted-foreground">
              +19% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+573</div>
            <p className="text-xs text-muted-foreground">
              +201 since last hour
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
