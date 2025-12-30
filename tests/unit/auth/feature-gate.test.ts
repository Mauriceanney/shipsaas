import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted to properly hoist the mock function
const { mockAuth } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
}));

// Mock next-auth to avoid import issues
vi.mock("next-auth", () => ({
  default: vi.fn(),
}));

// Mock next/headers to avoid server-side import issues
vi.mock("next/headers", () => ({
  headers: vi.fn(),
  cookies: vi.fn(),
}));

// Mock the auth module before importing the action
vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

import type { Session } from "next-auth";
import {
  getPlanHierarchy,
  hasAccess,
  canAccessFeature,
  requirePlan,
} from "@/lib/auth/feature-gate";

// Get the mocked auth for type safety
const auth = mockAuth;

describe("getPlanHierarchy", () => {
  it("returns 0 for FREE plan", () => {
    expect(getPlanHierarchy("FREE")).toBe(0);
  });

  it("returns 1 for PRO plan", () => {
    expect(getPlanHierarchy("PRO")).toBe(1);
  });

  it("returns 2 for ENTERPRISE plan", () => {
    expect(getPlanHierarchy("ENTERPRISE")).toBe(2);
  });
});

describe("hasAccess", () => {
  const createSession = (
    plan: "FREE" | "PRO" | "ENTERPRISE",
    status: "ACTIVE" | "INACTIVE" | "PAST_DUE" | "CANCELED" | "TRIALING",
    statusChangedAt?: Date | null
  ): Session => ({
    user: {
      id: "user-1",
      email: "test@example.com",
      role: "USER",
    },
    subscription: {
      plan,
      status,
      stripeCurrentPeriodEnd: new Date(),
      statusChangedAt: statusChangedAt ?? null,
    },
    expires: new Date(Date.now() + 86400000).toISOString(),
  });

  describe("plan tier checks", () => {
    it("FREE cannot access PRO", () => {
      const session = createSession("FREE", "ACTIVE");
      expect(hasAccess(session, "PRO")).toBe(false);
    });

    it("FREE cannot access ENTERPRISE", () => {
      const session = createSession("FREE", "ACTIVE");
      expect(hasAccess(session, "ENTERPRISE")).toBe(false);
    });

    it("PRO can access PRO", () => {
      const session = createSession("PRO", "ACTIVE");
      expect(hasAccess(session, "PRO")).toBe(true);
    });

    it("PRO can access FREE", () => {
      const session = createSession("PRO", "ACTIVE");
      expect(hasAccess(session, "FREE")).toBe(true);
    });

    it("PRO cannot access ENTERPRISE", () => {
      const session = createSession("PRO", "ACTIVE");
      expect(hasAccess(session, "ENTERPRISE")).toBe(false);
    });

    it("ENTERPRISE can access ENTERPRISE", () => {
      const session = createSession("ENTERPRISE", "ACTIVE");
      expect(hasAccess(session, "ENTERPRISE")).toBe(true);
    });

    it("ENTERPRISE can access PRO", () => {
      const session = createSession("ENTERPRISE", "ACTIVE");
      expect(hasAccess(session, "PRO")).toBe(true);
    });

    it("ENTERPRISE can access FREE", () => {
      const session = createSession("ENTERPRISE", "ACTIVE");
      expect(hasAccess(session, "FREE")).toBe(true);
    });
  });

  describe("status checks", () => {
    it("ACTIVE status grants access", () => {
      const session = createSession("PRO", "ACTIVE");
      expect(hasAccess(session, "PRO")).toBe(true);
    });

    it("TRIALING status grants access", () => {
      const session = createSession("PRO", "TRIALING");
      expect(hasAccess(session, "PRO")).toBe(true);
    });

    it("INACTIVE status denies access", () => {
      const session = createSession("PRO", "INACTIVE");
      expect(hasAccess(session, "PRO")).toBe(false);
    });

    it("CANCELED status denies access", () => {
      const session = createSession("PRO", "CANCELED");
      expect(hasAccess(session, "PRO")).toBe(false);
    });
  });

  describe("PAST_DUE grace period", () => {
    it("PAST_DUE day 1 grants access (within grace period)", () => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const session = createSession("PRO", "PAST_DUE", oneDayAgo);
      expect(hasAccess(session, "PRO")).toBe(true);
    });

    it("PAST_DUE day 6 grants access (within grace period)", () => {
      const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
      const session = createSession("PRO", "PAST_DUE", sixDaysAgo);
      expect(hasAccess(session, "PRO")).toBe(true);
    });

    it("PAST_DUE day 7 grants access (edge of grace period)", () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const session = createSession("PRO", "PAST_DUE", sevenDaysAgo);
      expect(hasAccess(session, "PRO")).toBe(true);
    });

    it("PAST_DUE day 8 denies access (past grace period)", () => {
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      const session = createSession("PRO", "PAST_DUE", eightDaysAgo);
      expect(hasAccess(session, "PRO")).toBe(false);
    });

    it("PAST_DUE without statusChangedAt denies access", () => {
      const session = createSession("PRO", "PAST_DUE", null);
      expect(hasAccess(session, "PRO")).toBe(false);
    });
  });
});

