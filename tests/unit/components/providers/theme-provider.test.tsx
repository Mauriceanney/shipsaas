/**
 * Unit tests for ThemeProvider component
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next-themes
vi.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  ),
}));

import { ThemeProvider } from "@/components/providers/theme-provider";

describe("ThemeProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders children correctly", () => {
      render(
        <ThemeProvider>
          <div data-testid="child">Child content</div>
        </ThemeProvider>
      );

      expect(screen.getByTestId("child")).toBeInTheDocument();
      expect(screen.getByText("Child content")).toBeInTheDocument();
    });

    it("wraps children in theme provider", () => {
      render(
        <ThemeProvider>
          <div>Content</div>
        </ThemeProvider>
      );

      expect(screen.getByTestId("theme-provider")).toBeInTheDocument();
    });

    it("renders multiple children", () => {
      render(
        <ThemeProvider>
          <div data-testid="child-1">First</div>
          <div data-testid="child-2">Second</div>
        </ThemeProvider>
      );

      expect(screen.getByTestId("child-1")).toBeInTheDocument();
      expect(screen.getByTestId("child-2")).toBeInTheDocument();
    });
  });
});
