"use client";

import {
  ArrowLeft,
  CreditCard,
  LayoutDashboard,
  Menu,
  Settings,
  Users,
} from "lucide-react";
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

export function AdminMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open admin menu"
        >
          <Menu className={ICON_SIZES.md} />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b p-4">
          <SheetTitle className="text-left">Admin Panel</SheetTitle>
        </SheetHeader>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className={ICON_SIZES.md} />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* Back to Dashboard */}
        <div className="border-t p-4">
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <ArrowLeft className={ICON_SIZES.md} />
            Back to Dashboard
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