describe("canAccessFeature", () => {
  const createSession = (
    plan: "FREE" | "PRO" | "ENTERPRISE",
    status: "ACTIVE" | "INACTIVE" | "PAST_DUE" | "CANCELED" | "TRIALING",
    statusChangedAt?: Date | null
  ): Session => ({
    user: {
      id: "user-1",
      email: "test@example.com",
      role: "USER",
    },
    subscription: {
      plan,
      status,
      stripeCurrentPeriodEnd: new Date(),
      statusChangedAt: statusChangedAt ?? null,
    },
    expires: new Date(Date.now() + 86400000).toISOString(),
  });

  it("returns canAccess: true when user has access", () => {
    const session = createSession("PRO", "ACTIVE");
    const result = canAccessFeature(session, "PRO");
    expect(result.canAccess).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it("returns canAccess: false with reason when plan is insufficient", () => {
    const session = createSession("FREE", "ACTIVE");
    const result = canAccessFeature(session, "PRO");
    expect(result.canAccess).toBe(false);
    expect(result.reason).toBe("upgrade_required");
  });

  it("returns canAccess: false with reason when subscription is inactive", () => {
    const session = createSession("PRO", "INACTIVE");
    const result = canAccessFeature(session, "PRO");
    expect(result.canAccess).toBe(false);
    expect(result.reason).toBe("subscription_inactive");
  });

  it("returns canAccess: false with reason when subscription is canceled", () => {
    const session = createSession("PRO", "CANCELED");
    const result = canAccessFeature(session, "PRO");
    expect(result.canAccess).toBe(false);
    expect(result.reason).toBe("subscription_inactive");
  });

  it("returns canAccess: false with reason when past due beyond grace period", () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    const session = createSession("PRO", "PAST_DUE", eightDaysAgo);
    const result = canAccessFeature(session, "PRO");
    expect(result.canAccess).toBe(false);
    expect(result.reason).toBe("payment_overdue");
  });
});

describe("requirePlan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createSession = (
    plan: "FREE" | "PRO" | "ENTERPRISE",
    status: "ACTIVE" | "INACTIVE" | "PAST_DUE" | "CANCELED" | "TRIALING",
    statusChangedAt?: Date | null
  ): Session => ({
    user: {
      id: "user-1",
      email: "test@example.com",
      role: "USER",
    },
    subscription: {
      plan,
      status,
      stripeCurrentPeriodEnd: new Date(),
      statusChangedAt: statusChangedAt ?? null,
    },
    expires: new Date(Date.now() + 86400000).toISOString(),
  });

  it("returns error when not authenticated", async () => {
    auth.mockResolvedValue(null);

    const result = await requirePlan("PRO");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Unauthorized");
    }
  });

  it("returns error when session has no user", async () => {
    auth.mockResolvedValue({
      expires: new Date().toISOString(),
    } as Session);

    const result = await requirePlan("PRO");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Unauthorized");
    }
  });

  it("returns session when user has required plan and active status", async () => {
    const session = createSession("PRO", "ACTIVE");
    auth.mockResolvedValue(session);

    const result = await requirePlan("PRO");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(session);
    }
  });

  it("returns error when user plan is insufficient", async () => {
    const session = createSession("FREE", "ACTIVE");
    auth.mockResolvedValue(session);

    const result = await requirePlan("PRO");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Upgrade to PRO required");
    }
  });

  it("returns error when subscription is inactive", async () => {
    const session = createSession("PRO", "INACTIVE");
    auth.mockResolvedValue(session);

    const result = await requirePlan("PRO");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Active subscription required");
    }
  });

  it("returns session when user has higher plan tier", async () => {
    const session = createSession("ENTERPRISE", "ACTIVE");
    auth.mockResolvedValue(session);

    const result = await requirePlan("PRO");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(session);
    }
  });

  it("allows access to FREE plan for all users", async () => {
    const session = createSession("FREE", "ACTIVE");
    auth.mockResolvedValue(session);

    const result = await requirePlan("FREE");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(session);
    }
  });

  it("returns session when PAST_DUE within grace period", async () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const session = createSession("PRO", "PAST_DUE", threeDaysAgo);
    auth.mockResolvedValue(session);

    const result = await requirePlan("PRO");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(session);
    }
  });

  it("returns error when PAST_DUE beyond grace period", async () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    const session = createSession("PRO", "PAST_DUE", eightDaysAgo);
    auth.mockResolvedValue(session);

    const result = await requirePlan("PRO");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Payment overdue");
    }
  });
});
