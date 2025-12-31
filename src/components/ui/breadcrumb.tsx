import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
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
    ? [{ label: "Home", href: "/dashboard" }, ...items]
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
                    <Home className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">{item.label}</span>
                  </Link>
                ) : (
                  <span className="flex items-center">
                    <Home className="h-4 w-4" aria-hidden="true" />
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
                  className="h-4 w-4 text-muted-foreground/50"
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
