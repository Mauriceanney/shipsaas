import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockDb, mockRevalidatePath } = vi.hoisted(() => ({
  mockDb: {
    subscription: {
      findFirst: vi.fn(),
    },
  },
  mockRevalidatePath: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

import { handleChargeRefunded } from "@/lib/stripe/webhooks";

describe("handleChargeRefunded", () => {
  const mockCharge = {
    id: "ch_123",
    amount: 2000,
    amount_refunded: 2000,
    refunded: true,
    customer: "cus_123",
    metadata: {
      subscriptionId: "sub-1",
    },
  };

  const mockSubscription = {
    id: "sub-1",
    userId: "user-1",
    stripeCustomerId: "cus_123",
    plan: "PRO",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs refund when subscription has metadata", async () => {
    mockDb.subscription.findFirst.mockResolvedValue(mockSubscription);

    await handleChargeRefunded(mockCharge as any);

    expect(mockDb.subscription.findFirst).toHaveBeenCalledWith({
      where: { id: "sub-1" },
    });
  });

  it("looks up subscription by customer ID when no metadata", async () => {
    const chargeWithoutMetadata = {
      ...mockCharge,
      metadata: {},
    };

    mockDb.subscription.findFirst.mockResolvedValue(mockSubscription);

    await handleChargeRefunded(chargeWithoutMetadata as any);

    expect(mockDb.subscription.findFirst).toHaveBeenCalledWith({
      where: { stripeCustomerId: "cus_123" },
    });
  });

  it("handles missing subscription gracefully", async () => {
    mockDb.subscription.findFirst.mockResolvedValue(null);

    await expect(handleChargeRefunded(mockCharge as any)).resolves.not.toThrow();
  });

  it("handles database errors gracefully", async () => {
    mockDb.subscription.findFirst.mockRejectedValue(new Error("DB error"));

    await expect(handleChargeRefunded(mockCharge as any)).resolves.not.toThrow();
  });
});
