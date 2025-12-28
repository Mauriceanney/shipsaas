"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Plan } from "@prisma/client";
import type { BillingInterval, PlanConfig } from "@/lib/stripe/types";
import { PLAN_PRICING } from "@/lib/stripe/config";

interface PricingCardProps {
  plan: PlanConfig;
  interval: BillingInterval;
  currentPlan?: Plan;
  isAuthenticated: boolean;
  onSubscribe: (priceId: string) => Promise<void>;
  onError: (error: string) => void;
}

export function PricingCard({
  plan,
  interval,
  currentPlan,
  isAuthenticated,
  onSubscribe,
  onError,
}: PricingCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const isCurrentPlan = currentPlan === plan.id;
  const isFree = plan.id === "FREE";
  const pricing = !isFree ? PLAN_PRICING[plan.id as Exclude<Plan, "FREE">] : null;
  const price = pricing ? pricing[interval] : 0;
  const priceId = plan.prices[interval];

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push("/login?callbackUrl=/pricing" as any);
      return;
    }

    if (isFree || isCurrentPlan) return;

    // Check if Stripe is configured
    if (!priceId) {
      onError("Stripe is not configured. Please set up your Stripe Price IDs.");
      return;
    }

    setIsLoading(true);
    try {
      await onSubscribe(priceId);
    } catch (err) {
      onError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    if (isCurrentPlan) return "Current Plan";
    if (isFree) return "Get Started";
    if (!isAuthenticated) return "Sign up";
    if (currentPlan === "FREE") return "Upgrade";
    if (currentPlan === "ENTERPRISE" && plan.id === "PRO") return "Downgrade";
    return "Subscribe";
  };

  return (
    <Card
      className={cn(
        "relative flex flex-col",
        plan.highlighted && "border-primary shadow-lg scale-105"
      )}
    >
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
            {plan.badge}
          </span>
        </div>
      )}

      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="text-center mb-6">
          <span className="text-4xl font-bold">${price}</span>
          {!isFree && (
            <span className="text-muted-foreground">
              /{interval === "monthly" ? "mo" : "yr"}
            </span>
          )}
        </div>

        <ul className="space-y-3">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          variant={plan.highlighted ? "default" : "outline"}
          disabled={isCurrentPlan || isLoading}
          onClick={handleSubscribe}
        >
          {isLoading ? "Loading..." : getButtonText()}
        </Button>
      </CardFooter>
    </Card>
  );
}
