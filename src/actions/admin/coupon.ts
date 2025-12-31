"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin";
import { createAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { stripe } from "@/lib/stripe";
import {
  createCouponSchema,
  updateCouponSchema,
} from "@/lib/validations/coupon";

import type { Result } from "@/types";

/**
 * Create a new promotion code (admin only)
 */
export async function createCouponAction(
  input: unknown
): Promise<Result<{ id: string }, string>> {
  // 1. Authentication & Authorization
  const session = await requireAdmin();

  // 2. Validation
  const parsed = createCouponSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Invalid input",
    };
  }

  const data = parsed.data;

  try {
    // 3. Check if code already exists
    const existing = await db.promotionCode.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      return { success: false, error: "Promo code already exists" };
    }

    // 4. Create coupon in Stripe
    const stripeCoupon = await stripe.coupons.create({
      name: data.description || data.code,
      ...(data.discountType === "PERCENTAGE"
        ? { percent_off: data.discountValue }
        : {
            amount_off: data.discountValue,
            currency: data.currency!.toLowerCase(),
          }),
      ...(data.expiresAt && {
        redeem_by: Math.floor(data.expiresAt.getTime() / 1000),
      }),
      ...(data.maxRedemptions &&
        data.maxRedemptions > 0 && {
          max_redemptions: data.maxRedemptions,
        }),
    });

    // 5. Create promotion code in Stripe
    const stripePromo = await stripe.promotionCodes.create({
      coupon: stripeCoupon.id,
      code: data.code,
      active: true,
    });

    // 6. Save to database
    const promotionCode = await db.promotionCode.create({
      data: {
        code: data.code,
        stripePromotionId: stripePromo.id,
        stripeCouponId: stripeCoupon.id,
        description: data.description,
        discountType: data.discountType,
        discountValue: data.discountValue,
        currency: data.currency?.toUpperCase(),
        maxRedemptions: data.maxRedemptions ?? 0,
        expiresAt: data.expiresAt,
        createdBy: session.user.id,
        notes: data.notes,
      },
    });

    // 7. Audit log
    await createAuditLog({
      entityType: "PromotionCode",
      entityId: promotionCode.id,
      action: "CREATE",
      changes: {
        code: { old: null, new: data.code },
        discountType: { old: null, new: data.discountType },
        discountValue: { old: null, new: data.discountValue },
      },
      userId: session.user.id,
      userEmail: session.user.email || "unknown",
    });

    // 8. Revalidate
    revalidatePath("/admin/coupons");

    return { success: true, data: { id: promotionCode.id } };
  } catch (error) {
    logger.error({ err: error, code: data.code }, "Failed to create coupon");
    return { success: false, error: "Failed to create promo code" };
  }
}

/**
 * Update an existing promotion code (admin only)
 */
export async function updateCouponAction(
  id: string,
  input: unknown
): Promise<Result<void, string>> {
  const session = await requireAdmin();

  const parsed = updateCouponSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Invalid input",
    };
  }

  const data = parsed.data;

  try {
    const existing = await db.promotionCode.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Promo code not found" };
    }

    // Update Stripe promotion code if active status changed
    if (data.active !== undefined && data.active !== existing.active) {
      await stripe.promotionCodes.update(existing.stripePromotionId, {
        active: data.active,
      });
    }

    // Update database
    await db.promotionCode.update({
      where: { id },
      data: {
        ...(data.active !== undefined && { active: data.active }),
        ...(data.maxRedemptions !== undefined && {
          maxRedemptions: data.maxRedemptions,
        }),
        ...(data.expiresAt !== undefined && { expiresAt: data.expiresAt }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });

    // Audit log
    const changes: Record<string, { old: unknown; new: unknown }> = {};
    if (data.active !== undefined && data.active !== existing.active) {
      changes["active"] = { old: existing.active, new: data.active };
    }
    if (
      data.maxRedemptions !== undefined &&
      data.maxRedemptions !== existing.maxRedemptions
    ) {
      changes["maxRedemptions"] = {
        old: existing.maxRedemptions,
        new: data.maxRedemptions,
      };
    }

    if (Object.keys(changes).length > 0) {
      await createAuditLog({
        entityType: "PromotionCode",
        entityId: id,
        action: "UPDATE",
        changes,
        userId: session.user.id,
        userEmail: session.user.email || "unknown",
      });
    }

    revalidatePath("/admin/coupons");
    return { success: true, data: undefined };
  } catch (error) {
    logger.error({ err: error, id }, "Failed to update coupon");
    return { success: false, error: "Failed to update promo code" };
  }
}

/**
 * List all promotion codes (admin only)
 */
export async function listCouponsAction() {
  await requireAdmin();

  const coupons = await db.promotionCode.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { usages: true },
      },
    },
  });

  return coupons;
}

/**
 * Get promotion code statistics (admin only)
 */
export async function getCouponStatsAction(id: string) {
  await requireAdmin();

  const coupon = await db.promotionCode.findUnique({
    where: { id },
    include: {
      usages: {
        orderBy: { createdAt: "desc" },
        take: 100,
      },
    },
  });

  if (!coupon) {
    return { success: false as const, error: "Coupon not found" };
  }

  const totalDiscountAmount = coupon.usages.reduce(
    (sum, usage) => sum + usage.discountAmount,
    0
  );

  return {
    success: true as const,
    data: {
      coupon,
      totalRedemptions: coupon.usages.length,
      totalDiscountAmount,
      recentUsages: coupon.usages,
    },
  };
}
