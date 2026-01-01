"use client";

import { Bell, CreditCard, FileText, Key, Menu, Monitor, Shield, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ICON_SIZES } from "@/lib/constants/ui";
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
      {
        title: "API Keys",
        href: "/settings/api-keys" as Route,
        icon: Key,
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

export function SettingsMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Use prefix matching for active state (handles nested routes)
  const isActiveRoute = (href: string) => {
    if (href === "/settings") {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open settings menu"
        >
          <Menu className={ICON_SIZES.md} />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b p-4">
          <SheetTitle className="text-left">Settings</SheetTitle>
        </SheetHeader>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-6" aria-label="Settings navigation">
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
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors min-h-[44px]",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <Icon className={ICON_SIZES.md} aria-hidden="true" />
                      <span>{item.title}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
