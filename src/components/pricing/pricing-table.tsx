"use client";

import { useState } from "react";

import { calculateYearlySavings, PLAN_PRICING } from "@/lib/stripe/config";

import { CouponInput } from "./coupon-input";
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
  const [promotionCodeId, setPromotionCodeId] = useState<string | null>(null);
  const [discountInfo, setDiscountInfo] = useState<string | null>(null);

  const savingsPercent = calculateYearlySavings(
    PLAN_PRICING.PLUS.monthly,
    PLAN_PRICING.PLUS.yearly
  );

  // Get a price ID for coupon validation (use PLUS monthly as default)
  const defaultPriceId = planConfigs.find((p) => p.id === "PLUS")?.prices.monthly || "";

  const handleSubscribe = async (priceId: string) => {
    setError(null);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId,
          promotionCode: promotionCodeId || undefined,
        }),
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

  const handleApplyCoupon = (promoCodeId: string, discount: string) => {
    setPromotionCodeId(promoCodeId);
    setDiscountInfo(discount);
  };

  const handleRemoveCoupon = () => {
    setPromotionCodeId(null);
    setDiscountInfo(null);
  };

  return (
    <div className="space-y-8">
      <PricingToggle
        interval={interval}
        onIntervalChange={setInterval}
        savingsPercent={savingsPercent}
      />

      {/* Coupon input - only show for authenticated users */}
      {isAuthenticated && defaultPriceId && (
        <div className="max-w-sm mx-auto">
          <CouponInput
            priceId={defaultPriceId}
            onApply={handleApplyCoupon}
            onRemove={handleRemoveCoupon}
          />
        </div>
      )}

      {error && (
        <div className="text-center text-destructive text-sm">{error}</div>
      )}

      {/* Show applied discount reminder */}
      {discountInfo && (
        <div className="text-center text-sm text-green-600">
          Your discount ({discountInfo}) will be applied at checkout
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
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
