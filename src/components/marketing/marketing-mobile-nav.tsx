"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
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

interface MarketingMobileNavProps {
  isAuthenticated: boolean;
}

export function MarketingMobileNav({ isAuthenticated }: MarketingMobileNavProps) {
  const [open, setOpen] = useState(false);

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
      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>

        <nav className="mt-6 flex flex-col gap-4">
          <Link
            href="/pricing"
            onClick={() => setOpen(false)}
            className="text-lg font-medium hover:text-primary transition-colors"
          >
            Pricing
          </Link>

          <div className="border-t pt-4 mt-2 space-y-3">
            {isAuthenticated ? (
              <Button asChild className="w-full" onClick={() => setOpen(false)}>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="outline" asChild className="w-full" onClick={() => setOpen(false)}>
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild className="w-full" onClick={() => setOpen(false)}>
                  <Link href="/login">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
