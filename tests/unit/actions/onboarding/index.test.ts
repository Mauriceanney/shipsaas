/**
 * Unit tests for onboarding server actions
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoist mocks
const { mockAuth, mockDb, mockRevalidatePath } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockDb: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
  mockRevalidatePath: vi.fn(),
}));

// Mock dependencies
vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

import {
  dismissOnboarding,
  completeOnboarding,
  getOnboardingStatus,
} from "@/actions/onboarding";

describe("onboarding actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("dismissOnboarding", () => {
    describe("authentication", () => {
      it("returns error when not authenticated", async () => {
        mockAuth.mockResolvedValue(null);

        const result = await dismissOnboarding();

        expect(result.success).toBe(false);
        expect(result.error).toBe("Unauthorized");
      });

      it("returns error when session has no user id", async () => {
        mockAuth.mockResolvedValue({ user: { id: null } });

        const result = await dismissOnboarding();

        expect(result.success).toBe(false);
        expect(result.error).toBe("Unauthorized");
      });
    });

    describe("success cases", () => {
      it("marks onboarding as completed with dismissed timestamp", async () => {
        mockAuth.mockResolvedValue({ user: { id: "user-1" } });
        mockDb.user.update.mockResolvedValue({
          id: "user-1",
          onboardingCompleted: true,
          onboardingDismissedAt: new Date(),
        });

        const result = await dismissOnboarding();

        expect(result.success).toBe(true);
        expect(mockDb.user.update).toHaveBeenCalledWith({
          where: { id: "user-1" },
          data: {
            onboardingCompleted: true,
            onboardingDismissedAt: expect.any(Date),
          },
        });
      });

      it("revalidates dashboard path", async () => {
        mockAuth.mockResolvedValue({ user: { id: "user-1" } });
        mockDb.user.update.mockResolvedValue({});

        await dismissOnboarding();

        expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
      });
    });

    describe("error handling", () => {
      it("handles database errors gracefully", async () => {
        mockAuth.mockResolvedValue({ user: { id: "user-1" } });
        mockDb.user.update.mockRejectedValue(new Error("DB Error"));

        const result = await dismissOnboarding();

        expect(result.success).toBe(false);
        expect(result.error).toBe("Failed to dismiss onboarding");
      });
    });
  });

  describe("completeOnboarding", () => {
    describe("authentication", () => {
      it("returns error when not authenticated", async () => {
        mockAuth.mockResolvedValue(null);

        const result = await completeOnboarding();

        expect(result.success).toBe(false);
        expect(result.error).toBe("Unauthorized");
      });

      it("returns error when session has no user id", async () => {
        mockAuth.mockResolvedValue({ user: { id: null } });

        const result = await completeOnboarding();

        expect(result.success).toBe(false);
        expect(result.error).toBe("Unauthorized");
      });
    });

    describe("success cases", () => {
      it("marks onboarding as completed", async () => {
        mockAuth.mockResolvedValue({ user: { id: "user-1" } });
        mockDb.user.update.mockResolvedValue({
          id: "user-1",
          onboardingCompleted: true,
        });

        const result = await completeOnboarding();

        expect(result.success).toBe(true);
        expect(mockDb.user.update).toHaveBeenCalledWith({
          where: { id: "user-1" },
          data: {
            onboardingCompleted: true,
          },
        });
      });

      it("revalidates dashboard path", async () => {
        mockAuth.mockResolvedValue({ user: { id: "user-1" } });
        mockDb.user.update.mockResolvedValue({});

        await completeOnboarding();

        expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
      });
    });

    describe("error handling", () => {
      it("handles database errors gracefully", async () => {
        mockAuth.mockResolvedValue({ user: { id: "user-1" } });
        mockDb.user.update.mockRejectedValue(new Error("DB Error"));

        const result = await completeOnboarding();

        expect(result.success).toBe(false);
        expect(result.error).toBe("Failed to complete onboarding");
      });
    });
  });

  describe("getOnboardingStatus", () => {
    describe("authentication", () => {
      it("returns error when not authenticated", async () => {
        mockAuth.mockResolvedValue(null);

        const result = await getOnboardingStatus();

        expect(result.success).toBe(false);
        expect(result.error).toBe("Unauthorized");
      });

      it("returns error when session has no user id", async () => {
        mockAuth.mockResolvedValue({ user: { id: null } });

        const result = await getOnboardingStatus();

        expect(result.success).toBe(false);
        expect(result.error).toBe("Unauthorized");
      });
    });

    describe("user not found", () => {
      it("returns error when user does not exist", async () => {
        mockAuth.mockResolvedValue({ user: { id: "user-1" } });
        mockDb.user.findUnique.mockResolvedValue(null);

        const result = await getOnboardingStatus();

        expect(result.success).toBe(false);
        expect(result.error).toBe("User not found");
      });
    });

    describe("success cases", () => {
      it("returns onboarding status for user with no name", async () => {
        mockAuth.mockResolvedValue({ user: { id: "user-1" } });
        mockDb.user.findUnique.mockResolvedValue({
          onboardingCompleted: false,
          onboardingDismissedAt: null,
          name: null,
          image: null,
          subscription: null,
        });

        const result = await getOnboardingStatus();

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.hasName).toBe(false);
          expect(result.data.hasImage).toBe(false);
          expect(result.data.hasSubscription).toBe(false);
          expect(result.data.onboardingCompleted).toBe(false);
        }
      });

      it("returns onboarding status for user with name and image", async () => {
        mockAuth.mockResolvedValue({ user: { id: "user-1" } });
        mockDb.user.findUnique.mockResolvedValue({
          onboardingCompleted: false,
          onboardingDismissedAt: null,
          name: "John Doe",
          image: "https://example.com/avatar.jpg",
          subscription: null,
        });

        const result = await getOnboardingStatus();

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.hasName).toBe(true);
          expect(result.data.hasImage).toBe(true);
          expect(result.data.hasSubscription).toBe(false);
        }
      });

      it("returns hasSubscription true for ACTIVE subscription", async () => {
        mockAuth.mockResolvedValue({ user: { id: "user-1" } });
        mockDb.user.findUnique.mockResolvedValue({
          onboardingCompleted: false,
          onboardingDismissedAt: null,
          name: "John Doe",
          image: null,
          subscription: { status: "ACTIVE", plan: "PLUS" },
        });

        const result = await getOnboardingStatus();

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.hasSubscription).toBe(true);
        }
      });

      it("returns hasSubscription true for TRIALING subscription", async () => {
        mockAuth.mockResolvedValue({ user: { id: "user-1" } });
        mockDb.user.findUnique.mockResolvedValue({
          onboardingCompleted: false,
          onboardingDismissedAt: null,
          name: "John Doe",
          image: null,
          subscription: { status: "TRIALING", plan: "PLUS" },
        });

        const result = await getOnboardingStatus();

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.hasSubscription).toBe(true);
        }
      });

      it("returns hasSubscription false for CANCELED subscription", async () => {
        mockAuth.mockResolvedValue({ user: { id: "user-1" } });
        mockDb.user.findUnique.mockResolvedValue({
          onboardingCompleted: false,
          onboardingDismissedAt: null,
          name: "John Doe",
          image: null,
          subscription: { status: "CANCELED", plan: "PLUS" },
        });

        const result = await getOnboardingStatus();

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.hasSubscription).toBe(false);
        }
      });

      it("returns hasName false for whitespace-only name", async () => {
        mockAuth.mockResolvedValue({ user: { id: "user-1" } });
        mockDb.user.findUnique.mockResolvedValue({
          onboardingCompleted: false,
          onboardingDismissedAt: null,
          name: "   ",
          image: null,
          subscription: null,
        });

        const result = await getOnboardingStatus();

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.hasName).toBe(false);
        }
      });

      it("includes onboardingDismissedAt when present", async () => {
        const dismissedAt = new Date("2024-01-15");
        mockAuth.mockResolvedValue({ user: { id: "user-1" } });
        mockDb.user.findUnique.mockResolvedValue({
          onboardingCompleted: true,
          onboardingDismissedAt: dismissedAt,
          name: "John Doe",
          image: null,
          subscription: null,
        });

        const result = await getOnboardingStatus();

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.onboardingCompleted).toBe(true);
          expect(result.data.onboardingDismissedAt).toEqual(dismissedAt);
        }
      });
    });

    describe("error handling", () => {
      it("handles database errors gracefully", async () => {
        mockAuth.mockResolvedValue({ user: { id: "user-1" } });
        mockDb.user.findUnique.mockRejectedValue(new Error("DB Error"));

        const result = await getOnboardingStatus();

        expect(result.success).toBe(false);
        expect(result.error).toBe("Failed to get onboarding status");
      });
    });
  });
});
