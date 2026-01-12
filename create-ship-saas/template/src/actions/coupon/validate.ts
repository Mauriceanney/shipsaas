"use server";

/**
 * Validate Promotion Code
 *
 * Validates a promotion code and returns discount information.
 */

import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { promotionCode, promotionUsage } from "@/lib/schema";
import type { ValidatePromoResult } from "@/lib/stripe/types";

/**
 * Validate a promotion code
 */
export async function validatePromotionCode(
  code: string
): Promise<ValidatePromoResult> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = session.user.id;

  if (!code || code.trim().length === 0) {
    return { success: true, valid: false, reason: "Code is required" };
  }

  const normalizedCode = code.trim().toUpperCase();

  try {
    // Find the promotion code
    const [promo] = await db
      .select({
        id: promotionCode.id,
        discountType: promotionCode.discountType,
        discountValue: promotionCode.discountValue,
        currency: promotionCode.currency,
        active: promotionCode.active,
        maxRedemptions: promotionCode.maxRedemptions,
        timesRedeemed: promotionCode.timesRedeemed,
        expiresAt: promotionCode.expiresAt,
      })
      .from(promotionCode)
      .where(
        and(
          eq(promotionCode.code, normalizedCode),
          eq(promotionCode.active, true)
        )
      )
      .limit(1);

    if (!promo) {
      return { success: true, valid: false, reason: "Invalid promotion code" };
    }

    // Check if expired
    if (promo.expiresAt && promo.expiresAt < new Date()) {
      return { success: true, valid: false, reason: "This code has expired" };
    }

    // Check redemption limit
    if (promo.maxRedemptions > 0 && promo.timesRedeemed >= promo.maxRedemptions) {
      return {
        success: true,
        valid: false,
        reason: "This code has reached its usage limit",
      };
    }

    // Check if user already used this code
    const [existingUsage] = await db
      .select({ id: promotionUsage.id })
      .from(promotionUsage)
      .where(
        and(
          eq(promotionUsage.promotionCodeId, promo.id),
          eq(promotionUsage.userId, userId)
        )
      )
      .limit(1);

    if (existingUsage) {
      return {
        success: true,
        valid: false,
        reason: "You have already used this code",
      };
    }

    // Code is valid
    return {
      success: true,
      valid: true,
      discount: {
        type: promo.discountType === "PERCENTAGE" ? "percentage" : "fixed",
        value: promo.discountValue,
        ...(promo.currency ? { currency: promo.currency } : {}),
      },
    };
  } catch (error) {
    console.error("[validatePromotionCode] Error:", error);
    return { success: false, error: "Failed to validate promotion code" };
  }
}
