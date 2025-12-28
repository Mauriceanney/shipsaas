"use client";

import { cn } from "@/lib/utils";
import type { BillingInterval } from "@/lib/stripe/types";

interface PricingToggleProps {
  interval: BillingInterval;
  onIntervalChange: (interval: BillingInterval) => void;
  savingsPercent?: number;
}

export function PricingToggle({
  interval,
  onIntervalChange,
  savingsPercent = 17,
}: PricingToggleProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={() => onIntervalChange("monthly")}
        className={cn(
          "text-sm font-medium transition-colors",
          interval === "monthly"
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Monthly
      </button>

      <button
        onClick={() =>
          onIntervalChange(interval === "monthly" ? "yearly" : "monthly")
        }
        className={cn(
          "relative w-14 h-7 rounded-full transition-colors",
          interval === "yearly" ? "bg-primary" : "bg-muted"
        )}
        aria-label="Toggle billing interval"
      >
        <span
          className={cn(
            "absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform",
            interval === "yearly" && "translate-x-7"
          )}
        />
      </button>

      <button
        onClick={() => onIntervalChange("yearly")}
        className={cn(
          "text-sm font-medium transition-colors flex items-center gap-2",
          interval === "yearly"
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Yearly
        <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
          Save {savingsPercent}%
        </span>
      </button>
    </div>
  );
}
