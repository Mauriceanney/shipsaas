/**
 * Unit tests for UserMenu component
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoist mocks for vitest
const { mockUseTheme, mockSetTheme, mockLogoutAction } = vi.hoisted(() => ({
  mockUseTheme: vi.fn(),
  mockSetTheme: vi.fn(),
  mockLogoutAction: vi.fn(),
}));

// Mock next-themes
vi.mock("next-themes", () => ({
  useTheme: mockUseTheme,
}));

// Mock logout action
vi.mock("@/actions/auth/logout", () => ({
  logoutAction: mockLogoutAction,
}));

import { UserMenu } from "@/components/dashboard/user-menu";

const mockUser = {
  name: "John Doe",
  email: "john@example.com",
  image: null,
};

describe("UserMenu", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTheme.mockReturnValue({
      theme: "light",
      setTheme: mockSetTheme,
      systemTheme: "light",
    });
  });

  describe("rendering", () => {
    it("renders user avatar button", () => {
      render(<UserMenu user={mockUser} />);

      expect(screen.getByRole("button", { name: /user menu/i })).toBeInTheDocument();
    });

    it("shows user initials in avatar", () => {
      render(<UserMenu user={mockUser} />);

      expect(screen.getByText("JD")).toBeInTheDocument();
    });

    it("shows menu items when opened", async () => {
      render(<UserMenu user={mockUser} />);

      await user.click(screen.getByRole("button", { name: /user menu/i }));

      expect(screen.getByText("Profile")).toBeInTheDocument();
      expect(screen.getByText("Billing")).toBeInTheDocument();
      expect(screen.getByText("Settings")).toBeInTheDocument();
      expect(screen.getByText(/Theme:/)).toBeInTheDocument();
      expect(screen.getByText("Sign out")).toBeInTheDocument();
    });
  });

  describe("theme toggle", () => {
    it("shows current theme in menu", async () => {
      mockUseTheme.mockReturnValue({
        theme: "light",
        setTheme: mockSetTheme,
        systemTheme: "light",
      });

      render(<UserMenu user={mockUser} />);

      await user.click(screen.getByRole("button", { name: /user menu/i }));

      expect(screen.getByText("Theme: Light")).toBeInTheDocument();
    });

    it("shows dark theme label when dark mode is active", async () => {
      mockUseTheme.mockReturnValue({
        theme: "dark",
        setTheme: mockSetTheme,
        systemTheme: "dark",
      });

      render(<UserMenu user={mockUser} />);

      await user.click(screen.getByRole("button", { name: /user menu/i }));

      expect(screen.getByText("Theme: Dark")).toBeInTheDocument();
    });

    it("shows system theme label when system mode is active", async () => {
      mockUseTheme.mockReturnValue({
        theme: "system",
        setTheme: mockSetTheme,
        systemTheme: "light",
      });

      render(<UserMenu user={mockUser} />);

      await user.click(screen.getByRole("button", { name: /user menu/i }));

      expect(screen.getByText("Theme: System")).toBeInTheDocument();
    });

    it("cycles from light to dark when theme is clicked", async () => {
      mockUseTheme.mockReturnValue({
        theme: "light",
        setTheme: mockSetTheme,
        systemTheme: "light",
      });

      render(<UserMenu user={mockUser} />);

      await user.click(screen.getByRole("button", { name: /user menu/i }));
      await user.click(screen.getByText("Theme: Light"));

      expect(mockSetTheme).toHaveBeenCalledWith("dark");
    });

    it("cycles from dark to system when theme is clicked", async () => {
      mockUseTheme.mockReturnValue({
        theme: "dark",
        setTheme: mockSetTheme,
        systemTheme: "light",
      });

      render(<UserMenu user={mockUser} />);

      await user.click(screen.getByRole("button", { name: /user menu/i }));
      await user.click(screen.getByText("Theme: Dark"));

      expect(mockSetTheme).toHaveBeenCalledWith("system");
    });

    it("cycles from system to light when theme is clicked", async () => {
      mockUseTheme.mockReturnValue({
        theme: "system",
        setTheme: mockSetTheme,
        systemTheme: "light",
      });

      render(<UserMenu user={mockUser} />);

      await user.click(screen.getByRole("button", { name: /user menu/i }));
      await user.click(screen.getByText("Theme: System"));

      expect(mockSetTheme).toHaveBeenCalledWith("light");
    });
  });

  describe("initials generation", () => {
    it("generates initials from name", () => {
      render(<UserMenu user={{ name: "Jane Smith", email: "jane@example.com", image: null }} />);

      expect(screen.getByText("JS")).toBeInTheDocument();
    });

    it("generates initials from email when no name", () => {
      render(<UserMenu user={{ name: null, email: "jane@example.com", image: null }} />);

      expect(screen.getByText("JA")).toBeInTheDocument();
    });

    it("shows U when no name or email", () => {
      render(<UserMenu user={{ name: null, email: null, image: null }} />);

      expect(screen.getByText("U")).toBeInTheDocument();
    });
  });
});
