"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { CouponActions } from "./coupon-actions";

import type { listCouponsAction } from "@/actions/admin/coupon";

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
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Used</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.map((coupon) => {
              const isExpired =
                coupon.expiresAt && new Date() > coupon.expiresAt;
              const isMaxedOut =
                coupon.maxRedemptions > 0 &&
                coupon.timesRedeemed >= coupon.maxRedemptions;

              let discount: string;
              if (coupon.discountType === "PERCENTAGE") {
                discount = `${coupon.discountValue}%`;
              } else {
                const currency = coupon.currency?.toUpperCase() ?? "USD";
                const amount = (coupon.discountValue / 100).toFixed(2);
                discount = `${currency} ${amount}`;
              }

              return (
                <TableRow key={coupon.id}>
                  <TableCell className="font-mono font-semibold">
                    {coupon.code}
                  </TableCell>
                  <TableCell>{discount}</TableCell>
                  <TableCell>
                    {!coupon.active ? (
                      <Badge variant="secondary">Inactive</Badge>
                    ) : isExpired ? (
                      <Badge variant="destructive">Expired</Badge>
                    ) : isMaxedOut ? (
                      <Badge variant="outline">Max Used</Badge>
                    ) : (
                      <Badge variant="default">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {coupon._count.usages}
                    {coupon.maxRedemptions > 0
                      ? ` / ${coupon.maxRedemptions}`
                      : ""}
                  </TableCell>
                  <TableCell>
                    {coupon.expiresAt
                      ? new Date(coupon.expiresAt).toLocaleDateString()
                      : "Never"}
                  </TableCell>
                  <TableCell className="text-right">
                    <CouponActions coupon={coupon} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
