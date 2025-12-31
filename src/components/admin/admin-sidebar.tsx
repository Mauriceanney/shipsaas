"use client";

import {
  ArrowLeft,
  BarChart3,
  CreditCard,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ICON_SIZES } from "@/lib/constants/ui";
import { cn } from "@/lib/utils";

import type { Route } from "next";

interface NavItem {
  title: string;
  href: Route;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/admin" as Route,
    icon: LayoutDashboard,
  },
  {
    title: "Analytics",
    href: "/admin/analytics" as Route,
    icon: BarChart3,
  },
  {
    title: "Users",
    href: "/admin/users" as Route,
    icon: Users,
  },
  {
    title: "Plans",
    href: "/admin/plans" as Route,
    icon: CreditCard,
  },
  {
    title: "Settings",
    href: "/admin/settings" as Route,
    icon: Settings,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-muted/40">
      <div className="flex h-14 items-center border-b px-4">
        <span className="text-lg font-semibold">Admin</span>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className={ICON_SIZES.sm} />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <ArrowLeft className={ICON_SIZES.sm} />
          Back to Dashboard
        </Link>
      </div>
    </aside>
  );
}
