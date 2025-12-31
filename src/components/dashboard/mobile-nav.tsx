"use client";

import { Home, Menu, Moon, Settings, Sparkles, Sun, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useState } from "react";

import { logoutAction } from "@/actions/auth/logout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { ICON_SIZES } from "@/lib/constants/ui";
import { cn } from "@/lib/utils";

import type { Route } from "next";

interface NavItem {
  title: string;
  href: Route;
  icon: React.ComponentType<{ className?: string }>;
}

const mainNavItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard" as Route, icon: Home },
  { title: "Settings", href: "/settings" as Route, icon: Settings },
];

interface MobileNavProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  subscription?: {
    plan: string;
    status: string;
  };
}

export function MobileNav({ user, subscription }: MobileNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  const isDark = resolvedTheme === "dark";
  const showUpgradePrompt = subscription?.plan !== "PRO";

  const initials = getInitials(user.name, user.email);

  const toggleDarkMode = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open menu"
        >
          <Menu className={ICON_SIZES.md} />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b p-4">
          <SheetTitle className="text-left">ShipSaaS</SheetTitle>
        </SheetHeader>

        {/* User info */}
        <div className="border-b p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {user.image && <AvatarImage src={user.image} alt={user.name || "User"} />}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user.name || "User"}</p>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Upgrade prompt */}
        {showUpgradePrompt && (
          <div className="border-b p-4">
            <Link
              href="/pricing"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 p-3 text-primary hover:from-primary/20 hover:to-primary/10 transition-colors"
            >
              <Sparkles className={ICON_SIZES.md} />
              <span className="font-medium">Upgrade Plan</span>
            </Link>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
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

        {/* Bottom section */}
        <div className="border-t p-4 space-y-4">
          {/* Dark mode toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isDark ? (
                <Moon className={cn(ICON_SIZES.md, "text-muted-foreground")} />
              ) : (
                <Sun className={cn(ICON_SIZES.md, "text-muted-foreground")} />
              )}
              <span className="text-sm font-medium">Dark mode</span>
            </div>
            <Switch
              checked={isDark}
              onCheckedChange={toggleDarkMode}
              aria-label="Toggle dark mode"
            />
          </div>

          {/* Sign out */}
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => {
              setOpen(false);
              logoutAction();
            }}
          >
            <LogOut className={cn("mr-2", ICON_SIZES.md)} />
            Sign out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "U";
}
