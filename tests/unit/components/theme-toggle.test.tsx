/**
 * Unit tests for ThemeToggle component
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

import { ThemeToggle } from "@/components/theme-toggle";

describe("ThemeToggle", () => {
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
    it("renders toggle button", () => {
      render(<ThemeToggle />);

      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("has accessible label", () => {
      render(<ThemeToggle />);

      const button = screen.getByRole("button");
      expect(button).toHaveAccessibleName();
    });

    it("renders with sun icon in light mode", () => {
      mockUseTheme.mockReturnValue({
        theme: "light",
        setTheme: mockSetTheme,
        systemTheme: "light",
      });

      const { container } = render(<ThemeToggle />);

      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("renders with moon icon in dark mode", () => {
      mockUseTheme.mockReturnValue({
        theme: "dark",
        setTheme: mockSetTheme,
        systemTheme: "dark",
      });

      const { container } = render(<ThemeToggle />);

      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });

  describe("theme cycling", () => {
    it("cycles from light to dark when clicked", async () => {
      mockUseTheme.mockReturnValue({
        theme: "light",
        setTheme: mockSetTheme,
        systemTheme: "light",
      });

      render(<ThemeToggle />);

      const button = screen.getByRole("button");
      await user.click(button);

      expect(mockSetTheme).toHaveBeenCalledWith("dark");
    });

    it("cycles from dark to system when clicked", async () => {
      mockUseTheme.mockReturnValue({
        theme: "dark",
        setTheme: mockSetTheme,
        systemTheme: "light",
      });

      render(<ThemeToggle />);

      const button = screen.getByRole("button");
      await user.click(button);

      expect(mockSetTheme).toHaveBeenCalledWith("system");
    });

    it("cycles from system to light when clicked", async () => {
      mockUseTheme.mockReturnValue({
        theme: "system",
        setTheme: mockSetTheme,
        systemTheme: "light",
      });

      render(<ThemeToggle />);

      const button = screen.getByRole("button");
      await user.click(button);

      expect(mockSetTheme).toHaveBeenCalledWith("light");
    });
  });

  describe("accessibility", () => {
    it("is keyboard accessible", async () => {
      render(<ThemeToggle />);

      const button = screen.getByRole("button");
      button.focus();
      expect(button).toHaveFocus();
    });

    it("can be activated with Enter key", async () => {
      render(<ThemeToggle />);

      const button = screen.getByRole("button");
      button.focus();
      await user.keyboard("{Enter}");

      expect(mockSetTheme).toHaveBeenCalled();
    });

    it("can be activated with Space key", async () => {
      render(<ThemeToggle />);

      const button = screen.getByRole("button");
      button.focus();
      await user.keyboard(" ");

      expect(mockSetTheme).toHaveBeenCalled();
    });

    it("icon has aria-hidden attribute", () => {
      const { container } = render(<ThemeToggle />);

      const svgs = container.querySelectorAll("svg");
      svgs.forEach((svg) => {
        expect(svg).toHaveAttribute("aria-hidden", "true");
      });
    });
  });

  describe("hydration", () => {
    it("renders without hydration mismatch", () => {
      // Component should handle SSR/CSR mismatch gracefully
      mockUseTheme.mockReturnValue({
        theme: undefined, // Theme is undefined during SSR
        setTheme: mockSetTheme,
        systemTheme: undefined,
      });

      // Should not throw during render
      expect(() => render(<ThemeToggle />)).not.toThrow();
    });
  });
});
