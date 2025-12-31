import { Suspense } from "react";

import { getPlanConfigs } from "@/actions/admin/config";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { db } from "@/lib/db";

import { PlanConfigForm } from "./plan-config-form";

// Force dynamic rendering - this page requires database access
export const dynamic = "force-dynamic";

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

async function PlansContent() {
  const [configs, stats] = await Promise.all([
    getPlanConfigs(),
    getPlanStats(),
  ]);

  // Create a map for easy lookup
  const configMap = configs.reduce(
    (acc, config) => {
      acc[config.plan] = config;
      return acc;
    },
    {} as Record<string, (typeof configs)[0]>
  );

  const plans = ["FREE", "PLUS", "PRO"] as const;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const config = configMap[plan];
          return (
            <Card key={plan}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{config?.name || plan}</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="secondary">
                      {stats[plan] || 0} active
                    </Badge>
                    {config?.isActive === false && (
                      <Badge variant="destructive">Disabled</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <span className="text-3xl font-bold">
                    ${((config?.monthlyPrice || 0) / 100).toFixed(0)}
                  </span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                {config?.features && config.features.length > 0 ? (
                  <ul className="space-y-2 text-sm">
                    {config.features.map((feature) => (
                      <li key={feature} className="flex items-center">
                        <span className="mr-2 text-green-500">+</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No features configured
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plan Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <PlanConfigForm configs={configs} />
        </CardContent>
      </Card>
    </div>
  );
}

export default function PlansPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Plan Configuration"
        description="Configure subscription plans and map Stripe Price IDs."
      />

      <Suspense
        fallback={<div className="py-8 text-center">Loading plans...</div>}
      >
        <PlansContent />
      </Suspense>
    </div>
  );
}
