/**
 * Billing Settings Page
 *
 * Subscription and payment management.
 */

import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDunningStatus } from "@/actions/billing/get-dunning-status";
import { getInvoices } from "@/actions/billing/get-invoices";
import {
  SubscriptionStatus,
  PaymentHistory,
  ManageSubscriptionButton,
  DunningBanner,
  RetryPaymentButton,
  UsageMeter,
} from "@/components/billing";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { subscription, usage } from "@/lib/schema";
import { PLAN_LIMITS } from "@/lib/stripe/config";

export const metadata = {
  title: "Billing Settings",
  description: "Manage your subscription and payment methods",
};

export default async function BillingPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Get subscription
  const [sub] = await db
    .select({
      id: subscription.id,
      plan: subscription.plan,
      status: subscription.status,
      currentPeriodEnd: subscription.stripeCurrentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      trialEnd: subscription.stripeTrialEnd,
      stripeCustomerId: subscription.stripeCustomerId,
    })
    .from(subscription)
    .where(eq(subscription.userId, userId))
    .limit(1);

  // Get current period for usage
  const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM format

  // Get usage data
  const [usageData] = await db
    .select({
      apiCalls: usage.apiCalls,
      projectsCount: usage.projectsCount,
      storageBytes: usage.storageBytes,
      teamMembers: usage.teamMembers,
      period: usage.period,
    })
    .from(usage)
    .where(eq(usage.userId, userId))
    .limit(1);

  // Get invoices
  const invoicesResult = await getInvoices(10);
  const invoices = invoicesResult.success ? invoicesResult.invoices : [];

  // Get dunning status
  const dunningResult = await getDunningStatus();

  const plan = sub?.plan ?? "FREE";
  const hasSubscription = !!sub?.stripeCustomerId;
  const isPastDue = sub?.status === "PAST_DUE";

  const usageWithLimits = {
    usage: usageData ?? {
      apiCalls: 0,
      projectsCount: 0,
      storageBytes: BigInt(0),
      teamMembers: 0,
      period: currentPeriod,
    },
    limits: PLAN_LIMITS[plan],
  };

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and payment methods
        </p>
      </div>

      {/* Dunning Banner */}
      {dunningResult.success && dunningResult.status.isInDunning && (
        <DunningBanner status={dunningResult.status} className="mb-8" />
      )}

      <div className="grid gap-8">
        {/* Subscription Status */}
        <SubscriptionStatus
          plan={plan}
          status={sub?.status ?? "INACTIVE"}
          currentPeriodEnd={sub?.currentPeriodEnd ?? null}
          cancelAtPeriodEnd={sub?.cancelAtPeriodEnd ?? false}
          trialEnd={sub?.trialEnd ?? null}
        />

        {/* Actions */}
        <div className="flex flex-wrap gap-4">
          {isPastDue && <RetryPaymentButton />}
          <ManageSubscriptionButton hasSubscription={hasSubscription} />
          {!hasSubscription && (
            <Button asChild>
              <Link href="/pricing">Upgrade Plan</Link>
            </Button>
          )}
        </div>

        {/* Usage */}
        <UsageMeter usage={usageWithLimits} />

        {/* Payment History */}
        <PaymentHistory invoices={invoices} />
      </div>
    </div>
  );
}
