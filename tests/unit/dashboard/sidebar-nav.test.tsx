/**
 * TDD: Sidebar Navigation Tests
 */

import { render, screen } from "@testing-library/react";
import { Bell, CreditCard, Home, Settings, Shield, User } from "lucide-react";
import { describe, expect, it, vi } from "vitest";

import { SidebarNav, type NavItem } from "@/components/dashboard/sidebar-nav";

import type { Route } from "next";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/dashboard"),
}));

describe("SidebarNav", () => {
  const navItems: NavItem[] = [
    { title: "Dashboard", href: "/dashboard" as Route, icon: Home },
    { title: "Settings", href: "/settings" as Route, icon: Settings },
  ];

  it("renders all navigation items", () => {
    render(<SidebarNav items={navItems} />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("renders navigation links with correct hrefs", () => {
    render(<SidebarNav items={navItems} />);

    const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
    const settingsLink = screen.getByRole("link", { name: /settings/i });

    expect(dashboardLink).toHaveAttribute("href", "/dashboard");
    expect(settingsLink).toHaveAttribute("href", "/settings");
  });

  it("renders icons for each nav item", () => {
    const { container } = render(<SidebarNav items={navItems} />);

    const svgIcons = container.querySelectorAll("svg");
    expect(svgIcons.length).toBeGreaterThanOrEqual(2);
  });

  it("highlights active navigation item based on pathname", () => {
    render(<SidebarNav items={navItems} />);

    const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
    // Active link should have different styling (bg-accent or similar)
    expect(dashboardLink.className).toContain("bg-");
  });

  it("supports disabled nav items", () => {
    const itemsWithDisabled: NavItem[] = [
      ...navItems,
      { title: "Coming Soon", href: "/coming-soon" as Route, icon: Bell, disabled: true },
    ];

    render(<SidebarNav items={itemsWithDisabled} />);

    const disabledItem = screen.getByText("Coming Soon");
    expect(disabledItem.closest("a") || disabledItem.closest("span")).toHaveAttribute(
      "aria-disabled",
      "true"
    );
  });

  it("has proper accessibility attributes", () => {
    render(<SidebarNav items={navItems} />);

    const nav = screen.getByRole("navigation");
    expect(nav).toBeInTheDocument();
  });
});

describe("SidebarNav with settings subnav", () => {
  const settingsItems: NavItem[] = [
    { title: "Profile", href: "/settings/profile" as Route, icon: User },
    { title: "Security", href: "/settings/security" as Route, icon: Shield },
    { title: "Billing", href: "/settings/billing" as Route, icon: CreditCard },
    { title: "Notifications", href: "/settings/notifications" as Route, icon: Bell },
  ];

  it("renders all settings navigation items", () => {
    render(<SidebarNav items={settingsItems} />);

    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByText("Security")).toBeInTheDocument();
    expect(screen.getByText("Billing")).toBeInTheDocument();
    expect(screen.getByText("Notifications")).toBeInTheDocument();
  });
});
