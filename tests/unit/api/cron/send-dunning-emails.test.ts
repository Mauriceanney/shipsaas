/**
 * Tests for send-dunning-emails cron job
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { headers } from "next/headers";

// Mock dependencies BEFORE imports
vi.mock("next/headers");
vi.mock("@/lib/db");
vi.mock("@/lib/email");

import { GET } from "@/app/api/cron/send-dunning-emails/route";
import { db } from "@/lib/db";
import { sendDunningReminderEmail, sendDunningFinalWarningEmail } from "@/lib/email";

describe("GET /api/cron/send-dunning-emails", () => {
  const originalNodeEnv = process.env["NODE_ENV"];

  beforeEach(() => {
    vi.clearAllMocks();

    // Set production environment by default
    Object.defineProperty(process.env, "NODE_ENV", {
      value: "production",
      writable: true,
      configurable: true,
      enumerable: true,
    });

    // Setup default db mocks
    (db.subscription as any) = {
      findMany: vi.fn(),
    };
    (db.dunningEmail as any) = {
      create: vi.fn(),
    };
  });

  afterEach(() => {
    // Restore original NODE_ENV
    if (originalNodeEnv !== undefined) {
      Object.defineProperty(process.env, "NODE_ENV", {
        value: originalNodeEnv,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    }
  });

  describe("authentication", () => {
    it("returns 401 when CRON_SECRET header is missing in production", async () => {
      vi.mocked(headers).mockResolvedValue(
        new Headers({ "x-cron-secret": "" })
      );
      process.env["CRON_SECRET"] = "secret123";

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 401 when CRON_SECRET header is incorrect in production", async () => {
      vi.mocked(headers).mockResolvedValue(
        new Headers({ "x-cron-secret": "wrong-secret" })
      );
      process.env["CRON_SECRET"] = "secret123";

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("allows request in development without secret", async () => {
      Object.defineProperty(process.env, "NODE_ENV", {
        value: "development",
        writable: true,
        configurable: true,
        enumerable: true,
      });
      vi.mocked(headers).mockResolvedValue(new Headers());
      vi.mocked(db.subscription.findMany).mockResolvedValue([]);

      const response = await GET();

      expect(response.status).toBe(200);
    });

    it("allows request with correct secret in production", async () => {
      vi.mocked(headers).mockResolvedValue(
        new Headers({ "x-cron-secret": "secret123" })
      );
      process.env["CRON_SECRET"] = "secret123";
      vi.mocked(db.subscription.findMany).mockResolvedValue([]);

      const response = await GET();

      expect(response.status).toBe(200);
    });
  });

  describe("when no subscriptions are past due", () => {
    it("returns success with 0 emails sent", async () => {
      vi.mocked(headers).mockResolvedValue(
        new Headers({ "x-cron-secret": "secret123" })
      );
      process.env["CRON_SECRET"] = "secret123";
      vi.mocked(db.subscription.findMany).mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.day3Sent).toBe(0);
      expect(data.day7Sent).toBe(0);
    });
  });

  describe("Day 3 reminder emails", () => {
    it("sends email when subscription is exactly 3 days past due", async () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      vi.mocked(headers).mockResolvedValue(
        new Headers({ "x-cron-secret": "secret123" })
      );
      process.env["CRON_SECRET"] = "secret123";

      vi.mocked(db.subscription.findMany).mockResolvedValue([
        {
          id: "sub-1",
          userId: "user-1",
          status: "PAST_DUE",
          statusChangedAt: threeDaysAgo,
          plan: "PLUS",
          user: {
            email: "user@example.com",
            name: "John Doe",
          },
          dunningEmails: [],
        },
      ] as never);

      vi.mocked(db.dunningEmail.create).mockResolvedValue({} as never);
      vi.mocked(sendDunningReminderEmail).mockResolvedValue({ success: true } as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.day3Sent).toBe(1);
      expect(sendDunningReminderEmail).toHaveBeenCalledWith("user@example.com", {
        name: "John Doe",
        planName: "PLUS",
        daysSinceFailed: 3,
      });
      expect(db.dunningEmail.create).toHaveBeenCalledWith({
        data: {
          subscriptionId: "sub-1",
          emailType: "DAY_3_REMINDER",
          recipientEmail: "user@example.com",
          emailStatus: "SENT",
        },
      });
    });

    it("sends email when subscription is more than 3 days past due", async () => {
      const fourDaysAgo = new Date();
      fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

      vi.mocked(headers).mockResolvedValue(
        new Headers({ "x-cron-secret": "secret123" })
      );
      process.env["CRON_SECRET"] = "secret123";

      vi.mocked(db.subscription.findMany).mockResolvedValue([
        {
          id: "sub-1",
          userId: "user-1",
          status: "PAST_DUE",
          statusChangedAt: fourDaysAgo,
          plan: "PLUS",
          user: {
            email: "user@example.com",
            name: "John Doe",
          },
          dunningEmails: [],
        },
      ] as never);

      vi.mocked(db.dunningEmail.create).mockResolvedValue({} as never);
      vi.mocked(sendDunningReminderEmail).mockResolvedValue({ success: true } as any);

      const response = await GET();
      const data = await response.json();

      expect(data.day3Sent).toBe(1);
    });

    it("does not send Day 3 email if already sent", async () => {
      const fourDaysAgo = new Date();
      fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

      vi.mocked(headers).mockResolvedValue(
        new Headers({ "x-cron-secret": "secret123" })
      );
      process.env["CRON_SECRET"] = "secret123";

      vi.mocked(db.subscription.findMany).mockResolvedValue([
        {
          id: "sub-1",
          userId: "user-1",
          status: "PAST_DUE",
          statusChangedAt: fourDaysAgo,
          plan: "PLUS",
          user: {
            email: "user@example.com",
            name: "John Doe",
          },
          dunningEmails: [
            { emailType: "DAY_3_REMINDER" },
          ],
        },
      ] as never);

      const response = await GET();
      const data = await response.json();

      expect(data.day3Sent).toBe(0);
      expect(sendDunningReminderEmail).not.toHaveBeenCalled();
    });

    it("does not send Day 3 email if less than 3 days", async () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      vi.mocked(headers).mockResolvedValue(
        new Headers({ "x-cron-secret": "secret123" })
      );
      process.env["CRON_SECRET"] = "secret123";

      vi.mocked(db.subscription.findMany).mockResolvedValue([
        {
          id: "sub-1",
          userId: "user-1",
          status: "PAST_DUE",
          statusChangedAt: twoDaysAgo,
          plan: "PLUS",
          user: {
            email: "user@example.com",
            name: "John Doe",
          },
          dunningEmails: [],
        },
      ] as never);

      const response = await GET();
      const data = await response.json();

      expect(data.day3Sent).toBe(0);
      expect(sendDunningReminderEmail).not.toHaveBeenCalled();
    });

    it("records failed email status when send fails", async () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      vi.mocked(headers).mockResolvedValue(
        new Headers({ "x-cron-secret": "secret123" })
      );
      process.env["CRON_SECRET"] = "secret123";

      vi.mocked(db.subscription.findMany).mockResolvedValue([
        {
          id: "sub-1",
          userId: "user-1",
          status: "PAST_DUE",
          statusChangedAt: threeDaysAgo,
          plan: "PLUS",
          user: {
            email: "user@example.com",
            name: "John Doe",
          },
          dunningEmails: [],
        },
      ] as never);

      vi.mocked(db.dunningEmail.create).mockResolvedValue({} as never);
      vi.mocked(sendDunningReminderEmail).mockResolvedValue({
        success: false,
        error: "Email send failed"
      });

      const response = await GET();
      const data = await response.json();

      expect(db.dunningEmail.create).toHaveBeenCalledWith({
        data: {
          subscriptionId: "sub-1",
          emailType: "DAY_3_REMINDER",
          recipientEmail: "user@example.com",
          emailStatus: "FAILED",
          errorMessage: "Email send failed",
        },
      });
      expect(data.errors).toHaveLength(1);
    });
  });

  describe("Day 7 final warning emails", () => {
    it("sends email when subscription is exactly 7 days past due", async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      vi.mocked(headers).mockResolvedValue(
        new Headers({ "x-cron-secret": "secret123" })
      );
      process.env["CRON_SECRET"] = "secret123";

      vi.mocked(db.subscription.findMany).mockResolvedValue([
        {
          id: "sub-1",
          userId: "user-1",
          status: "PAST_DUE",
          statusChangedAt: sevenDaysAgo,
          plan: "PLUS",
          user: {
            email: "user@example.com",
            name: "Jane Smith",
          },
          dunningEmails: [
            { emailType: "DAY_3_REMINDER" },
          ],
        },
      ] as never);

      vi.mocked(db.dunningEmail.create).mockResolvedValue({} as never);
      vi.mocked(sendDunningFinalWarningEmail).mockResolvedValue({ success: true } as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.day7Sent).toBe(1);
      expect(sendDunningFinalWarningEmail).toHaveBeenCalledWith("user@example.com", {
        name: "Jane Smith",
        planName: "PRO",
        daysSinceFailed: 7,
        suspensionDate: expect.stringMatching(/\w+ \d+, \d{4}/),
      });
    });

    it("does not send Day 7 email if already sent", async () => {
      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

      vi.mocked(headers).mockResolvedValue(
        new Headers({ "x-cron-secret": "secret123" })
      );
      process.env["CRON_SECRET"] = "secret123";

      vi.mocked(db.subscription.findMany).mockResolvedValue([
        {
          id: "sub-1",
          userId: "user-1",
          status: "PAST_DUE",
          statusChangedAt: eightDaysAgo,
          plan: "PLUS",
          user: {
            email: "user@example.com",
            name: "Jane Smith",
          },
          dunningEmails: [
            { emailType: "DAY_3_REMINDER" },
            { emailType: "DAY_7_FINAL_WARNING" },
          ],
        },
      ] as never);

      const response = await GET();
      const data = await response.json();

      expect(data.day7Sent).toBe(0);
      expect(sendDunningFinalWarningEmail).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("returns 500 on critical error", async () => {
      vi.mocked(headers).mockResolvedValue(
        new Headers({ "x-cron-secret": "secret123" })
      );
      process.env["CRON_SECRET"] = "secret123";
      vi.mocked(db.subscription.findMany).mockRejectedValue(new Error("DB Error"));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });
  });
});
