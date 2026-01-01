/**
 * Unit tests for UpgradeBanner component
 * Horizontal banner for upgrade CTAs
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";

import { UpgradeBanner } from "@/components/feature-gate/upgrade-banner";

describe("UpgradeBanner", () => {
  const user = userEvent.setup();

  describe("rendering", () => {
    it("renders default PLUS upgrade content", () => {
      render(<UpgradeBanner />);

      expect(screen.getByText("Upgrade to Pro")).toBeInTheDocument();
      expect(
        screen.getByText(/Get access to premium features with our Pro plan/)
      ).toBeInTheDocument();
    });

    it("renders with custom title", () => {
      render(<UpgradeBanner title="Unlock Premium" />);

      expect(screen.getByText("Unlock Premium")).toBeInTheDocument();
    });

    it("renders with custom description", () => {
      render(<UpgradeBanner description="Get amazing features" />);

      expect(screen.getByText("Get amazing features")).toBeInTheDocument();
    });

    it("renders with feature-based title", () => {
      render(<UpgradeBanner feature="Advanced Analytics" />);

      expect(screen.getByText("Unlock Advanced Analytics")).toBeInTheDocument();
    });

    it("renders PRO upgrade when specified", () => {
      render(<UpgradeBanner requiredPlan="PRO" />);

      expect(
        screen.getByText(/Get access to premium features with our Enterprise plan/)
      ).toBeInTheDocument();
    });
  });

  describe("link behavior", () => {
    it("upgrade button links to pricing page with PLUS plan", () => {
      render(<UpgradeBanner />);

      const link = screen.getByRole("link", { name: /upgrade/i });
      expect(link).toHaveAttribute("href", "/pricing?source=upgrade_banner&plan=PLUS");
    });

    it("upgrade button links to pricing page with PRO plan", () => {
      render(<UpgradeBanner requiredPlan="PRO" />);

      const link = screen.getByRole("link", { name: /upgrade/i });
      expect(link).toHaveAttribute("href", "/pricing?source=upgrade_banner&plan=PRO");
    });
  });

  describe("dismiss functionality", () => {
    it("does not show dismiss button by default", () => {
      render(<UpgradeBanner />);

      expect(
        screen.queryByRole("button", { name: /dismiss/i })
      ).not.toBeInTheDocument();
    });

    it("shows dismiss button when dismissible", () => {
      render(<UpgradeBanner dismissible />);

      expect(
        screen.getByRole("button", { name: /dismiss/i })
      ).toBeInTheDocument();
    });

    it("hides banner when dismissed", async () => {
      render(<UpgradeBanner dismissible />);

      const dismissButton = screen.getByRole("button", { name: /dismiss/i });
      await user.click(dismissButton);

      await waitFor(() => {
        expect(screen.queryByText("Upgrade to Pro")).not.toBeInTheDocument();
      });
    });
  });

  describe("variants", () => {
    it("renders with default variant", () => {
      const { container } = render(<UpgradeBanner />);

      const banner = container.querySelector('[role="region"]');
      expect(banner).toHaveClass("bg-primary/5");
    });

    it("renders with gradient variant", () => {
      const { container } = render(<UpgradeBanner variant="gradient" />);

      const banner = container.querySelector('[role="region"]');
      expect(banner).toHaveClass("bg-gradient-to-r");
    });

    it("renders with subtle variant", () => {
      const { container } = render(<UpgradeBanner variant="subtle" />);

      const banner = container.querySelector('[role="region"]');
      expect(banner).toHaveClass("bg-muted");
    });
  });

  describe("accessibility", () => {
    it("has proper region role", () => {
      render(<UpgradeBanner />);

      expect(
        screen.getByRole("region", { name: /upgrade promotion/i })
      ).toBeInTheDocument();
    });

    it("dismiss button has accessible label", () => {
      render(<UpgradeBanner dismissible />);

      expect(
        screen.getByRole("button", { name: /dismiss banner/i })
      ).toBeInTheDocument();
    });

    it("icons are hidden from screen readers", () => {
      const { container } = render(<UpgradeBanner />);

      const hiddenIcons = container.querySelectorAll('[aria-hidden="true"]');
      expect(hiddenIcons.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("custom className", () => {
    it("applies custom className", () => {
      const { container } = render(<UpgradeBanner className="custom-class" />);

      const banner = container.querySelector('[role="region"]');
      expect(banner).toHaveClass("custom-class");
    });
  });
});
