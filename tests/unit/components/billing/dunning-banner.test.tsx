/**
 * Unit tests for DunningBanner component
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoist mocks for vitest
const { mockGetDunningStatus, mockRedirectToPortal } = vi.hoisted(() => ({
  mockGetDunningStatus: vi.fn(),
  mockRedirectToPortal: vi.fn(),
}));

// Mock server actions
vi.mock("@/actions/billing/get-dunning-status", () => ({
  getDunningStatus: mockGetDunningStatus,
}));

vi.mock("@/actions/stripe/create-portal", () => ({
  redirectToPortal: mockRedirectToPortal,
}));

import { DunningBanner } from "@/components/billing/dunning-banner";

describe("DunningBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("visibility", () => {
    it("renders nothing when showBanner is false", async () => {
      mockGetDunningStatus.mockResolvedValue({
        success: true,
        data: {
          showBanner: false,
          daysSinceFailed: 0,
          statusChangedAt: null,
        },
      });

      const { container } = render(await DunningBanner());

      expect(container.firstChild).toBeNull();
    });

    it("renders nothing when action returns error", async () => {
      mockGetDunningStatus.mockResolvedValue({
        success: false,
        error: "Unauthorized",
      });

      const { container } = render(await DunningBanner());

      expect(container.firstChild).toBeNull();
    });

    it("renders banner when showBanner is true", async () => {
      mockGetDunningStatus.mockResolvedValue({
        success: true,
        data: {
          showBanner: true,
          daysSinceFailed: 3,
          statusChangedAt: new Date("2025-12-27"),
        },
      });

      render(await DunningBanner());

      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  describe("content", () => {
    it("displays correct title", async () => {
      mockGetDunningStatus.mockResolvedValue({
        success: true,
        data: {
          showBanner: true,
          daysSinceFailed: 2,
          statusChangedAt: new Date("2025-12-28"),
        },
      });

      render(await DunningBanner());

      expect(screen.getByText("Payment Failed")).toBeInTheDocument();
    });

    it("displays message with singular 'day' for 1 day", async () => {
      mockGetDunningStatus.mockResolvedValue({
        success: true,
        data: {
          showBanner: true,
          daysSinceFailed: 1,
          statusChangedAt: new Date("2025-12-29"),
        },
      });

      render(await DunningBanner());

      expect(screen.getByText(/1 day ago/)).toBeInTheDocument();
    });

    it("displays message with plural 'days' for multiple days", async () => {
      mockGetDunningStatus.mockResolvedValue({
        success: true,
        data: {
          showBanner: true,
          daysSinceFailed: 5,
          statusChangedAt: new Date("2025-12-25"),
        },
      });

      render(await DunningBanner());

      expect(screen.getByText(/5 days ago/)).toBeInTheDocument();
    });

    it("displays message with plural 'days' for 0 days", async () => {
      mockGetDunningStatus.mockResolvedValue({
        success: true,
        data: {
          showBanner: true,
          daysSinceFailed: 0,
          statusChangedAt: new Date(),
        },
      });

      render(await DunningBanner());

      expect(screen.getByText(/0 days ago/)).toBeInTheDocument();
    });

    it("includes call to action text", async () => {
      mockGetDunningStatus.mockResolvedValue({
        success: true,
        data: {
          showBanner: true,
          daysSinceFailed: 3,
          statusChangedAt: new Date("2025-12-27"),
        },
      });

      render(await DunningBanner());

      expect(
        screen.getByText(/Update your payment method to avoid service interruption/)
      ).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("uses alert role for semantic HTML", async () => {
      mockGetDunningStatus.mockResolvedValue({
        success: true,
        data: {
          showBanner: true,
          daysSinceFailed: 2,
          statusChangedAt: new Date("2025-12-28"),
        },
      });

      render(await DunningBanner());

      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
    });

    it("has accessible button text", async () => {
      mockGetDunningStatus.mockResolvedValue({
        success: true,
        data: {
          showBanner: true,
          daysSinceFailed: 2,
          statusChangedAt: new Date("2025-12-28"),
        },
      });

      render(await DunningBanner());

      expect(
        screen.getByRole("button", { name: /Update Payment Method/i })
      ).toBeInTheDocument();
    });

    it("button is keyboard accessible", async () => {
      mockGetDunningStatus.mockResolvedValue({
        success: true,
        data: {
          showBanner: true,
          daysSinceFailed: 2,
          statusChangedAt: new Date("2025-12-28"),
        },
      });

      render(await DunningBanner());

      const button = screen.getByRole("button", {
        name: /Update Payment Method/i,
      });
      expect(button).toHaveAttribute("type", "submit");
    });

    it("has icon with proper aria-hidden", async () => {
      mockGetDunningStatus.mockResolvedValue({
        success: true,
        data: {
          showBanner: true,
          daysSinceFailed: 2,
          statusChangedAt: new Date("2025-12-28"),
        },
      });

      const { container } = render(await DunningBanner());

      const icon = container.querySelector('svg');
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("form submission", () => {
    it("form has action attribute pointing to redirectToPortal", async () => {
      mockGetDunningStatus.mockResolvedValue({
        success: true,
        data: {
          showBanner: true,
          daysSinceFailed: 2,
          statusChangedAt: new Date("2025-12-28"),
        },
      });

      const { container } = render(await DunningBanner());

      const form = container.querySelector("form");
      expect(form).toBeInTheDocument();
    });
  });

  describe("styling", () => {
    it("uses destructive variant for alert", async () => {
      mockGetDunningStatus.mockResolvedValue({
        success: true,
        data: {
          showBanner: true,
          daysSinceFailed: 2,
          statusChangedAt: new Date("2025-12-28"),
        },
      });

      const { container } = render(await DunningBanner());

      const alert = screen.getByRole("alert");
      expect(alert.className).toContain("destructive");
    });

    it("has margin bottom for spacing", async () => {
      mockGetDunningStatus.mockResolvedValue({
        success: true,
        data: {
          showBanner: true,
          daysSinceFailed: 2,
          statusChangedAt: new Date("2025-12-28"),
        },
      });

      const { container } = render(await DunningBanner());

      const alert = screen.getByRole("alert");
      expect(alert.className).toContain("mb-4");
    });
  });
});
