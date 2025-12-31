/**
 * Unit tests for UpgradePrompt component
 * Inline upgrade CTA for subtle promotion
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { UpgradePrompt } from "@/components/feature-gate/upgrade-prompt";

describe("UpgradePrompt", () => {
  describe("rendering", () => {
    it("renders default PRO upgrade message", () => {
      render(<UpgradePrompt />);

      expect(screen.getByText("Upgrade to Pro")).toBeInTheDocument();
    });

    it("renders ENTERPRISE upgrade message when specified", () => {
      render(<UpgradePrompt requiredPlan="PRO" />);

      expect(screen.getByText("Upgrade to Enterprise")).toBeInTheDocument();
    });

    it("renders custom message when provided", () => {
      render(<UpgradePrompt message="Get Premium" />);

      expect(screen.getByText("Get Premium")).toBeInTheDocument();
    });
  });

  describe("link behavior", () => {
    it("links to pricing page with PLUS plan", () => {
      render(<UpgradePrompt />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/pricing?source=upgrade_prompt&plan=PRO");
    });

    it("links to pricing page with PRO plan", () => {
      render(<UpgradePrompt requiredPlan="PRO" />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/pricing?source=upgrade_prompt&plan=ENTERPRISE");
    });
  });

  describe("variants", () => {
    it("renders with default variant", () => {
      render(<UpgradePrompt />);

      const link = screen.getByRole("link");
      expect(link).toHaveClass("bg-primary/5");
    });

    it("renders with subtle variant", () => {
      render(<UpgradePrompt variant="subtle" />);

      const link = screen.getByRole("link");
      expect(link).toHaveClass("bg-muted/50");
    });

    it("renders with highlight variant", () => {
      render(<UpgradePrompt variant="highlight" />);

      const link = screen.getByRole("link");
      expect(link).toHaveClass("bg-gradient-to-r");
    });
  });

  describe("sizes", () => {
    it("renders with md size by default", () => {
      render(<UpgradePrompt />);

      const link = screen.getByRole("link");
      expect(link).toHaveClass("text-sm");
    });

    it("renders with sm size when specified", () => {
      render(<UpgradePrompt size="sm" />);

      const link = screen.getByRole("link");
      expect(link).toHaveClass("text-xs");
    });
  });

  describe("accessibility", () => {
    it("has accessible link structure", () => {
      render(<UpgradePrompt />);

      const link = screen.getByRole("link");
      expect(link).toBeInTheDocument();
    });

    it("icons are hidden from screen readers", () => {
      const { container } = render(<UpgradePrompt />);

      const hiddenIcons = container.querySelectorAll('[aria-hidden="true"]');
      expect(hiddenIcons.length).toBe(2); // Sparkles and ArrowRight
    });
  });

  describe("custom className", () => {
    it("applies custom className", () => {
      render(<UpgradePrompt className="custom-class" />);

      const link = screen.getByRole("link");
      expect(link).toHaveClass("custom-class");
    });
  });
});
