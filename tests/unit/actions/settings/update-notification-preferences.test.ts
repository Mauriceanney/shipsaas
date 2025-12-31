/**
 * Unit tests for updateNotificationPreferences action
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoist mocks for vitest
const { mockAuth, mockDbUserUpdate, mockRevalidatePath } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockDbUserUpdate: vi.fn(),
  mockRevalidatePath: vi.fn(),
}));

// Mock dependencies
vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      update: mockDbUserUpdate,
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

import { updateNotificationPreferences } from "@/actions/settings/update-notification-preferences";

describe("updateNotificationPreferences", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("authentication", () => {
    it("returns error when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const result = await updateNotificationPreferences({ emailMarketingOptIn: true });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });

    it("returns error when session has no user", async () => {
      mockAuth.mockResolvedValue({ user: null });

      const result = await updateNotificationPreferences({ emailMarketingOptIn: true });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });

    it("returns error when user has no id", async () => {
      mockAuth.mockResolvedValue({ user: { id: null } });

      const result = await updateNotificationPreferences({ emailMarketingOptIn: true });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });
  });

  describe("validation", () => {
    it("allows valid boolean preferences", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDbUserUpdate.mockResolvedValue({});

      const result = await updateNotificationPreferences({
        emailMarketingOptIn: false,
        emailProductUpdates: true,
        emailSecurityAlerts: true,
      });

      expect(result.success).toBe(true);
    });

    it("allows partial updates", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDbUserUpdate.mockResolvedValue({});

      const result = await updateNotificationPreferences({
        emailMarketingOptIn: false,
      });

      expect(result.success).toBe(true);
      expect(mockDbUserUpdate).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { emailMarketingOptIn: false },
      });
    });

    it("allows empty updates", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDbUserUpdate.mockResolvedValue({});

      const result = await updateNotificationPreferences({});

      expect(result.success).toBe(true);
    });
  });

  describe("success cases", () => {
    it("updates user preferences in database", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDbUserUpdate.mockResolvedValue({});

      await updateNotificationPreferences({
        emailMarketingOptIn: false,
        emailProductUpdates: false,
      });

      expect(mockDbUserUpdate).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: {
          emailMarketingOptIn: false,
          emailProductUpdates: false,
        },
      });
    });

    it("revalidates the notifications settings path", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDbUserUpdate.mockResolvedValue({});

      await updateNotificationPreferences({ emailMarketingOptIn: true });

      expect(mockRevalidatePath).toHaveBeenCalledWith("/settings/notifications");
    });

    it("returns success true on successful update", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDbUserUpdate.mockResolvedValue({});

      const result = await updateNotificationPreferences({ emailMarketingOptIn: true });

      expect(result.success).toBe(true);
    });
  });

  describe("error handling", () => {
    it("handles database errors gracefully", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDbUserUpdate.mockRejectedValue(new Error("Database error"));

      const result = await updateNotificationPreferences({ emailMarketingOptIn: true });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to update preferences");
    });
  });
});
