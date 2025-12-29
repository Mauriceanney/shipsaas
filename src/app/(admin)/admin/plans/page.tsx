import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/lib/db";

async function getPlanStats() {
  const stats = await db.subscription.groupBy({
    by: ["plan"],
    _count: {
      plan: true,
    },
    where: {
      status: "ACTIVE",
    },
  });

  return stats.reduce(
    (acc: Record<string, number>, stat) => {
      acc[stat.plan] = stat._count?.plan ?? 0;
      return acc;
    },
    {} as Record<string, number>
  );
}

const plans = [
  {
    name: "Free",
    plan: "FREE",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: ["Basic features", "1 project", "Community support"],
  },
  {
    name: "Pro",
    plan: "PRO",
    monthlyPrice: 29,
    yearlyPrice: 290,
    features: [
      "All Free features",
      "Unlimited projects",
      "Priority support",
      "Advanced analytics",
    ],
  },
  {
    name: "Enterprise",
    plan: "ENTERPRISE",
    monthlyPrice: 99,
    yearlyPrice: 990,
    features: [
      "All Pro features",
      "Custom integrations",
      "Dedicated support",
      "SLA guarantee",
    ],
  },
];

export default async function PlansPage() {
  const planStats = await getPlanStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Plan Configuration</h1>
        <p className="text-muted-foreground">
          View and manage subscription plans.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.plan}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{plan.name}</CardTitle>
                <Badge variant="secondary">
                  {planStats[plan.plan] || 0} active
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <span className="text-3xl font-bold">${plan.monthlyPrice}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-2 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <span className="mr-2 text-green-500">+</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plan Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Monthly Price</TableHead>
                <TableHead>Yearly Price</TableHead>
                <TableHead>Active Subscribers</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.plan}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell>${plan.monthlyPrice}</TableCell>
                  <TableCell>${plan.yearlyPrice}</TableCell>
                  <TableCell>{planStats[plan.plan] || 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
