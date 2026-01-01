"use client";

/**
 * Inline Upgrade Prompt Component
 * A compact, inline prompt to encourage users to upgrade their plan
 */

import { ArrowRight, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

type UpgradePromptProps = {
  requiredPlan?: "PLUS" | "PRO";
  message?: string;
  variant?: "default" | "subtle" | "highlight";
  size?: "sm" | "md";
  className?: string;
};

/**
 * UpgradePrompt - Compact inline upgrade CTA
 *
 * Designed for inline use in lists, sidebars, and sections where
 * a full UpgradeCard would be too prominent.
 *
 * @example
 * ```tsx
 * // In a feature list
 * <li className="flex items-center gap-2">
 *   <span>Advanced Analytics</span>
 *   <UpgradePrompt size="sm" message="Pro" />
 * </li>
 * ```
 */
export function UpgradePrompt({
  requiredPlan = "PLUS",
  message,
  variant = "default",
  size = "md",
  className,
}: UpgradePromptProps) {
  const planDisplayName = requiredPlan === "PLUS" ? "Pro" : "Enterprise";
  const displayMessage = message ?? `Upgrade to ${planDisplayName}`;
  const pricingUrl = `/pricing?source=upgrade_prompt&plan=${requiredPlan}`;

  const variants = {
    default: "bg-primary/5 hover:bg-primary/10 border-primary/20",
    subtle: "bg-muted/50 hover:bg-muted border-transparent",
    highlight:
      "bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/15 hover:to-primary/10 border-primary/20",
  };

  const sizes = {
    sm: "px-2 py-1 text-xs gap-1",
    md: "px-3 py-1.5 text-sm gap-1.5",
  };

  return (
    <a
      href={pricingUrl}
      className={cn(
        "inline-flex items-center rounded-full border transition-colors",
        variants[variant],
        sizes[size],
        className
      )}
    >
      <Sparkles
        className={cn("text-primary", size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")}
        aria-hidden="true"
      />
      <span className="font-medium text-foreground">{displayMessage}</span>
      <ArrowRight
        className={cn(
          "text-muted-foreground",
          size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"
        )}
        aria-hidden="true"
      />
    </a>
  );
}
