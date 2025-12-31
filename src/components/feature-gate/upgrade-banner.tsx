"use client";

/**
 * Upgrade Banner Component
 * A horizontal banner for promoting upgrades at the top of sections
 */

import { ArrowRight, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type UpgradeBannerProps = {
  requiredPlan?: "PLUS" | "PRO";
  title?: string;
  description?: string;
  feature?: string;
  dismissible?: boolean;
  variant?: "default" | "gradient" | "subtle";
  className?: string;
};

/**
 * UpgradeBanner - Horizontal banner for upgrade CTAs
 *
 * Place at the top of sections or pages to promote upgrades.
 * Can be dismissible for better UX.
 *
 * @example
 * ```tsx
 * <UpgradeBanner
 *   feature="Advanced Analytics"
 *   description="Get detailed insights and reports"
 *   dismissible
 * />
 * ```
 */
export function UpgradeBanner({
  requiredPlan = "PLUS",
  title,
  description,
  feature,
  dismissible = false,
  variant = "default",
  className,
}: UpgradeBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const planDisplayName = requiredPlan === "PLUS" ? "Pro" : "Enterprise";
  const displayTitle = title ?? (feature ? `Unlock ${feature}` : `Upgrade to ${planDisplayName}`);
  const displayDescription =
    description ??
    `Get access to ${feature ?? "premium features"} with our ${planDisplayName} plan.`;
  const pricingUrl = `/pricing?source=upgrade_banner&plan=${requiredPlan}`;

  const variants = {
    default: "bg-primary/5 border-primary/20",
    gradient: "bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20",
    subtle: "bg-muted border-border",
  };

  return (
    <div
      className={cn(
        "relative flex items-center justify-between gap-4 rounded-lg border p-4",
        variants[variant],
        className
      )}
      role="region"
      aria-label="Upgrade promotion"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{displayTitle}</h3>
          <p className="text-sm text-muted-foreground">{displayDescription}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button asChild>
          <Link href={pricingUrl}>
            Upgrade
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
        {dismissible && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsVisible(false)}
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
