import { z } from "zod";

export const applyCouponSchema = z.object({
  code: z
    .string()
    .min(1, "Promo code is required")
    .max(50, "Promo code is too long")
    .toUpperCase()
    .transform((val) => val.trim()),
  priceId: z.string().min(1, "Price ID is required"),
});

export const createCouponSchema = z
  .object({
    code: z
      .string()
      .min(3, "Code must be at least 3 characters")
      .max(50, "Code is too long")
      .regex(
        /^[A-Z0-9_-]+$/i,
        "Code can only contain letters, numbers, hyphens, and underscores"
      )
      .toUpperCase()
      .transform((val) => val.trim()),
    description: z.string().max(500).optional(),
    discountType: z.enum(["PERCENTAGE", "FIXED"]),
    discountValue: z.number().int().positive("Discount value must be positive"),
    currency: z.string().length(3, "Currency must be 3 characters").optional(),
    maxRedemptions: z
      .number()
      .int()
      .min(0, "Max redemptions must be 0 or greater")
      .optional(),
    expiresAt: z.date().optional(),
    notes: z.string().max(1000).optional(),
  })
  .refine(
    (data) => {
      if (data.discountType === "PERCENTAGE") {
        return data.discountValue <= 100;
      }
      return true;
    },
    {
      message: "Percentage discount cannot exceed 100%",
      path: ["discountValue"],
    }
  )
  .refine(
    (data) => {
      if (data.discountType === "FIXED") {
        return !!data.currency;
      }
      return true;
    },
    {
      message: "Currency is required for fixed discounts",
      path: ["currency"],
    }
  );

export const updateCouponSchema = z.object({
  active: z.boolean().optional(),
  maxRedemptions: z.number().int().min(0).optional(),
  expiresAt: z.date().optional(),
  notes: z.string().max(1000).optional(),
});

// Type exports
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;
export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
