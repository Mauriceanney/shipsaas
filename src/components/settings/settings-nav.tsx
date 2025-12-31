"use client";

/**
 * Settings Navigation Component
 * Left sidebar navigation for settings pages with grouped sections
 */

import { Bell, CreditCard, FileText, Monitor, Shield, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import type { LucideIcon } from "lucide-react";
import type { Route } from "next";

interface NavItem {
  title: string;
  href: Route;
  icon: LucideIcon;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: "Account",
    items: [
      {
        title: "General",
        href: "/settings" as Route,
        icon: Monitor,
      },
      {
        title: "Profile",
        href: "/settings/profile" as Route,
        icon: User,
      },
      {
        title: "Security",
        href: "/settings/security" as Route,
        icon: Shield,
      },
    ],
  },
  {
    title: "Preferences",
    items: [
      {
        title: "Notifications",
        href: "/settings/notifications" as Route,
        icon: Bell,
      },
      {
        title: "Billing",
        href: "/settings/billing" as Route,
        icon: CreditCard,
      },
    ],
  },
  {
    title: "Legal",
    items: [
      {
        title: "Privacy",
        href: "/settings/privacy" as Route,
        icon: FileText,
      },
    ],
  },
];

export function SettingsNav() {
  const pathname = usePathname();

  // Use prefix matching for active state (handles nested routes)
  const isActiveRoute = (href: string) => {
    if (href === "/settings") {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="flex flex-col space-y-6" aria-label="Settings navigation">
      {navGroups.map((group) => (
        <div key={group.title}>
          <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {group.title}
          </h3>
          <div className="flex flex-col space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
