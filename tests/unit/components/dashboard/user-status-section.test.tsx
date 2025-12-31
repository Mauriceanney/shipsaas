import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoist mocks
const { mockAuth, mockDb } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockDb: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock dependencies
vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

import { UserStatusSection } from "@/components/dashboard/user-status-section";

describe("UserStatusSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const { container } = render(await UserStatusSection());

    expect(container.firstChild).toBeNull();
  });

  it("returns null when session has no user", async () => {
    mockAuth.mockResolvedValue({ user: null } as any);

    const { container } = render(await UserStatusSection());

    expect(container.firstChild).toBeNull();
  });

  it("shows onboarding checklist for incomplete users", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1", email: "test@example.com", name: "Test User" },
    } as any);

    mockDb.user.findUnique.mockResolvedValue({
      id: "user-1",
      name: "Test User",
      image: null,
      onboardingCompleted: false,
      subscription: null,
    } as any);

    render(await UserStatusSection());

    expect(screen.getByText("Getting Started")).toBeInTheDocument();
  });

  it("shows upgrade banner for free plan users without onboarding", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1", email: "test@example.com", name: "Test User" },
    } as any);

    mockDb.user.findUnique.mockResolvedValue({
      id: "user-1",
      name: "Test User",
      image: "http://example.com/avatar.jpg",
      onboardingCompleted: true,
      subscription: {
        plan: "FREE",
        status: "ACTIVE",
      },
    } as any);

    render(await UserStatusSection());

    expect(screen.getByText(/Advanced Analytics/i)).toBeInTheDocument();
  });

  it("does not show upgrade banner for pro users", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1", email: "test@example.com", name: "Test User" },
    } as any);

    mockDb.user.findUnique.mockResolvedValue({
      id: "user-1",
      name: "Test User",
      image: "http://example.com/avatar.jpg",
      onboardingCompleted: true,
      subscription: {
        plan: "PRO",
        status: "ACTIVE",
      },
    } as any);

    const { container } = render(await UserStatusSection());

    expect(container.firstChild).toBeNull();
  });

  it("prioritizes onboarding over upgrade banner", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1", email: "test@example.com", name: "Test User" },
    } as any);

    mockDb.user.findUnique.mockResolvedValue({
      id: "user-1",
      name: null,
      image: null,
      onboardingCompleted: false,
      subscription: {
        plan: "FREE",
        status: "ACTIVE",
      },
    } as any);

    render(await UserStatusSection());

    // Should show onboarding, not upgrade banner
    expect(screen.getByText("Getting Started")).toBeInTheDocument();
    expect(screen.queryByText(/Advanced Analytics/i)).not.toBeInTheDocument();
  });

  it("treats users without subscription as free plan", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1", email: "test@example.com", name: "Test User" },
    } as any);

    mockDb.user.findUnique.mockResolvedValue({
      id: "user-1",
      name: "Test User",
      image: "http://example.com/avatar.jpg",
      onboardingCompleted: true,
      subscription: null,
    } as any);

    render(await UserStatusSection());

    expect(screen.getByText(/Advanced Analytics/i)).toBeInTheDocument();
  });
});
