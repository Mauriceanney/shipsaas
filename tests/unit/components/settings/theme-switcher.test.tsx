/**
 * Unit tests for ThemeSwitcher component
 * Visual card-based theme selector with Light/Dark/System options
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoist mocks for vitest
const { mockUseTheme, mockSetTheme } = vi.hoisted(() => ({
  mockUseTheme: vi.fn(),
  mockSetTheme: vi.fn(),
}));

// Mock next-themes
vi.mock("next-themes", () => ({
  useTheme: mockUseTheme,
}));

import { ThemeSwitcher } from "@/components/settings/theme-switcher";

describe("ThemeSwitcher", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTheme.mockReturnValue({
      theme: "light",
      setTheme: mockSetTheme,
      resolvedTheme: "light",
    });
  });

  describe("rendering", () => {
    it("renders three theme options", () => {
      render(<ThemeSwitcher />);

      expect(screen.getByRole("button", { name: /light/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /dark/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /system/i })).toBeInTheDocument();
    });

    it("renders section heading", () => {
      render(<ThemeSwitcher />);

      expect(screen.getByText("Appearance")).toBeInTheDocument();
    });

    it("shows description text", () => {
      render(<ThemeSwitcher />);

      expect(screen.getByText(/choose how/i)).toBeInTheDocument();
    });
  });

  describe("theme selection", () => {
    it("highlights light theme when active", () => {
      mockUseTheme.mockReturnValue({
        theme: "light",
        setTheme: mockSetTheme,
        resolvedTheme: "light",
      });

      render(<ThemeSwitcher />);

      const lightButton = screen.getByRole("button", { name: /light/i });
      expect(lightButton).toHaveAttribute("data-active", "true");
    });

    it("highlights dark theme when active", () => {
      mockUseTheme.mockReturnValue({
        theme: "dark",
        setTheme: mockSetTheme,
        resolvedTheme: "dark",
      });

      render(<ThemeSwitcher />);

      const darkButton = screen.getByRole("button", { name: /dark/i });
      expect(darkButton).toHaveAttribute("data-active", "true");
    });

    it("highlights system theme when active", () => {
      mockUseTheme.mockReturnValue({
        theme: "system",
        setTheme: mockSetTheme,
        resolvedTheme: "light",
      });

      render(<ThemeSwitcher />);

      const systemButton = screen.getByRole("button", { name: /system/i });
      expect(systemButton).toHaveAttribute("data-active", "true");
    });

    it("sets light theme when light card is clicked", async () => {
      mockUseTheme.mockReturnValue({
        theme: "dark",
        setTheme: mockSetTheme,
        resolvedTheme: "dark",
      });

      render(<ThemeSwitcher />);

      await user.click(screen.getByRole("button", { name: /light/i }));

      expect(mockSetTheme).toHaveBeenCalledWith("light");
    });

    it("sets dark theme when dark card is clicked", async () => {
      mockUseTheme.mockReturnValue({
        theme: "light",
        setTheme: mockSetTheme,
        resolvedTheme: "light",
      });

      render(<ThemeSwitcher />);

      await user.click(screen.getByRole("button", { name: /dark/i }));

      expect(mockSetTheme).toHaveBeenCalledWith("dark");
    });

    it("sets system theme when system card is clicked", async () => {
      mockUseTheme.mockReturnValue({
        theme: "light",
        setTheme: mockSetTheme,
        resolvedTheme: "light",
      });

      render(<ThemeSwitcher />);

      await user.click(screen.getByRole("button", { name: /system/i }));

      expect(mockSetTheme).toHaveBeenCalledWith("system");
    });
  });

  describe("accessibility", () => {
    it("all theme buttons are keyboard accessible", async () => {
      render(<ThemeSwitcher />);

      const lightButton = screen.getByRole("button", { name: /light/i });
      const darkButton = screen.getByRole("button", { name: /dark/i });
      const systemButton = screen.getByRole("button", { name: /system/i });

      lightButton.focus();
      expect(lightButton).toHaveFocus();

      darkButton.focus();
      expect(darkButton).toHaveFocus();

      systemButton.focus();
      expect(systemButton).toHaveFocus();
    });

    it("buttons can be activated with Enter key", async () => {
      render(<ThemeSwitcher />);

      const darkButton = screen.getByRole("button", { name: /dark/i });
      darkButton.focus();
      await user.keyboard("{Enter}");

      expect(mockSetTheme).toHaveBeenCalledWith("dark");
    });

    it("buttons can be activated with Space key", async () => {
      render(<ThemeSwitcher />);

      const darkButton = screen.getByRole("button", { name: /dark/i });
      darkButton.focus();
      await user.keyboard(" ");

      expect(mockSetTheme).toHaveBeenCalledWith("dark");
    });
  });

  describe("hydration", () => {
    it("renders without hydration mismatch when theme is undefined", () => {
      mockUseTheme.mockReturnValue({
        theme: undefined,
        setTheme: mockSetTheme,
        resolvedTheme: undefined,
      });

      expect(() => render(<ThemeSwitcher />)).not.toThrow();
    });
  });
});
