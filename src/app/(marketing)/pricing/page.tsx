import { Suspense } from "react";

import { PricingTable } from "@/components/pricing";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLAN_CONFIGS } from "@/lib/stripe/config";

import type { Plan } from "@prisma/client";

export const metadata = {
  title: "Pricing",
  description: "Choose the plan that's right for you",
};

async function PricingContent() {
  const session = await auth();
  let currentPlan: Plan = "FREE";

  if (session?.user?.id) {
    const subscription = await db.subscription.findUnique({
      where: { userId: session.user.id },
    });
    if (subscription) {
      currentPlan = subscription.plan;
    }
  }

  // Pass plan configs from server (where env vars are available)
  return (
    <PricingTable
      planConfigs={PLAN_CONFIGS}
      currentPlan={currentPlan}
      isAuthenticated={!!session?.user}
    />
  );
}

export default function PricingPage() {
  return (
    <div className="container py-20">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Choose the plan that&apos;s right for you. All plans include a 14-day free trial.
        </p>
      </div>

      <Suspense fallback={<div className="text-center">Loading pricing...</div>}>
        <PricingContent />
      </Suspense>
    </div>
  );
}
