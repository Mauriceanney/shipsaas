/**
 * Unit tests for AppSidebar component
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoist mocks for vitest
const { mockUseTheme, mockSetTheme, mockLogoutAction, mockUsePathname } = vi.hoisted(() => ({
  mockUseTheme: vi.fn(),
  mockSetTheme: vi.fn(),
  mockLogoutAction: vi.fn(),
  mockUsePathname: vi.fn(),
}));

// Mock next-themes
vi.mock("next-themes", () => ({
  useTheme: mockUseTheme,
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: mockUsePathname,
}));

// Mock logout action
vi.mock("@/actions/auth/logout", () => ({
  logoutAction: mockLogoutAction,
}));

import { AppSidebar } from "@/components/dashboard/app-sidebar";

const mockUser = {
  name: "John Doe",
  email: "john@example.com",
  image: null,
};

const mockFreeSubscription = {
  plan: "FREE",
  status: "ACTIVE",
};

const mockProSubscription = {
  plan: "PRO",
  status: "ACTIVE",
};

describe("AppSidebar", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue("/dashboard");
    mockUseTheme.mockReturnValue({
      theme: "light",
      setTheme: mockSetTheme,
      resolvedTheme: "light",
    });
    // Mock localStorage
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
      },
      writable: true,
    });
  });

  describe("dark mode toggle", () => {
    it("shows dark mode toggle switch in user menu dropdown", async () => {
      render(<AppSidebar user={mockUser} />);

      const userButton = screen.getByRole("button", { name: /JD/i });
      await user.click(userButton);

      await waitFor(() => {
        expect(screen.getByText("Dark mode")).toBeInTheDocument();
        expect(screen.getByRole("switch", { name: /toggle dark mode/i })).toBeInTheDocument();
      });
    });

    it("shows switch as unchecked when in light mode", async () => {
      mockUseTheme.mockReturnValue({
        theme: "light",
        setTheme: mockSetTheme,
        resolvedTheme: "light",
      });

      render(<AppSidebar user={mockUser} />);

      const userButton = screen.getByRole("button", { name: /JD/i });
      await user.click(userButton);

      await waitFor(() => {
        const toggle = screen.getByRole("switch", { name: /toggle dark mode/i });
        expect(toggle).toHaveAttribute("data-state", "unchecked");
      });
    });

    it("shows switch as checked when in dark mode", async () => {
      mockUseTheme.mockReturnValue({
        theme: "dark",
        setTheme: mockSetTheme,
        resolvedTheme: "dark",
      });

      render(<AppSidebar user={mockUser} />);

      const userButton = screen.getByRole("button", { name: /JD/i });
      await user.click(userButton);

      await waitFor(() => {
        const toggle = screen.getByRole("switch", { name: /toggle dark mode/i });
        expect(toggle).toHaveAttribute("data-state", "checked");
      });
    });

    it("toggles to dark mode when switch is clicked in light mode", async () => {
      mockUseTheme.mockReturnValue({
        theme: "light",
        setTheme: mockSetTheme,
        resolvedTheme: "light",
      });

      render(<AppSidebar user={mockUser} />);

      const userButton = screen.getByRole("button", { name: /JD/i });
      await user.click(userButton);

      await waitFor(() => {
        expect(screen.getByRole("switch", { name: /toggle dark mode/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("switch", { name: /toggle dark mode/i }));

      expect(mockSetTheme).toHaveBeenCalledWith("dark");
    });

    it("toggles to light mode when switch is clicked in dark mode", async () => {
      mockUseTheme.mockReturnValue({
        theme: "dark",
        setTheme: mockSetTheme,
        resolvedTheme: "dark",
      });

      render(<AppSidebar user={mockUser} />);

      const userButton = screen.getByRole("button", { name: /JD/i });
      await user.click(userButton);

      await waitFor(() => {
        expect(screen.getByRole("switch", { name: /toggle dark mode/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("switch", { name: /toggle dark mode/i }));

      expect(mockSetTheme).toHaveBeenCalledWith("light");
    });
  });

  describe("upgrade prompt", () => {
    it("shows upgrade prompt for FREE plan users", async () => {
      render(<AppSidebar user={mockUser} subscription={mockFreeSubscription} />);

      const userButton = screen.getByRole("button", { name: /JD/i });
      await user.click(userButton);

      await waitFor(() => {
        expect(screen.getByText("Upgrade to Pro")).toBeInTheDocument();
      });
    });

    it("upgrade prompt links to pricing page", async () => {
      render(<AppSidebar user={mockUser} subscription={mockFreeSubscription} />);

      const userButton = screen.getByRole("button", { name: /JD/i });
      await user.click(userButton);

      await waitFor(() => {
        const upgradeLink = screen.getByText("Upgrade to Pro").closest("a");
        expect(upgradeLink).toHaveAttribute("href", "/pricing");
      });
    });

    it("does not show upgrade prompt for PRO plan users", async () => {
      render(<AppSidebar user={mockUser} subscription={mockProSubscription} />);

      const userButton = screen.getByRole("button", { name: /JD/i });
      await user.click(userButton);

      await waitFor(() => {
        expect(screen.getByText("Settings")).toBeInTheDocument();
      });

      expect(screen.queryByText("Upgrade to Pro")).not.toBeInTheDocument();
    });

    it("does not show upgrade prompt when no subscription provided", async () => {
      render(<AppSidebar user={mockUser} />);

      const userButton = screen.getByRole("button", { name: /JD/i });
      await user.click(userButton);

      await waitFor(() => {
        expect(screen.getByText("Settings")).toBeInTheDocument();
      });

      expect(screen.queryByText("Upgrade to Pro")).not.toBeInTheDocument();
    });
  });

  describe("menu items", () => {
    it("shows Settings link in menu", async () => {
      render(<AppSidebar user={mockUser} />);

      const userButton = screen.getByRole("button", { name: /JD/i });
      await user.click(userButton);

      await waitFor(() => {
        expect(screen.getByText("Settings")).toBeInTheDocument();
        const settingsLink = screen.getByText("Settings").closest("a");
        expect(settingsLink).toHaveAttribute("href", "/settings");
      });
    });

    it("does not show Profile link in menu", async () => {
      render(<AppSidebar user={mockUser} />);

      const userButton = screen.getByRole("button", { name: /JD/i });
      await user.click(userButton);

      await waitFor(() => {
        expect(screen.getByText("Settings")).toBeInTheDocument();
      });

      // Profile should not be in the dropdown menu
      expect(screen.queryByRole("link", { name: /^profile$/i })).not.toBeInTheDocument();
    });

    it("does not show Billing link in menu", async () => {
      render(<AppSidebar user={mockUser} />);

      const userButton = screen.getByRole("button", { name: /JD/i });
      await user.click(userButton);

      await waitFor(() => {
        expect(screen.getByText("Settings")).toBeInTheDocument();
      });

      // Billing should not be in the dropdown menu
      expect(screen.queryByRole("link", { name: /^billing$/i })).not.toBeInTheDocument();
    });

    it("shows Sign out button", async () => {
      render(<AppSidebar user={mockUser} />);

      const userButton = screen.getByRole("button", { name: /JD/i });
      await user.click(userButton);

      await waitFor(() => {
        expect(screen.getByRole("menuitem", { name: /sign out/i })).toBeInTheDocument();
      });
    });
  });

  describe("sidebar rendering", () => {
    it("renders sidebar with user initials", () => {
      render(<AppSidebar user={mockUser} />);

      expect(screen.getByText("JD")).toBeInTheDocument();
    });

    it("renders dashboard link", () => {
      render(<AppSidebar user={mockUser} />);

      const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
      expect(dashboardLink).toBeInTheDocument();
    });
  });
});
