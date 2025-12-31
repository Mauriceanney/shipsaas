"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { stripe } from "@/lib/stripe";
import { applyCouponSchema } from "@/lib/validations/coupon";

import type { Result } from "@/types";

export interface CouponValidationResult {
  promotionCodeId: string;
  discountInfo: string;
}

/**
 * Validate a promotion code for the pricing page
 * Returns the Stripe promotion code ID if valid
 */
export async function validateCouponAction(
  input: unknown
): Promise<Result<CouponValidationResult, string>> {
  // 1. Authentication
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  // 2. Validation
  const parsed = applyCouponSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Invalid input",
    };
  }

  const { code } = parsed.data;

  try {
    // 3. Check database for promo code
    const promoCode = await db.promotionCode.findUnique({
      where: { code },
    });

    if (!promoCode) {
      return { success: false, error: "Invalid promo code" };
    }

    // 4. Check if active
    if (!promoCode.active) {
      return { success: false, error: "This promo code is no longer valid" };
    }

    // 5. Check expiration
    if (promoCode.expiresAt && new Date() > promoCode.expiresAt) {
      return { success: false, error: "This promo code has expired" };
    }

    // 6. Check max redemptions (0 = unlimited)
    if (
      promoCode.maxRedemptions > 0 &&
      promoCode.timesRedeemed >= promoCode.maxRedemptions
    ) {
      return {
        success: false,
        error: "This promo code has reached its usage limit",
      };
    }

    // 7. Verify with Stripe (ensure it still exists and is active)
    try {
      const stripePromo = await stripe.promotionCodes.retrieve(
        promoCode.stripePromotionId
      );

      if (!stripePromo.active) {
        return { success: false, error: "This promo code is no longer valid" };
      }
    } catch {
      logger.warn(
        { code, stripePromotionId: promoCode.stripePromotionId },
        "Failed to verify promotion code with Stripe"
      );
      return { success: false, error: "This promo code is no longer valid" };
    }

    // 8. Build discount info for display
    let discountInfo: string;
    if (promoCode.discountType === "PERCENTAGE") {
      discountInfo = `${promoCode.discountValue}% off`;
    } else {
      const currency = promoCode.currency?.toUpperCase() ?? "USD";
      const amount = (promoCode.discountValue / 100).toFixed(2);
      discountInfo = `${currency} ${amount} off`;
    }

    return {
      success: true,
      data: {
        promotionCodeId: promoCode.stripePromotionId,
        discountInfo,
      },
    };
  } catch (error) {
    logger.error({ err: error, code }, "Failed to validate coupon");
    return { success: false, error: "Failed to validate promo code" };
  }
}
