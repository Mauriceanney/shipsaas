import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { UpgradeCard } from "@/components/feature-gate/upgrade-card";

describe("UpgradeCard", () => {
  describe("rendering", () => {
    it("renders with default title and description for PRO plan", () => {
      render(<UpgradeCard requiredPlan="PLUS" />);

      expect(screen.getByRole("heading", { name: /upgrade to pro/i })).toBeInTheDocument();
      expect(screen.getByText(/unlock this feature/i)).toBeInTheDocument();
    });

    it("renders with default title and description for ENTERPRISE plan", () => {
      render(<UpgradeCard requiredPlan="PRO" />);

      expect(screen.getByRole("heading", { name: /upgrade to enterprise/i })).toBeInTheDocument();
      expect(screen.getByText(/unlock this feature/i)).toBeInTheDocument();
    });

    it("renders custom title when provided", () => {
      render(
        <UpgradeCard requiredPlan="PLUS" title="Custom Title" />
      );

      expect(screen.getByRole("heading", { name: "Custom Title" })).toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: /upgrade to pro/i })).not.toBeInTheDocument();
    });

    it("renders custom description when provided", () => {
      render(
        <UpgradeCard
          requiredPlan="PLUS"
          description="This is a custom description for the upgrade."
        />
      );

      expect(screen.getByText("This is a custom description for the upgrade.")).toBeInTheDocument();
      expect(screen.queryByText(/unlock this feature/i)).not.toBeInTheDocument();
    });

    it("renders both custom title and description", () => {
      render(
        <UpgradeCard
          requiredPlan="PLUS"
          title="Premium Feature"
          description="Upgrade now to access premium features."
        />
      );

      expect(screen.getByText("Premium Feature")).toBeInTheDocument();
      expect(screen.getByText("Upgrade now to access premium features.")).toBeInTheDocument();
    });
  });

  describe("upgrade button", () => {
    it("renders upgrade button with correct text for PRO plan", () => {
      render(<UpgradeCard requiredPlan="PLUS" />);

      const button = screen.getByRole("link", { name: /upgrade to pro/i });
      expect(button).toBeInTheDocument();
    });

    it("renders upgrade button with correct text for ENTERPRISE plan", () => {
      render(<UpgradeCard requiredPlan="PRO" />);

      const button = screen.getByRole("link", { name: /upgrade to enterprise/i });
      expect(button).toBeInTheDocument();
    });

    it("links to pricing page with correct UTM parameters for PLUS plan", () => {
      render(<UpgradeCard requiredPlan="PLUS" />);

      const button = screen.getByRole("link", { name: /upgrade to pro/i });
      expect(button).toHaveAttribute("href", "/pricing?source=feature_gate&plan=PLUS");
    });

    it("links to pricing page with correct UTM parameters for PRO plan", () => {
      render(<UpgradeCard requiredPlan="PRO" />);

      const button = screen.getByRole("link", { name: /upgrade to enterprise/i });
      expect(button).toHaveAttribute("href", "/pricing?source=feature_gate&plan=PRO");
    });
  });

  describe("accessibility", () => {
    it("renders as a card with proper structure", () => {
      render(<UpgradeCard requiredPlan="PLUS" />);

      // Card should be accessible
      expect(screen.getByRole("link")).toBeInTheDocument();
    });

    it("has accessible button with role", () => {
      render(<UpgradeCard requiredPlan="PLUS" />);

      const button = screen.getByRole("link", { name: /upgrade to pro/i });
      expect(button).toBeInTheDocument();
    });

    it("plan name is capitalized correctly in text", () => {
      render(<UpgradeCard requiredPlan="PLUS" />);

      // Check that PRO appears as "Pro" (title case) in the heading
      expect(screen.getByRole("heading", { name: /Upgrade to Pro/ })).toBeInTheDocument();
    });

    it("plan name is uppercase in URL params", () => {
      render(<UpgradeCard requiredPlan="PLUS" />);

      const button = screen.getByRole("link");
      expect(button.getAttribute("href")).toContain("plan=PLUS");
    });
  });

  describe("visual elements", () => {
    it("renders an icon", () => {
      const { container } = render(<UpgradeCard requiredPlan="PLUS" />);

      // Check that an SVG icon is rendered
      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });
  });
});
