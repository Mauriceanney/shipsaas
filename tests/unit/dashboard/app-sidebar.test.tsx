/**
 * TDD: App Sidebar Tests
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { AppSidebar } from "@/components/dashboard/app-sidebar";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/dashboard"),
}));

// Mock the logout action
vi.mock("@/actions/auth/logout", () => ({
  logoutAction: vi.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("AppSidebar", () => {
  const user = {
    name: "John Doe",
    email: "john@example.com",
    image: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it("renders sidebar with brand name when expanded", () => {
    localStorageMock.getItem.mockReturnValue("false");
    render(<AppSidebar user={user} />);

    expect(screen.getByText("ShipSaaS")).toBeInTheDocument();
  });

  it("renders navigation items", () => {
    localStorageMock.getItem.mockReturnValue("false");
    render(<AppSidebar user={user} />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Billing")).toBeInTheDocument();
  });

  it("renders user info at bottom when expanded", () => {
    localStorageMock.getItem.mockReturnValue("false");
    render(<AppSidebar user={user} />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
  });

  it("renders user initials in avatar", () => {
    localStorageMock.getItem.mockReturnValue("false");
    render(<AppSidebar user={user} />);

    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("has collapse toggle button", () => {
    render(<AppSidebar user={user} />);

    const toggleButton = screen.getByRole("button", { name: /collapse sidebar|expand sidebar/i });
    expect(toggleButton).toBeInTheDocument();
  });

  it("toggles collapsed state on button click", () => {
    localStorageMock.getItem.mockReturnValue("false");
    render(<AppSidebar user={user} />);

    const toggleButton = screen.getByRole("button", { name: /collapse sidebar/i });
    fireEvent.click(toggleButton);

    expect(localStorageMock.setItem).toHaveBeenCalledWith("sidebar-collapsed", "true");
  });

  it("starts collapsed by default", () => {
    localStorageMock.getItem.mockReturnValue(null);
    render(<AppSidebar user={user} />);

    // When collapsed, brand name should not be visible
    expect(screen.queryByText("ShipSaaS")).not.toBeInTheDocument();
  });

  it("loads collapsed state from localStorage", () => {
    localStorageMock.getItem.mockReturnValue("false");
    render(<AppSidebar user={user} />);

    expect(localStorageMock.getItem).toHaveBeenCalledWith("sidebar-collapsed");
    // When expanded, brand name should be visible
    expect(screen.getByText("ShipSaaS")).toBeInTheDocument();
  });

  it("renders navigation links with correct hrefs", () => {
    localStorageMock.getItem.mockReturnValue("false");
    render(<AppSidebar user={user} />);

    expect(screen.getByRole("link", { name: /dashboard/i })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: /settings/i })).toHaveAttribute("href", "/settings");
    expect(screen.getByRole("link", { name: /billing/i })).toHaveAttribute("href", "/settings/billing");
  });

  it("highlights active navigation item", () => {
    localStorageMock.getItem.mockReturnValue("false");
    render(<AppSidebar user={user} />);

    const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
    expect(dashboardLink.className).toContain("bg-accent");
  });

  it("handles user with no name gracefully", () => {
    localStorageMock.getItem.mockReturnValue("false");
    const userNoName = { ...user, name: null };
    render(<AppSidebar user={userNoName} />);

    // Should show "User" as fallback
    expect(screen.getByText("User")).toBeInTheDocument();
    // Should show email initials
    expect(screen.getByText("JO")).toBeInTheDocument();
  });
});
