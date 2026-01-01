"use client";

import { cn } from "@/lib/utils";

interface CharacterCountProps {
  current: number;
  max: number;
  className?: string;
}

export function CharacterCount({
  current,
  max,
  className,
}: CharacterCountProps) {
  const percentage = (current / max) * 100;
  const isWarning = percentage >= 80 && percentage < 100;
  const isDanger = percentage >= 100;

  return (
    <p
      className={cn(
        "text-xs",
        {
          "text-muted-foreground": !isWarning && !isDanger,
          "text-yellow-600 dark:text-yellow-500": isWarning,
          "text-destructive": isDanger,
        },
        className
      )}
      aria-live="polite"
      aria-atomic="true"
    >
      {current} / {max}
    </p>
  );
}
