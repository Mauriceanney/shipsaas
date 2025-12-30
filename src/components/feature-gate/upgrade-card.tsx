"use client";

import { ArrowRight, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type UpgradeCardProps = {
  requiredPlan: "PRO" | "ENTERPRISE";
  title?: string;
  description?: string;
};

/**
 * UpgradeCard component - Shows an upgrade CTA for feature-gated content
 *
 * Displays a card prompting users to upgrade their plan to access the feature.
 * Links to the pricing page with UTM parameters for tracking.
 */
export function UpgradeCard({
  requiredPlan,
  title,
  description,
}: UpgradeCardProps) {
  // Format plan name for display (PRO -> Pro, ENTERPRISE -> Enterprise)
  const planDisplayName = requiredPlan === "PRO" ? "Pro" : "Enterprise";

  // Default title and description
  const cardTitle = title ?? `Upgrade to ${planDisplayName}`;
  const cardDescription =
    description ??
    `Unlock this feature and many more by upgrading to our ${planDisplayName} plan.`;

  // Pricing page URL with UTM parameters
  const pricingUrl = `/pricing?source=feature_gate&plan=${requiredPlan}`;

  return (
    <Card className="border-dashed">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Lock className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        </div>
        <CardTitle>{cardTitle}</CardTitle>
        <CardDescription>{cardDescription}</CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-sm text-muted-foreground">
          Get access to this feature and unlock the full potential of our platform.
        </p>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button asChild>
          <a href={pricingUrl}>
            Upgrade to {planDisplayName}
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
