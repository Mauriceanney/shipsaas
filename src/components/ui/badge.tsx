import { cva } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

import type { VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        // Status variants for consistent status indication
        success:
          "border-transparent bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
        warning:
          "border-transparent bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
        error:
          "border-transparent bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
        info:
          "border-transparent bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
