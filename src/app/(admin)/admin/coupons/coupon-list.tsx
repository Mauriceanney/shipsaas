"use client";

import type { ColumnDef } from "@tanstack/react-table";

import type { listCouponsAction } from "@/actions/admin/coupon";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";

import { CouponActions } from "./coupon-actions";

type Coupon = Awaited<ReturnType<typeof listCouponsAction>>[number];

const columns: ColumnDef<Coupon>[] = [
  {
    accessorKey: "code",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Code" />
    ),
    cell: ({ row }) => (
      <span className="font-mono font-semibold">{row.getValue("code")}</span>
    ),
  },
  {
    id: "discount",
    header: "Discount",
    cell: ({ row }) => {
      const coupon = row.original;
      if (coupon.discountType === "PERCENTAGE") {
        return coupon.discountValue + "%";
      }
      const currency = coupon.currency?.toUpperCase() ?? "USD";
      const amount = (coupon.discountValue / 100).toFixed(2);
      return currency + " " + amount;
    },
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const coupon = row.original;
      const isExpired = coupon.expiresAt && new Date() > coupon.expiresAt;
      const isMaxedOut =
        coupon.maxRedemptions > 0 &&
        coupon.timesRedeemed >= coupon.maxRedemptions;

      if (!coupon.active) {
        return <Badge variant="secondary">Inactive</Badge>;
      }
      if (isExpired) {
        return <Badge variant="destructive">Expired</Badge>;
      }
      if (isMaxedOut) {
        return <Badge variant="outline">Max Used</Badge>;
      }
      return <Badge variant="default">Active</Badge>;
    },
  },
  {
    id: "used",
    header: "Used",
    cell: ({ row }) => {
      const coupon = row.original;
      return (
        "" +
        coupon._count.usages +
        (coupon.maxRedemptions > 0 ? " / " + coupon.maxRedemptions : "")
      );
    },
  },
  {
    accessorKey: "expiresAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Expires" />
    ),
    cell: ({ row }) => {
      const date = row.getValue("expiresAt") as Date | null;
      return date ? new Date(date).toLocaleDateString() : "Never";
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <CouponActions coupon={row.original} />,
  },
];

interface CouponListProps {
  coupons: Awaited<ReturnType<typeof listCouponsAction>>;
}

export function CouponList({ coupons }: CouponListProps) {
  if (coupons.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            No promo codes created yet. Create your first promo code to get
            started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={coupons}
      searchKey="code"
      searchPlaceholder="Search codes..."
    />
  );
}
