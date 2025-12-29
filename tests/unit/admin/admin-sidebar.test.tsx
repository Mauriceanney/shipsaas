/**
 * TDD: Admin Sidebar Component Tests
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/admin"),
}));

import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

describe("AdminSidebar", () => {
  it("renders admin navigation links", () => {
    render(<AdminSidebar />);

    // Use getAllByRole for links that match "dashboard" pattern
    const dashboardLinks = screen.getAllByRole("link", { name: /dashboard/i });
    expect(dashboardLinks.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("link", { name: /users/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /plans/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /settings/i })).toBeInTheDocument();
  });

  it("renders admin title", () => {
    render(<AdminSidebar />);

    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("highlights active dashboard link", () => {
    vi.mocked(usePathname).mockReturnValue("/admin");
    render(<AdminSidebar />);

    // Get the main Dashboard link (not Back to Dashboard)
    const dashboardLink = screen.getByRole("link", { name: /^Dashboard$/i });
    expect(dashboardLink).toHaveClass("bg-accent");
  });

  it("highlights active users link", () => {
    vi.mocked(usePathname).mockReturnValue("/admin/users");
    render(<AdminSidebar />);

    const usersLink = screen.getByRole("link", { name: /users/i });
    expect(usersLink).toHaveClass("bg-accent");
  });

  it("highlights active plans link", () => {
    vi.mocked(usePathname).mockReturnValue("/admin/plans");
    render(<AdminSidebar />);

    const plansLink = screen.getByRole("link", { name: /plans/i });
    expect(plansLink).toHaveClass("bg-accent");
  });

  it("highlights active settings link", () => {
    vi.mocked(usePathname).mockReturnValue("/admin/settings");
    render(<AdminSidebar />);

    const settingsLink = screen.getByRole("link", { name: /settings/i });
    expect(settingsLink).toHaveClass("bg-accent");
  });

  it("renders back to dashboard link", () => {
    render(<AdminSidebar />);

    const backLink = screen.getByRole("link", { name: /back to dashboard/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/dashboard");
  });

  it("renders with proper navigation structure", () => {
    render(<AdminSidebar />);

    const nav = screen.getByRole("navigation");
    expect(nav).toBeInTheDocument();
  });
});
