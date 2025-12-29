"use client";

import { useState } from "react";

import { calculateYearlySavings, PLAN_PRICING } from "@/lib/stripe/config";

import { PricingCard } from "./pricing-card";
import { PricingToggle } from "./pricing-toggle";

import type { BillingInterval, PlanConfig } from "@/lib/stripe/types";
import type { Plan } from "@prisma/client";

interface PricingTableProps {
  planConfigs: PlanConfig[];
  currentPlan?: Plan;
  isAuthenticated: boolean;
}

export function PricingTable({ planConfigs, currentPlan, isAuthenticated }: PricingTableProps) {
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [error, setError] = useState<string | null>(null);

  const savingsPercent = calculateYearlySavings(
    PLAN_PRICING.PRO.monthly,
    PLAN_PRICING.PRO.yearly
  );

  const handleSubscribe = async (priceId: string) => {
    setError(null);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  return (
    <div className="space-y-8">
      <PricingToggle
        interval={interval}
        onIntervalChange={setInterval}
        savingsPercent={savingsPercent}
      />

      {error && (
        <div className="text-center text-destructive text-sm">{error}</div>
      )}

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {planConfigs.map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            interval={interval}
            currentPlan={currentPlan}
            isAuthenticated={isAuthenticated}
            onSubscribe={handleSubscribe}
            onError={setError}
          />
        ))}
      </div>
    </div>
  );
}
