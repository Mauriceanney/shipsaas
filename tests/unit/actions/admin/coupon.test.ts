import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies BEFORE imports
const {
  mockRequireAdmin,
  mockDb,
  mockCreateAuditLog,
  mockStripe,
  mockLogger,
} = vi.hoisted(() => ({
  mockRequireAdmin: vi.fn(),
  mockDb: {
    promotionCode: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
  mockCreateAuditLog: vi.fn(),
  mockStripe: {
    coupons: {
      create: vi.fn(),
    },
    promotionCodes: {
      create: vi.fn(),
      update: vi.fn(),
    },
  },
  mockLogger: {
    error: vi.fn(),
  },
}));

vi.mock("@/lib/admin", () => ({
  requireAdmin: mockRequireAdmin,
}));

vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

vi.mock("@/lib/audit", () => ({
  createAuditLog: mockCreateAuditLog,
}));

vi.mock("@/lib/stripe", () => ({
  stripe: mockStripe,
}));

vi.mock("@/lib/logger", () => ({
  logger: mockLogger,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import {
  createCouponAction,
  updateCouponAction,
  listCouponsAction,
  getCouponStatsAction,
} from "@/actions/admin/coupon";

describe("admin/coupon actions", () => {
  const adminSession = {
    user: {
      id: "admin-1",
      email: "admin@example.com",
      role: "ADMIN",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue(adminSession);
    mockCreateAuditLog.mockResolvedValue(undefined);
  });

  describe("createCouponAction", () => {
    const validCouponData = {
      code: "SUMMER2024",
      description: "Summer sale",
      discountType: "PERCENTAGE" as const,
      discountValue: 20,
      maxRedemptions: 100,
      expiresAt: new Date("2024-12-31"),
      notes: "Internal notes",
    };

    it("requires admin access", async () => {
      const result = await createCouponAction(validCouponData);

      expect(mockRequireAdmin).toHaveBeenCalled();
    });

    it("returns error for code that is too short", async () => {
      const result = await createCouponAction({ 
        ...validCouponData,
        code: "AB" 
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Code must be at least 3 characters");
      }
      expect(mockStripe.coupons.create).not.toHaveBeenCalled();
    });

    it("returns error when code already exists", async () => {
      mockDb.promotionCode.findUnique.mockResolvedValue({
        id: "existing-1",
        code: "SUMMER2024",
      });

      const result = await createCouponAction(validCouponData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Promo code already exists");
      }
      expect(mockStripe.coupons.create).not.toHaveBeenCalled();
    });

    it("creates percentage-based coupon in Stripe", async () => {
      mockDb.promotionCode.findUnique.mockResolvedValue(null);
      mockStripe.coupons.create.mockResolvedValue({ id: "coupon_123" });
      mockStripe.promotionCodes.create.mockResolvedValue({ id: "promo_123" });
      mockDb.promotionCode.create.mockResolvedValue({ id: "promo-1" });

      await createCouponAction(validCouponData);

      expect(mockStripe.coupons.create).toHaveBeenCalledWith({
        name: "Summer sale",
        percent_off: 20,
        redeem_by: expect.any(Number),
        max_redemptions: 100,
      });
    });

    it("creates fixed amount coupon in Stripe", async () => {
      const fixedCoupon = {
        ...validCouponData,
        discountType: "FIXED" as const,
        discountValue: 500,
        currency: "USD",
      };
      mockDb.promotionCode.findUnique.mockResolvedValue(null);
      mockStripe.coupons.create.mockResolvedValue({ id: "coupon_123" });
      mockStripe.promotionCodes.create.mockResolvedValue({ id: "promo_123" });
      mockDb.promotionCode.create.mockResolvedValue({ id: "promo-1" });

      await createCouponAction(fixedCoupon);

      expect(mockStripe.coupons.create).toHaveBeenCalledWith({
        name: "Summer sale",
        amount_off: 500,
        currency: "usd",
        redeem_by: expect.any(Number),
        max_redemptions: 100,
      });
    });

    it("creates promotion code in Stripe", async () => {
      mockDb.promotionCode.findUnique.mockResolvedValue(null);
      mockStripe.coupons.create.mockResolvedValue({ id: "coupon_123" });
      mockStripe.promotionCodes.create.mockResolvedValue({ id: "promo_123" });
      mockDb.promotionCode.create.mockResolvedValue({ id: "promo-1" });

      await createCouponAction(validCouponData);

      expect(mockStripe.promotionCodes.create).toHaveBeenCalledWith({
        coupon: "coupon_123",
        code: "SUMMER2024",
        active: true,
      });
    });

    it("saves promotion code to database", async () => {
      mockDb.promotionCode.findUnique.mockResolvedValue(null);
      mockStripe.coupons.create.mockResolvedValue({ id: "coupon_123" });
      mockStripe.promotionCodes.create.mockResolvedValue({ id: "promo_123" });
      mockDb.promotionCode.create.mockResolvedValue({ id: "promo-1" });

      await createCouponAction(validCouponData);

      expect(mockDb.promotionCode.create).toHaveBeenCalledWith({
        data: {
          code: "SUMMER2024",
          stripePromotionId: "promo_123",
          stripeCouponId: "coupon_123",
          description: "Summer sale",
          discountType: "PERCENTAGE",
          discountValue: 20,
          currency: undefined,
          maxRedemptions: 100,
          expiresAt: validCouponData.expiresAt,
          createdBy: "admin-1",
          notes: "Internal notes",
        },
      });
    });

    it("creates audit log", async () => {
      mockDb.promotionCode.findUnique.mockResolvedValue(null);
      mockStripe.coupons.create.mockResolvedValue({ id: "coupon_123" });
      mockStripe.promotionCodes.create.mockResolvedValue({ id: "promo_123" });
      mockDb.promotionCode.create.mockResolvedValue({ id: "promo-1" });

      await createCouponAction(validCouponData);

      expect(mockCreateAuditLog).toHaveBeenCalledWith({
        entityType: "PromotionCode",
        entityId: "promo-1",
        action: "CREATE",
        changes: {
          code: { old: null, new: "SUMMER2024" },
          discountType: { old: null, new: "PERCENTAGE" },
          discountValue: { old: null, new: 20 },
        },
        userId: "admin-1",
        userEmail: "admin@example.com",
      });
    });

    it("revalidates coupons page", async () => {
      mockDb.promotionCode.findUnique.mockResolvedValue(null);
      mockStripe.coupons.create.mockResolvedValue({ id: "coupon_123" });
      mockStripe.promotionCodes.create.mockResolvedValue({ id: "promo_123" });
      mockDb.promotionCode.create.mockResolvedValue({ id: "promo-1" });
      const { revalidatePath } = await import("next/cache");

      await createCouponAction(validCouponData);

      expect(revalidatePath).toHaveBeenCalledWith("/admin/coupons");
    });

    it("returns created promotion code id", async () => {
      mockDb.promotionCode.findUnique.mockResolvedValue(null);
      mockStripe.coupons.create.mockResolvedValue({ id: "coupon_123" });
      mockStripe.promotionCodes.create.mockResolvedValue({ id: "promo_123" });
      mockDb.promotionCode.create.mockResolvedValue({ id: "promo-1" });

      const result = await createCouponAction(validCouponData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("promo-1");
      }
    });

    it("handles Stripe errors gracefully", async () => {
      mockDb.promotionCode.findUnique.mockResolvedValue(null);
      mockStripe.coupons.create.mockRejectedValue(new Error("Stripe API error"));

      const result = await createCouponAction(validCouponData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Failed to create promo code");
      }
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it("handles database errors gracefully", async () => {
      mockDb.promotionCode.findUnique.mockResolvedValue(null);
      mockStripe.coupons.create.mockResolvedValue({ id: "coupon_123" });
      mockStripe.promotionCodes.create.mockResolvedValue({ id: "promo_123" });
      mockDb.promotionCode.create.mockRejectedValue(new Error("DB error"));

      const result = await createCouponAction(validCouponData);

      expect(result.success).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it("handles coupon without expiration date", async () => {
      const noExpiry = { ...validCouponData, expiresAt: undefined };
      mockDb.promotionCode.findUnique.mockResolvedValue(null);
      mockStripe.coupons.create.mockResolvedValue({ id: "coupon_123" });
      mockStripe.promotionCodes.create.mockResolvedValue({ id: "promo_123" });
      mockDb.promotionCode.create.mockResolvedValue({ id: "promo-1" });

      await createCouponAction(noExpiry);

      expect(mockStripe.coupons.create).toHaveBeenCalledWith(
        expect.not.objectContaining({ redeem_by: expect.anything() })
      );
    });

    it("handles coupon without max redemptions", async () => {
      const noLimit = { ...validCouponData, maxRedemptions: 0 };
      mockDb.promotionCode.findUnique.mockResolvedValue(null);
      mockStripe.coupons.create.mockResolvedValue({ id: "coupon_123" });
      mockStripe.promotionCodes.create.mockResolvedValue({ id: "promo_123" });
      mockDb.promotionCode.create.mockResolvedValue({ id: "promo-1" });

      await createCouponAction(noLimit);

      expect(mockStripe.coupons.create).toHaveBeenCalledWith(
        expect.not.objectContaining({ max_redemptions: expect.anything() })
      );
    });
  });

  describe("updateCouponAction", () => {
    const existingCoupon = {
      id: "promo-1",
      code: "SUMMER2024",
      stripePromotionId: "promo_123",
      stripeCouponId: "coupon_123",
      active: true,
      maxRedemptions: 100,
    };

    it("requires admin access", async () => {
      mockDb.promotionCode.findUnique.mockResolvedValue(existingCoupon);

      await updateCouponAction("promo-1", {});

      expect(mockRequireAdmin).toHaveBeenCalled();
    });

    it("returns error for invalid input", async () => {
      const result = await updateCouponAction("promo-1", { active: "not_boolean" } as any);

      expect(result.success).toBe(false);
    });

    it("returns error when coupon not found", async () => {
      mockDb.promotionCode.findUnique.mockResolvedValue(null);

      const result = await updateCouponAction("promo-1", { active: false });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Promo code not found");
      }
    });

    it("updates Stripe when active status changed", async () => {
      mockDb.promotionCode.findUnique.mockResolvedValue(existingCoupon);
      mockStripe.promotionCodes.update.mockResolvedValue({});
      mockDb.promotionCode.update.mockResolvedValue({});

      await updateCouponAction("promo-1", { active: false });

      expect(mockStripe.promotionCodes.update).toHaveBeenCalledWith(
        "promo_123",
        { active: false }
      );
    });

    it("skips Stripe update when active status unchanged", async () => {
      mockDb.promotionCode.findUnique.mockResolvedValue(existingCoupon);
      mockDb.promotionCode.update.mockResolvedValue({});

      await updateCouponAction("promo-1", { maxRedemptions: 200 });

      expect(mockStripe.promotionCodes.update).not.toHaveBeenCalled();
    });

    it("updates database with new values", async () => {
      mockDb.promotionCode.findUnique.mockResolvedValue(existingCoupon);
      mockDb.promotionCode.update.mockResolvedValue({});

      await updateCouponAction("promo-1", {
        active: false,
        maxRedemptions: 200,
        notes: "Updated notes",
      });

      expect(mockDb.promotionCode.update).toHaveBeenCalledWith({
        where: { id: "promo-1" },
        data: {
          active: false,
          maxRedemptions: 200,
          notes: "Updated notes",
        },
      });
    });

    it("creates audit log for changes", async () => {
      mockDb.promotionCode.findUnique.mockResolvedValue(existingCoupon);
      mockStripe.promotionCodes.update.mockResolvedValue({});
      mockDb.promotionCode.update.mockResolvedValue({});

      await updateCouponAction("promo-1", { active: false });

      expect(mockCreateAuditLog).toHaveBeenCalledWith({
        entityType: "PromotionCode",
        entityId: "promo-1",
        action: "UPDATE",
        changes: expect.objectContaining({
          active: { old: true, new: false },
        }),
        userId: "admin-1",
        userEmail: "admin@example.com",
      });
    });

    it("skips audit log when no changes", async () => {
      mockDb.promotionCode.findUnique.mockResolvedValue(existingCoupon);
      mockDb.promotionCode.update.mockResolvedValue({});

      await updateCouponAction("promo-1", {});

      expect(mockCreateAuditLog).not.toHaveBeenCalled();
    });

    it("revalidates coupons page", async () => {
      mockDb.promotionCode.findUnique.mockResolvedValue(existingCoupon);
      mockDb.promotionCode.update.mockResolvedValue({});
      const { revalidatePath } = await import("next/cache");

      await updateCouponAction("promo-1", { active: false });

      expect(revalidatePath).toHaveBeenCalledWith("/admin/coupons");
    });

    it("handles Stripe errors gracefully", async () => {
      mockDb.promotionCode.findUnique.mockResolvedValue(existingCoupon);
      mockStripe.promotionCodes.update.mockRejectedValue(new Error("Stripe error"));

      const result = await updateCouponAction("promo-1", { active: false });

      expect(result.success).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe("listCouponsAction", () => {
    it("requires admin access", async () => {
      mockDb.promotionCode.findMany.mockResolvedValue([]);

      await listCouponsAction();

      expect(mockRequireAdmin).toHaveBeenCalled();
    });

    it("returns all coupons with usage count", async () => {
      const coupons = [
        {
          id: "promo-1",
          code: "SUMMER2024",
          _count: { usages: 5 },
        },
        {
          id: "promo-2",
          code: "WINTER2024",
          _count: { usages: 0 },
        },
      ];
      mockDb.promotionCode.findMany.mockResolvedValue(coupons);

      const result = await listCouponsAction();

      expect(result).toEqual(coupons);
      expect(mockDb.promotionCode.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { usages: true },
          },
        },
      });
    });
  });

  describe("getCouponStatsAction", () => {
    it("requires admin access", async () => {
      mockDb.promotionCode.findUnique.mockResolvedValue({
        id: "promo-1",
        usages: [],
      });

      await getCouponStatsAction("promo-1");

      expect(mockRequireAdmin).toHaveBeenCalled();
    });

    it("returns error when coupon not found", async () => {
      mockDb.promotionCode.findUnique.mockResolvedValue(null);

      const result = await getCouponStatsAction("promo-1");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Coupon not found");
      }
    });

    it("returns coupon with usage statistics", async () => {
      const coupon = {
        id: "promo-1",
        code: "SUMMER2024",
        usages: [
          { id: "usage-1", discountAmount: 10, createdAt: new Date() },
          { id: "usage-2", discountAmount: 15, createdAt: new Date() },
        ],
      };
      mockDb.promotionCode.findUnique.mockResolvedValue(coupon);

      const result = await getCouponStatsAction("promo-1");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.coupon).toEqual(coupon);
        expect(result.data.totalRedemptions).toBe(2);
        expect(result.data.totalDiscountAmount).toBe(25);
        expect(result.data.recentUsages).toHaveLength(2);
      }
    });

    it("includes recent usages limited to 100", async () => {
      mockDb.promotionCode.findUnique.mockResolvedValue({
        id: "promo-1",
        usages: [],
      });

      await getCouponStatsAction("promo-1");

      expect(mockDb.promotionCode.findUnique).toHaveBeenCalledWith({
        where: { id: "promo-1" },
        include: {
          usages: {
            orderBy: { createdAt: "desc" },
            take: 100,
          },
        },
      });
    });

    it("calculates zero discount for unused coupon", async () => {
      const coupon = {
        id: "promo-1",
        code: "UNUSED",
        usages: [],
      };
      mockDb.promotionCode.findUnique.mockResolvedValue(coupon);

      const result = await getCouponStatsAction("promo-1");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalRedemptions).toBe(0);
        expect(result.data.totalDiscountAmount).toBe(0);
      }
    });
  });
});
