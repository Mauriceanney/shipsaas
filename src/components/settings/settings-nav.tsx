"use client";

/**
 * Settings Navigation Component
 * Left sidebar navigation for settings pages
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

const navItems: NavItem[] = [
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
  {
    title: "Privacy",
    href: "/settings/privacy" as Route,
    icon: FileText,
  },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

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
          >
            <Icon className="h-4 w-4" />
            <span>{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}
