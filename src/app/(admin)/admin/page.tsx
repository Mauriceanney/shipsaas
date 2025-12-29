import { CreditCard, TrendingUp, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";

async function getStats() {
  const [totalUsers, activeSubscriptions, monthlyRevenue] = await Promise.all([
    db.user.count(),
    db.subscription.count({
      where: {
        status: "ACTIVE",
      },
    }),
    // Calculate monthly revenue from active subscriptions
    db.subscription.findMany({
      where: {
        status: "ACTIVE",
      },
      select: {
        plan: true,
      },
    }),
  ]);

  // Calculate revenue (simplified - would need actual price lookup)
  const revenueEstimate = monthlyRevenue.reduce(
    (sum: number, sub: { plan: string }) => {
      if (sub.plan === "PRO") return sum + 29;
      if (sub.plan === "ENTERPRISE") return sum + 99;
      return sum;
    },
    0
  );

  return {
    totalUsers,
    activeSubscriptions,
    monthlyRevenue: revenueEstimate,
  };
}

export default async function AdminDashboardPage() {
  const stats = await getStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your application metrics.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Registered accounts
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
            <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">Paying customers</p>
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
            <div className="text-2xl font-bold">${stats.monthlyRevenue}</div>
            <p className="text-xs text-muted-foreground">Estimated MRR</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
