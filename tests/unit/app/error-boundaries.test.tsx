import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Sentry
vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

// Mock error message utilities
vi.mock("@/lib/errors/messages", () => ({
  getErrorTitle: vi.fn((context: string) => `Error loading ${context}`),
  getErrorDescription: vi.fn(
    (context: string) => `We couldn't load your ${context}. Please try again.`
  ),
  getUserFriendlyMessage: vi.fn(() => "Something went wrong."),
  shouldShowTechnicalDetails: vi.fn(() => false),
}));

import * as Sentry from "@sentry/nextjs";
import { shouldShowTechnicalDetails } from "@/lib/errors/messages";
import DashboardError from "@/app/(dashboard)/error";
import SettingsError from "@/app/(dashboard)/settings/error";
import AdminError from "@/app/(admin)/error";

describe("Error Boundaries", () => {
  const mockReset = vi.fn();
  const mockError = new Error("Test error message") as Error & {
    digest?: string;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockError.digest = "error-123";
  });

  describe("DashboardError", () => {
    it("renders error title and description", () => {
      render(<DashboardError error={mockError} reset={mockReset} />);

      expect(screen.getByText("Error loading dashboard")).toBeInTheDocument();
      expect(
        screen.getByText(/We couldn't load your dashboard/)
      ).toBeInTheDocument();
    });

    it("displays user-friendly error message", () => {
      render(<DashboardError error={mockError} reset={mockReset} />);

      expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
    });

    it("shows error digest when available", () => {
      render(<DashboardError error={mockError} reset={mockReset} />);

      expect(screen.getByText(/Error ID: error-123/)).toBeInTheDocument();
    });

    it("hides error digest when not available", () => {
      const errorWithoutDigest = new Error("Test") as Error & {
        digest?: string;
      };
      render(<DashboardError error={errorWithoutDigest} reset={mockReset} />);

      expect(screen.queryByText(/Error ID:/)).not.toBeInTheDocument();
    });

    it("calls reset when Try again is clicked", () => {
      render(<DashboardError error={mockError} reset={mockReset} />);

      fireEvent.click(screen.getByRole("button", { name: /try again/i }));

      expect(mockReset).toHaveBeenCalledTimes(1);
    });

    it("captures exception in Sentry", () => {
      render(<DashboardError error={mockError} reset={mockReset} />);

      expect(Sentry.captureException).toHaveBeenCalledWith(mockError);
    });

    it("hides technical details in production", () => {
      render(<DashboardError error={mockError} reset={mockReset} />);

      expect(
        screen.queryByText("Technical Details")
      ).not.toBeInTheDocument();
    });

    it("shows technical details in development", () => {
      vi.mocked(shouldShowTechnicalDetails).mockReturnValue(true);

      render(<DashboardError error={mockError} reset={mockReset} />);

      expect(screen.getByText("Technical Details")).toBeInTheDocument();
    });
  });

  describe("SettingsError", () => {
    it("renders error title and description", () => {
      render(<SettingsError error={mockError} reset={mockReset} />);

      expect(screen.getByText("Error loading settings")).toBeInTheDocument();
      expect(
        screen.getByText(/We couldn't load your settings/)
      ).toBeInTheDocument();
    });

    it("displays user-friendly error message", () => {
      render(<SettingsError error={mockError} reset={mockReset} />);

      expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
    });

    it("shows error digest when available", () => {
      render(<SettingsError error={mockError} reset={mockReset} />);

      expect(screen.getByText(/Error ID: error-123/)).toBeInTheDocument();
    });

    it("calls reset when Try again is clicked", () => {
      render(<SettingsError error={mockError} reset={mockReset} />);

      fireEvent.click(screen.getByRole("button", { name: /try again/i }));

      expect(mockReset).toHaveBeenCalledTimes(1);
    });

    it("captures exception in Sentry", () => {
      render(<SettingsError error={mockError} reset={mockReset} />);

      expect(Sentry.captureException).toHaveBeenCalledWith(mockError);
    });
  });

  describe("AdminError", () => {
    it("renders error title and description", () => {
      render(<AdminError error={mockError} reset={mockReset} />);

      expect(screen.getByText("Error loading admin")).toBeInTheDocument();
      expect(
        screen.getByText(/We couldn't load your admin/)
      ).toBeInTheDocument();
    });

    it("displays user-friendly error message", () => {
      render(<AdminError error={mockError} reset={mockReset} />);

      expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
    });

    it("shows error digest when available", () => {
      render(<AdminError error={mockError} reset={mockReset} />);

      expect(screen.getByText(/Error ID: error-123/)).toBeInTheDocument();
    });

    it("calls reset when Try again is clicked", () => {
      render(<AdminError error={mockError} reset={mockReset} />);

      fireEvent.click(screen.getByRole("button", { name: /try again/i }));

      expect(mockReset).toHaveBeenCalledTimes(1);
    });

    it("captures exception in Sentry", () => {
      render(<AdminError error={mockError} reset={mockReset} />);

      expect(Sentry.captureException).toHaveBeenCalledWith(mockError);
    });
  });

  describe("Common behavior", () => {
    it.each([
      ["DashboardError", DashboardError],
      ["SettingsError", SettingsError],
      ["AdminError", AdminError],
    ])("%s has a Try again button", (_, ErrorComponent) => {
      render(<ErrorComponent error={mockError} reset={mockReset} />);

      expect(
        screen.getByRole("button", { name: /try again/i })
      ).toBeInTheDocument();
    });

    it.each([
      ["DashboardError", DashboardError],
      ["SettingsError", SettingsError],
      ["AdminError", AdminError],
    ])("%s shows Error alert", (_, ErrorComponent) => {
      render(<ErrorComponent error={mockError} reset={mockReset} />);

      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });
});
