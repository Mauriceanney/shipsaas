import Link from "next/link";
import { redirect } from "next/navigation";

import { ManageSubscriptionButton, SubscriptionStatus } from "@/components/billing";
import { UpgradeBanner } from "@/components/feature-gate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

import type { SubscriptionInfo } from "@/lib/stripe/types";

// Force dynamic rendering - this page requires database access
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Billing",
  description: "Manage your subscription and billing",
};

export default async function BillingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const subscription = await db.subscription.findUnique({
    where: { userId: session.user.id },
  });

  const subscriptionInfo: SubscriptionInfo | null = subscription
    ? {
        status: subscription.status,
        plan: subscription.plan,
        currentPeriodEnd: subscription.stripeCurrentPeriodEnd,
        cancelAtPeriodEnd: false, // Will be fetched on client side
        stripeCustomerId: subscription.stripeCustomerId,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
      }
    : null;

  const hasActiveSubscription = subscription?.stripeCustomerId != null;
  const isFreePlan = !subscription || subscription.plan === "FREE";
  const isPro = subscription?.plan === "PRO";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing details
        </p>
      </div>

      {/* Upgrade Banner for FREE users */}
      {isFreePlan && (
        <UpgradeBanner
          title="Unlock Premium Features"
          description="Get priority support, advanced analytics, and unlimited access with Pro."
          variant="gradient"
        />
      )}

      {/* Upgrade Banner for PRO users to Enterprise */}
      {isPro && (
        <UpgradeBanner
          requiredPlan="ENTERPRISE"
          title="Scale with Enterprise"
          description="Get dedicated support, custom integrations, and SLA guarantees."
          variant="subtle"
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            Your current subscription plan and status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <SubscriptionStatus subscription={subscriptionInfo} />

          <div className="flex flex-wrap gap-4">
            <ManageSubscriptionButton hasSubscription={hasActiveSubscription} />

            {/* Show upgrade button for all plans except ENTERPRISE (highest plan) */}
            {subscription?.plan !== "ENTERPRISE" && (
              <Button asChild>
                <Link href="/pricing">Upgrade Plan</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>
            View and download your past invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasActiveSubscription ? (
            <p className="text-sm text-muted-foreground">
              Click &quot;Manage Subscription&quot; to view your billing history and download invoices.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No billing history yet. Subscribe to a plan to get started.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
