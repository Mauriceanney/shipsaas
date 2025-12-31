"use client";

import { MoreHorizontal, Power, PowerOff } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { updateCouponAction } from "@/actions/admin/coupon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { listCouponsAction } from "@/actions/admin/coupon";

type Coupon = Awaited<ReturnType<typeof listCouponsAction>>[number];

interface CouponActionsProps {
  coupon: Coupon;
}

export function CouponActions({ coupon }: CouponActionsProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggleActive = () => {
    startTransition(async () => {
      const result = await updateCouponAction(coupon.id, {
        active: !coupon.active,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(
        coupon.active ? "Promo code deactivated" : "Promo code activated"
      );
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isPending}>
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleToggleActive}>
          {coupon.active ? (
            <>
              <PowerOff className="mr-2 h-4 w-4" />
              Deactivate
            </>
          ) : (
            <>
              <Power className="mr-2 h-4 w-4" />
              Activate
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
