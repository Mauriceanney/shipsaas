import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock database
vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));


import { db } from "@/lib/db";
import {
  getEmailPreferences,
  updateEmailPreferences,
  unsubscribeFromAll,
} from "@/actions/email/unsubscribe";

describe("Email Unsubscribe Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getEmailPreferences", () => {
    it("returns error for empty token", async () => {
      const result = await getEmailPreferences("");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid token");
    });

    it("returns error for invalid token", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(null);

      const result = await getEmailPreferences("invalid-token");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid or expired token");
    });

    it("returns user preferences for valid token", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({
        email: "user@example.com",
        emailMarketingOptIn: true,
        emailProductUpdates: false,
        emailSecurityAlerts: true,
      } as never);

      const result = await getEmailPreferences("valid-token");

      expect(result.success).toBe(true);
      expect(result.email).toBe("user@example.com");
      expect(result.preferences).toEqual({
        emailMarketingOptIn: true,
        emailProductUpdates: false,
        emailSecurityAlerts: true,
      });
    });

    it("handles database errors gracefully", async () => {
      vi.mocked(db.user.findUnique).mockRejectedValue(new Error("DB error"));

      const result = await getEmailPreferences("valid-token");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to get preferences");
    });
  });

  describe("updateEmailPreferences", () => {
    it("returns error for empty token", async () => {
      const result = await updateEmailPreferences("", {
        emailMarketingOptIn: false,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid token");
    });

    it("returns error for invalid token", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(null);

      const result = await updateEmailPreferences("invalid-token", {
        emailMarketingOptIn: false,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid or expired token");
    });

    it("updates preferences for valid token", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({
        id: "user-123",
        email: "user@example.com",
      } as never);

      vi.mocked(db.user.update).mockResolvedValue({
        email: "user@example.com",
        emailMarketingOptIn: false,
        emailProductUpdates: true,
        emailSecurityAlerts: true,
      } as never);

      const result = await updateEmailPreferences("valid-token", {
        emailMarketingOptIn: false,
        emailProductUpdates: true,
        emailSecurityAlerts: true,
      });

      expect(result.success).toBe(true);
      expect(result.preferences).toEqual({
        emailMarketingOptIn: false,
        emailProductUpdates: true,
        emailSecurityAlerts: true,
      });
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: {
          emailMarketingOptIn: false,
          emailProductUpdates: true,
          emailSecurityAlerts: true,
        },
        select: {
          email: true,
          emailMarketingOptIn: true,
          emailProductUpdates: true,
          emailSecurityAlerts: true,
        },
      });
    });

    it("handles database errors gracefully", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({
        id: "user-123",
        email: "user@example.com",
      } as never);
      vi.mocked(db.user.update).mockRejectedValue(new Error("DB error"));

      const result = await updateEmailPreferences("valid-token", {
        emailMarketingOptIn: false,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to update preferences");
    });
  });

  describe("unsubscribeFromAll", () => {
    it("returns error for empty token", async () => {
      const result = await unsubscribeFromAll("");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid token");
    });

    it("returns error for invalid token", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(null);

      const result = await unsubscribeFromAll("invalid-token");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid or expired token");
    });

    it("unsubscribes from all except security alerts", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({
        id: "user-123",
        email: "user@example.com",
      } as never);

      vi.mocked(db.user.update).mockResolvedValue({
        email: "user@example.com",
        emailMarketingOptIn: false,
        emailProductUpdates: false,
        emailSecurityAlerts: true,
      } as never);

      const result = await unsubscribeFromAll("valid-token");

      expect(result.success).toBe(true);
      expect(result.preferences).toEqual({
        emailMarketingOptIn: false,
        emailProductUpdates: false,
        emailSecurityAlerts: true,
      });
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: {
          emailMarketingOptIn: false,
          emailProductUpdates: false,
          emailSecurityAlerts: true,
        },
        select: {
          email: true,
          emailMarketingOptIn: true,
          emailProductUpdates: true,
          emailSecurityAlerts: true,
        },
      });
    });

    it("handles database errors gracefully", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({
        id: "user-123",
        email: "user@example.com",
      } as never);
      vi.mocked(db.user.update).mockRejectedValue(new Error("DB error"));

      const result = await unsubscribeFromAll("valid-token");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to unsubscribe");
    });
  });
});
