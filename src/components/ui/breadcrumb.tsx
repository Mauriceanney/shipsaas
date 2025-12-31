import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";

import { ICON_SIZES } from "@/lib/constants/ui";
import { cn } from "@/lib/utils";

import type { Route } from "next";

export interface BreadcrumbItem {
  label: string;
  href?: Route;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
  className?: string;
}

export function Breadcrumb({
  items,
  showHome = true,
  className,
}: BreadcrumbProps) {
  const allItems = showHome
    ? [{ label: "Home", href: "/dashboard" as Route }, ...items]
    : items;

  return (
    <nav aria-label="Breadcrumb" className={cn("mb-4", className)}>
      <ol className="flex items-center gap-1 text-sm text-muted-foreground">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const isFirst = index === 0;

          return (
            <li key={item.label} className="flex items-center gap-1">
              {isFirst && showHome ? (
                item.href ? (
                  <Link
                    href={item.href}
                    className="flex items-center hover:text-foreground transition-colors"
                  >
                    <Home className={ICON_SIZES.sm} aria-hidden="true" />
                    <span className="sr-only">{item.label}</span>
                  </Link>
                ) : (
                  <span className="flex items-center">
                    <Home className={ICON_SIZES.sm} aria-hidden="true" />
                    <span className="sr-only">{item.label}</span>
                  </span>
                )
              ) : isLast ? (
                <span
                  className="font-medium text-foreground"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : item.href ? (
                <Link
                  href={item.href}
                  className="hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span>{item.label}</span>
              )}
              {!isLast && (
                <ChevronRight
                  className={cn(ICON_SIZES.sm, "text-muted-foreground/50")}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
