import { Suspense } from "react";

import { listCouponsAction } from "@/actions/admin/coupon";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";

import { CouponList } from "./coupon-list";
import { CreateCouponDialog } from "./create-coupon-dialog";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Promo Codes - Admin",
  description: "Manage promo codes and discounts",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

async function CouponsContent() {
  const coupons = await listCouponsAction();

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <CreateCouponDialog />
      </div>
      <CouponList coupons={coupons} />
    </div>
  );
}

export default function CouponsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Promo Codes"
        description="Create and manage promotional discount codes"
      />

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-8">
            <Spinner size="lg" />
          </div>
        }
      >
        <CouponsContent />
      </Suspense>
    </div>
  );
}
