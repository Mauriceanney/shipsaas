/**
 * TDD: Dashboard Layout Tests
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DashboardHeader, DashboardSidebar } from "@/components/dashboard/layout";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/dashboard"),
}));

// Mock the logout action
vi.mock("@/actions/auth/logout", () => ({
  logoutAction: vi.fn(),
}));

describe("DashboardHeader", () => {
  const user = {
    name: "John Doe",
    email: "john@example.com",
    image: null,
  };

  it("renders header with brand name", () => {
    render(<DashboardHeader user={user} />);

    expect(screen.getByText("ShipSaaS")).toBeInTheDocument();
  });

  it("renders user menu", () => {
    render(<DashboardHeader user={user} />);

    const userMenuButton = screen.getByRole("button", { name: /user menu/i });
    expect(userMenuButton).toBeInTheDocument();
  });

  it("renders mobile menu button on mobile", () => {
    render(<DashboardHeader user={user} />);

    // Mobile menu button should exist (visible on mobile)
    const mobileButton = screen.getByRole("button", { name: /toggle menu/i });
    expect(mobileButton).toBeInTheDocument();
  });

  it("displays user initials in avatar", () => {
    render(<DashboardHeader user={user} />);

    expect(screen.getByText("JD")).toBeInTheDocument();
  });
});

describe("DashboardSidebar", () => {
  it("renders sidebar navigation", () => {
    render(<DashboardSidebar />);

    const nav = screen.getByRole("navigation");
    expect(nav).toBeInTheDocument();
  });

  it("renders Dashboard nav item", () => {
    render(<DashboardSidebar />);

    expect(screen.getByRole("link", { name: /dashboard/i })).toBeInTheDocument();
  });

  it("renders Settings nav item", () => {
    render(<DashboardSidebar />);

    expect(screen.getByRole("link", { name: /settings/i })).toBeInTheDocument();
  });

  it("renders Billing nav item", () => {
    render(<DashboardSidebar />);

    expect(screen.getByRole("link", { name: /billing/i })).toBeInTheDocument();
  });

  it("has correct href for Dashboard link", () => {
    render(<DashboardSidebar />);

    const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
    expect(dashboardLink).toHaveAttribute("href", "/dashboard");
  });

  it("has correct href for Settings link", () => {
    render(<DashboardSidebar />);

    const settingsLink = screen.getByRole("link", { name: /settings/i });
    expect(settingsLink).toHaveAttribute("href", "/settings");
  });

  it("has correct href for Billing link", () => {
    render(<DashboardSidebar />);

    const billingLink = screen.getByRole("link", { name: /billing/i });
    expect(billingLink).toHaveAttribute("href", "/settings/billing");
  });
});
