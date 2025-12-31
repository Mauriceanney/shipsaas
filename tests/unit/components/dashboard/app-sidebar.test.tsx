/**
 * Unit tests for AppSidebar component - theme toggle functionality
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

describe("AppSidebar", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue("/dashboard");
    mockUseTheme.mockReturnValue({
      theme: "light",
      setTheme: mockSetTheme,
      systemTheme: "light",
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

  describe("theme toggle in sidebar dropdown", () => {
    it("shows theme toggle in user menu dropdown", async () => {
      render(<AppSidebar user={mockUser} />);

      // Click on user menu button (shows initials when collapsed)
      const userButton = screen.getByRole("button", { name: /JD/i });
      await user.click(userButton);

      // Wait for dropdown and theme option
      await waitFor(() => {
        expect(screen.getByText(/Theme: Light/)).toBeInTheDocument();
      });
    });

    it("shows dark theme label when dark mode is active", async () => {
      mockUseTheme.mockReturnValue({
        theme: "dark",
        setTheme: mockSetTheme,
        systemTheme: "dark",
      });

      render(<AppSidebar user={mockUser} />);

      const userButton = screen.getByRole("button", { name: /JD/i });
      await user.click(userButton);

      await waitFor(() => {
        expect(screen.getByText(/Theme: Dark/)).toBeInTheDocument();
      });
    });

    it("shows system theme label when system mode is active", async () => {
      mockUseTheme.mockReturnValue({
        theme: "system",
        setTheme: mockSetTheme,
        systemTheme: "light",
      });

      render(<AppSidebar user={mockUser} />);

      const userButton = screen.getByRole("button", { name: /JD/i });
      await user.click(userButton);

      await waitFor(() => {
        expect(screen.getByText(/Theme: System/)).toBeInTheDocument();
      });
    });

    it("cycles theme when clicked", async () => {
      mockUseTheme.mockReturnValue({
        theme: "light",
        setTheme: mockSetTheme,
        systemTheme: "light",
      });

      render(<AppSidebar user={mockUser} />);

      const userButton = screen.getByRole("button", { name: /JD/i });
      await user.click(userButton);

      await waitFor(() => {
        expect(screen.getByText(/Theme: Light/)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/Theme: Light/));

      expect(mockSetTheme).toHaveBeenCalledWith("dark");
    });
  });

  describe("sidebar rendering", () => {
    it("renders sidebar with user initials", () => {
      render(<AppSidebar user={mockUser} />);

      expect(screen.getByText("JD")).toBeInTheDocument(); // Initials
    });

    it("renders dashboard link", () => {
      render(<AppSidebar user={mockUser} />);

      // Dashboard link exists (with title attribute when collapsed)
      const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
      expect(dashboardLink).toBeInTheDocument();
    });
  });
});
