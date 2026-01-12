"use client";

/**
 * Pricing Card Component
 *
 * Displays a single plan with pricing and features.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createCheckoutSession } from "@/actions/stripe/create-checkout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPrice } from "@/lib/stripe/config";
import type { PlanConfig, BillingCycle } from "@/lib/stripe/types";
import { cn } from "@/lib/utils";

export interface PricingCardProps {
  plan: PlanConfig;
  isAuthenticated: boolean;
}

export function PricingCard({ plan, isAuthenticated }: PricingCardProps) {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [isPending, startTransition] = useTransition();

  const isFree = plan.plan === "FREE";
  const price = billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
  const monthlyEquivalent = billingCycle === "yearly" ? plan.yearlyPrice / 12 : plan.monthlyPrice;
  const yearlySavings = plan.monthlyPrice * 12 - plan.yearlyPrice;

  function handleSubscribe() {
    if (!isAuthenticated) {
      router.push("/login?redirect=/pricing");
      return;
    }

    if (isFree) {
      router.push("/dashboard");
      return;
    }

    startTransition(async () => {
      const result = await createCheckoutSession({
        plan: plan.plan as "PLUS" | "PRO",
        billingCycle,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      // Redirect to Stripe checkout
      window.location.href = result.url;
    });
  }

  return (
    <Card
      className={cn(
        "flex flex-col",
        plan.isPopular && "border-primary shadow-lg"
      )}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{plan.name}</CardTitle>
          {plan.isPopular && <Badge>Most Popular</Badge>}
        </div>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-6">
        {!isFree && (
          <Tabs
            value={billingCycle}
            onValueChange={(v: string) => setBillingCycle(v as BillingCycle)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">
                Yearly
                {yearlySavings > 0 && (
                  <span className="ml-1 text-xs text-green-600 dark:text-green-400">
                    Save {formatPrice(yearlySavings)}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        <div className="text-center">
          <span className="text-4xl font-bold">
            {isFree ? "Free" : formatPrice(monthlyEquivalent)}
          </span>
          {!isFree && (
            <span className="text-muted-foreground">/month</span>
          )}
          {billingCycle === "yearly" && !isFree && (
            <p className="mt-1 text-sm text-muted-foreground">
              Billed {formatPrice(price)} yearly
            </p>
          )}
        </div>

        <ul className="space-y-3">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          variant={plan.isPopular ? "default" : "outline"}
          onClick={handleSubscribe}
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : isFree ? (
            isAuthenticated ? "Current Plan" : "Get Started"
          ) : (
            "Subscribe"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default PricingCard;
