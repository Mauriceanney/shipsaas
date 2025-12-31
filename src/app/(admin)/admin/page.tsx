import { CreditCard, TrendingUp, UserPlus, Users } from "lucide-react";

import { getAdminDashboardMetrics } from "@/actions/dashboard/metrics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PLAN_PRICING } from "@/lib/stripe/config";

// Force dynamic rendering - this page requires database access
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const metricsResult = await getAdminDashboardMetrics();

  if (!metricsResult.success) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground text-red-500">
            Failed to load metrics: {metricsResult.error}
          </p>
        </div>
      </div>
    );
  }

  const metrics = metricsResult.data;

  // Calculate estimated MRR from subscriptions
  const estimatedMRR =
    metrics.subscriptions.byPlan.PRO * PLAN_PRICING.PRO.monthly +
    metrics.subscriptions.byPlan.ENTERPRISE * PLAN_PRICING.ENTERPRISE.monthly;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your application metrics.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.users.total}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.users.activeThisMonth} active this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Month</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.users.newThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              New signups
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Subscriptions
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.subscriptions.active + metrics.subscriptions.trialing}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.subscriptions.pastDue > 0 && (
                <span className="text-yellow-600">{metrics.subscriptions.pastDue} past due</span>
              )}
              {metrics.subscriptions.pastDue === 0 && "Paying customers"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Revenue
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${estimatedMRR}</div>
            <p className="text-xs text-muted-foreground">Estimated MRR</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Subscriptions by Plan</CardTitle>
            <CardDescription>Distribution of active subscriptions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Free</span>
                <span className="font-medium">{metrics.subscriptions.byPlan.FREE}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pro</span>
                <span className="font-medium">{metrics.subscriptions.byPlan.PRO}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Enterprise</span>
                <span className="font-medium">{metrics.subscriptions.byPlan.ENTERPRISE}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Signups</CardTitle>
            <CardDescription>Newest users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.recentSignups.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user.name ?? "—"}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat("en-US", {
                      month: "short",
                      day: "numeric",
                    }).format(new Date(user.createdAt))}
                  </span>
                </div>
              ))}
              {metrics.recentSignups.length === 0 && (
                <p className="text-sm text-muted-foreground">No signups yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
