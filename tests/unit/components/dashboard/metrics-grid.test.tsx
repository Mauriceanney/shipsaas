import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoist mocks
const { mockAuth, mockGetUserDashboardMetrics } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetUserDashboardMetrics: vi.fn(),
}));

// Mock dependencies
vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/actions/dashboard/metrics", () => ({
  getUserDashboardMetrics: mockGetUserDashboardMetrics,
}));

import { MetricsGrid } from "@/components/dashboard/metrics-grid";

describe("MetricsGrid", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const { container } = render(await MetricsGrid());

    expect(container.firstChild).toBeNull();
  });

  it("returns null when session has no user", async () => {
    mockAuth.mockResolvedValue({ user: null } as any);

    const { container } = render(await MetricsGrid());

    expect(container.firstChild).toBeNull();
  });

  it("displays all 4 metric cards with data", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1", email: "test@example.com" },
    } as any);

    mockGetUserDashboardMetrics.mockResolvedValue({
      success: true,
      data: {
        account: {
          memberSince: new Date("2024-01-01"),
          lastActive: new Date(),
        },
        subscription: {
          plan: "PRO",
          status: "ACTIVE",
          currentPeriodEnd: new Date("2025-02-01"),
        },
        usage: {
          apiCalls: { used: 500, limit: 10000 },
          projects: { used: 3, limit: 10 },
          storage: { used: 1024, limit: 5120 },
          teamMembers: { used: 2, limit: 5 },
        },
        activity: {
          recentLogins: 15,
          lastLoginAt: new Date(),
        },
      },
    } as any);

    render(await MetricsGrid());

    // Check for all 4 cards
    expect(screen.getByText("Current Plan")).toBeInTheDocument();
    expect(screen.getByText("API Calls")).toBeInTheDocument();
    expect(screen.getByText("Projects")).toBeInTheDocument();
    expect(screen.getByText("Member Since")).toBeInTheDocument();
  });

  it("displays plan name correctly", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1" },
    } as any);

    mockGetUserDashboardMetrics.mockResolvedValue({
      success: true,
      data: {
        account: {
          memberSince: new Date("2024-01-01"),
          lastActive: new Date(),
        },
        subscription: {
          plan: "PRO",
          status: "ACTIVE",
          currentPeriodEnd: new Date("2025-02-01"),
        },
        usage: {
          apiCalls: { used: 0, limit: 10000 },
          projects: { used: 0, limit: 10 },
          storage: { used: 0, limit: 5120 },
          teamMembers: { used: 0, limit: 5 },
        },
        activity: {
          recentLogins: 0,
          lastLoginAt: null,
        },
      },
    } as any);

    render(await MetricsGrid());

    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("Active subscription")).toBeInTheDocument();
  });

  it("displays free plan when no subscription", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1" },
    } as any);

    mockGetUserDashboardMetrics.mockResolvedValue({
      success: true,
      data: {
        account: {
          memberSince: new Date("2024-01-01"),
          lastActive: new Date(),
        },
        subscription: null,
        usage: {
          apiCalls: { used: 0, limit: 100 },
          projects: { used: 0, limit: 1 },
          storage: { used: 0, limit: 512 },
          teamMembers: { used: 0, limit: 1 },
        },
        activity: {
          recentLogins: 0,
          lastLoginAt: null,
        },
      },
    } as any);

    render(await MetricsGrid());

    expect(screen.getByText("Free")).toBeInTheDocument();
  });

  it("handles failed metrics fetch gracefully", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1" },
    } as any);

    mockGetUserDashboardMetrics.mockResolvedValue({
      success: false,
      error: "Failed to fetch",
    } as any);

    render(await MetricsGrid());

    // Should still render cards with placeholder data
    expect(screen.getByText("Current Plan")).toBeInTheDocument();
    expect(screen.getAllByText("—")).toHaveLength(3); // API Calls, Projects, Member Since
  });
});
