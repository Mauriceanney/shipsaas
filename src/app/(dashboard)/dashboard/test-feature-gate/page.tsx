"use client";

import { useSession } from "next-auth/react";

import { FeatureGate } from "@/components/feature-gate";
import { UpgradeCard } from "@/components/feature-gate/upgrade-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestFeatureGatePage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="container mx-auto p-8">
        <p className="text-muted-foreground">Loading session...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-8 p-8">
      <div>
        <h1 className="text-2xl font-bold">Feature Gate Test Page</h1>
        <p className="text-muted-foreground">
          Test the feature gating system with your current subscription.
        </p>
      </div>

      {/* Current Subscription Info */}
      <Card>
        <CardHeader>
          <CardTitle>Your Current Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          {session?.subscription ? (
            <div className="space-y-2">
              <p>
                <strong>Plan:</strong> {session.subscription.plan}
              </p>
              <p>
                <strong>Status:</strong> {session.subscription.status}
              </p>
              <p>
                <strong>Period End:</strong>{" "}
                {session.subscription.stripeCurrentPeriodEnd
                  ? new Date(
                      session.subscription.stripeCurrentPeriodEnd
                    ).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">No subscription data found.</p>
          )}
        </CardContent>
      </Card>

      {/* PRO Feature Gate Test */}
      <Card>
        <CardHeader>
          <CardTitle>PRO Feature Gate</CardTitle>
        </CardHeader>
        <CardContent>
          <FeatureGate plan="PRO">
            <div className="rounded-lg bg-green-100 p-4 dark:bg-green-900">
              <p className="font-semibold text-green-800 dark:text-green-100">
                You have access to PRO features!
              </p>
              <p className="text-sm text-green-600 dark:text-green-200">
                This content is only visible to PRO and ENTERPRISE users.
              </p>
            </div>
          </FeatureGate>
        </CardContent>
      </Card>

      {/* ENTERPRISE Feature Gate Test */}
      <Card>
        <CardHeader>
          <CardTitle>ENTERPRISE Feature Gate</CardTitle>
        </CardHeader>
        <CardContent>
          <FeatureGate plan="ENTERPRISE">
            <div className="rounded-lg bg-purple-100 p-4 dark:bg-purple-900">
              <p className="font-semibold text-purple-800 dark:text-purple-100">
                You have access to ENTERPRISE features!
              </p>
              <p className="text-sm text-purple-600 dark:text-purple-200">
                This content is only visible to ENTERPRISE users.
              </p>
            </div>
          </FeatureGate>
        </CardContent>
      </Card>

      {/* Custom Fallback Test */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Fallback Example</CardTitle>
        </CardHeader>
        <CardContent>
          <FeatureGate
            plan="ENTERPRISE"
            fallback={
              <div className="rounded-lg border-2 border-dashed border-orange-300 bg-orange-50 p-4 dark:border-orange-700 dark:bg-orange-950">
                <p className="font-semibold text-orange-800 dark:text-orange-100">
                  Custom Fallback Message
                </p>
                <p className="text-sm text-orange-600 dark:text-orange-200">
                  This is a custom fallback instead of the default UpgradeCard.
                </p>
              </div>
            }
          >
            <div className="rounded-lg bg-purple-100 p-4 dark:bg-purple-900">
              <p className="font-semibold text-purple-800 dark:text-purple-100">
                ENTERPRISE content with custom fallback
              </p>
            </div>
          </FeatureGate>
        </CardContent>
      </Card>

      {/* Standalone UpgradeCard Examples */}
      <Card>
        <CardHeader>
          <CardTitle>UpgradeCard Components</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium">Default PRO UpgradeCard:</p>
            <UpgradeCard requiredPlan="PRO" />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">
              Custom ENTERPRISE UpgradeCard:
            </p>
            <UpgradeCard
              requiredPlan="ENTERPRISE"
              title="Unlock Advanced Analytics"
              description="Get detailed insights and custom reports with our Enterprise plan."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
