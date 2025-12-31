/**
 * Test for suspend-subscriptions cron endpoint
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock dependencies before imports
vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    subscription: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    dunningEmail: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/email", () => ({
  sendSubscriptionSuspendedEmail: vi.fn(),
}));

vi.mock("@/lib/stripe/client", () => ({
  stripe: {
    subscriptions: {
      cancel: vi.fn(),
    },
  },
}));

import { GET } from "@/app/api/cron/suspend-subscriptions/route";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { sendSubscriptionSuspendedEmail } from "@/lib/email";
import { stripe } from "@/lib/stripe/client";

describe("GET /api/cron/suspend-subscriptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CRON_SECRET", "test-secret");
  });

  describe("authentication", () => {
    it("returns 401 when cron secret is missing", async () => {
      vi.mocked(headers).mockResolvedValue(
        new Map([["x-cron-secret", ""]]) as any
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 401 when cron secret is invalid", async () => {
      vi.mocked(headers).mockResolvedValue(
        new Map([["x-cron-secret", "wrong-secret"]]) as any
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("allows request with correct secret", async () => {
      vi.mocked(headers).mockResolvedValue(
        new Map([["x-cron-secret", "test-secret"]]) as any
      );
      vi.mocked(db.subscription.findMany).mockResolvedValue([]);

      const response = await GET();

      expect(response.status).toBe(200);
    });

    it("allows request in development without secret", async () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.mocked(headers).mockResolvedValue(new Map() as any);
      vi.mocked(db.subscription.findMany).mockResolvedValue([]);

      const response = await GET();

      expect(response.status).toBe(200);
    });
  });

  describe("suspension logic", () => {
    beforeEach(() => {
      vi.mocked(headers).mockResolvedValue(
        new Map([["x-cron-secret", "test-secret"]]) as any
      );
    });

    it("returns success when no subscriptions to suspend", async () => {
      vi.mocked(db.subscription.findMany).mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.suspended).toBe(0);
    });

    it("suspends subscriptions past due for 10+ days", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 11); // 11 days ago

      vi.mocked(db.subscription.findMany).mockResolvedValue([
        {
          id: "sub-1",
          userId: "user-1",
          stripeSubscriptionId: "sub_stripe_1",
          status: "PAST_DUE",
          statusChangedAt: pastDate,
          plan: "PRO",
          user: {
            email: "test@example.com",
            name: "John Doe",
          },
          dunningEmails: [],
        },
      ] as any);

      vi.mocked(stripe.subscriptions.cancel).mockResolvedValue({} as any);
      vi.mocked(db.subscription.update).mockResolvedValue({} as any);
      vi.mocked(db.dunningEmail.create).mockResolvedValue({} as any);
      vi.mocked(sendSubscriptionSuspendedEmail).mockResolvedValue({
        success: true,
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.suspended).toBe(1);
      expect(stripe.subscriptions.cancel).toHaveBeenCalledWith("sub_stripe_1");
      expect(db.subscription.update).toHaveBeenCalledWith({
        where: { id: "sub-1" },
        data: { status: "CANCELED" },
      });
    });

    it("does not suspend subscriptions past due for less than 10 days", async () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 5); // 5 days ago

      vi.mocked(db.subscription.findMany).mockResolvedValue([
        {
          id: "sub-1",
          userId: "user-1",
          stripeSubscriptionId: "sub_stripe_1",
          status: "PAST_DUE",
          statusChangedAt: recentDate,
          plan: "PRO",
          user: {
            email: "test@example.com",
            name: "John Doe",
          },
          dunningEmails: [],
        },
      ] as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.suspended).toBe(0);
      expect(stripe.subscriptions.cancel).not.toHaveBeenCalled();
    });

    it("creates dunning email record", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 11);

      vi.mocked(db.subscription.findMany).mockResolvedValue([
        {
          id: "sub-1",
          userId: "user-1",
          stripeSubscriptionId: "sub_stripe_1",
          status: "PAST_DUE",
          statusChangedAt: pastDate,
          plan: "PRO",
          user: {
            email: "test@example.com",
            name: "John Doe",
          },
          dunningEmails: [],
        },
      ] as any);

      vi.mocked(stripe.subscriptions.cancel).mockResolvedValue({} as any);
      vi.mocked(db.subscription.update).mockResolvedValue({} as any);
      vi.mocked(db.dunningEmail.create).mockResolvedValue({} as any);
      vi.mocked(sendSubscriptionSuspendedEmail).mockResolvedValue({
        success: true,
      });

      await GET();

      expect(db.dunningEmail.create).toHaveBeenCalledWith({
        data: {
          subscriptionId: "sub-1",
          emailType: "DAY_10_SUSPENDED",
          recipientEmail: "test@example.com",
          emailStatus: "SENT",
        },
      });
    });

    it("sends suspension email", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 11);

      vi.mocked(db.subscription.findMany).mockResolvedValue([
        {
          id: "sub-1",
          userId: "user-1",
          stripeSubscriptionId: "sub_stripe_1",
          status: "PAST_DUE",
          statusChangedAt: pastDate,
          plan: "PRO",
          user: {
            email: "test@example.com",
            name: "John Doe",
          },
          dunningEmails: [],
        },
      ] as any);

      vi.mocked(stripe.subscriptions.cancel).mockResolvedValue({} as any);
      vi.mocked(db.subscription.update).mockResolvedValue({} as any);
      vi.mocked(db.dunningEmail.create).mockResolvedValue({} as any);
      vi.mocked(sendSubscriptionSuspendedEmail).mockResolvedValue({
        success: true,
      });

      await GET();

      expect(sendSubscriptionSuspendedEmail).toHaveBeenCalledWith(
        "test@example.com",
        {
          name: "John Doe",
          planName: "PRO",
          daysOverdue: 11,
        }
      );
    });

    it("skips subscriptions already suspended", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 11);

      vi.mocked(db.subscription.findMany).mockResolvedValue([
        {
          id: "sub-1",
          userId: "user-1",
          stripeSubscriptionId: "sub_stripe_1",
          status: "PAST_DUE",
          statusChangedAt: pastDate,
          plan: "PRO",
          user: {
            email: "test@example.com",
            name: "John Doe",
          },
          dunningEmails: [
            {
              emailType: "DAY_10_SUSPENDED",
            },
          ],
        },
      ] as any);

      const response = await GET();
      const data = await response.json();

      expect(data.suspended).toBe(0);
      expect(stripe.subscriptions.cancel).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    beforeEach(() => {
      vi.mocked(headers).mockResolvedValue(
        new Map([["x-cron-secret", "test-secret"]]) as any
      );
    });

    it("continues processing on Stripe error", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 11);

      vi.mocked(db.subscription.findMany).mockResolvedValue([
        {
          id: "sub-1",
          userId: "user-1",
          stripeSubscriptionId: "sub_stripe_1",
          status: "PAST_DUE",
          statusChangedAt: pastDate,
          plan: "PRO",
          user: {
            email: "test@example.com",
            name: "John Doe",
          },
          dunningEmails: [],
        },
      ] as any);

      vi.mocked(stripe.subscriptions.cancel).mockRejectedValue(
        new Error("Stripe error")
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.errors).toBeDefined();
      expect(data.errors?.length).toBeGreaterThan(0);
    });

    it("continues processing on email send failure", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 11);

      vi.mocked(db.subscription.findMany).mockResolvedValue([
        {
          id: "sub-1",
          userId: "user-1",
          stripeSubscriptionId: "sub_stripe_1",
          status: "PAST_DUE",
          statusChangedAt: pastDate,
          plan: "PRO",
          user: {
            email: "test@example.com",
            name: "John Doe",
          },
          dunningEmails: [],
        },
      ] as any);

      vi.mocked(stripe.subscriptions.cancel).mockResolvedValue({} as any);
      vi.mocked(db.subscription.update).mockResolvedValue({} as any);
      vi.mocked(db.dunningEmail.create).mockResolvedValue({} as any);
      vi.mocked(sendSubscriptionSuspendedEmail).mockResolvedValue({
        success: false,
        error: "Email failed",
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.suspended).toBe(1);
      expect(db.dunningEmail.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          emailStatus: "FAILED",
          errorMessage: "Email failed",
        }),
      });
    });

    it("returns 500 on critical error", async () => {
      vi.mocked(headers).mockResolvedValue(
        new Map([["x-cron-secret", "test-secret"]]) as any
      );
      vi.mocked(db.subscription.findMany).mockRejectedValue(
        new Error("Database error")
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });
  });
});
