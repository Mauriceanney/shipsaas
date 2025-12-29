/**
 * TDD: Pricing Toggle Component Tests
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PricingToggle } from "@/components/pricing/pricing-toggle";

import type { BillingInterval } from "@/lib/stripe/types";

describe("PricingToggle", () => {
  const defaultProps = {
    interval: "monthly" as BillingInterval,
    onIntervalChange: vi.fn(),
    savingsPercent: 17,
  };

  it("renders monthly and yearly buttons", () => {
    render(<PricingToggle {...defaultProps} />);

    expect(screen.getByText("Monthly")).toBeInTheDocument();
    expect(screen.getByText("Yearly")).toBeInTheDocument();
  });

  it("renders savings percentage badge", () => {
    render(<PricingToggle {...defaultProps} />);

    expect(screen.getByText("Save 17%")).toBeInTheDocument();
  });

  it("uses default savings percentage when not provided", () => {
    const propsWithoutSavings = {
      interval: "monthly" as BillingInterval,
      onIntervalChange: vi.fn(),
    };

    render(<PricingToggle {...propsWithoutSavings} />);

    expect(screen.getByText("Save 17%")).toBeInTheDocument();
  });

  it("renders custom savings percentage", () => {
    render(<PricingToggle {...defaultProps} savingsPercent={20} />);

    expect(screen.getByText("Save 20%")).toBeInTheDocument();
  });

  it("renders toggle button with aria-label", () => {
    render(<PricingToggle {...defaultProps} />);

    expect(
      screen.getByRole("button", { name: /toggle billing interval/i })
    ).toBeInTheDocument();
  });

  describe("monthly interval selected", () => {
    it("highlights monthly button", () => {
      render(<PricingToggle {...defaultProps} interval="monthly" />);

      const monthlyButton = screen.getByText("Monthly");
      expect(monthlyButton).toHaveClass("text-foreground");
      expect(monthlyButton).not.toHaveClass("text-muted-foreground");
    });

    it("dims yearly button", () => {
      render(<PricingToggle {...defaultProps} interval="monthly" />);

      // Get the yearly button (parent of "Yearly" text that includes the badge)
      const yearlyButtons = screen.getAllByRole("button");
      const yearlyButton = yearlyButtons.find((button) =>
        button.textContent?.includes("Yearly")
      );
      expect(yearlyButton).toHaveClass("text-muted-foreground");
    });

    it("toggle switch is in monthly position", () => {
      const { container } = render(
        <PricingToggle {...defaultProps} interval="monthly" />
      );

      const toggleButton = screen.getByRole("button", {
        name: /toggle billing interval/i,
      });
      expect(toggleButton).toHaveClass("bg-muted");

      const toggleIndicator = container.querySelector(".rounded-full.bg-white");
      expect(toggleIndicator).not.toHaveClass("translate-x-7");
    });
  });

  describe("yearly interval selected", () => {
    it("highlights yearly button", () => {
      render(<PricingToggle {...defaultProps} interval="yearly" />);

      // Get the yearly button area
      const yearlyButtons = screen.getAllByRole("button");
      const yearlyButton = yearlyButtons.find((button) =>
        button.textContent?.includes("Yearly")
      );
      expect(yearlyButton).toHaveClass("text-foreground");
    });

    it("dims monthly button", () => {
      render(<PricingToggle {...defaultProps} interval="yearly" />);

      const monthlyButton = screen.getByText("Monthly");
      expect(monthlyButton).toHaveClass("text-muted-foreground");
    });

    it("toggle switch is in yearly position", () => {
      const { container } = render(
        <PricingToggle {...defaultProps} interval="yearly" />
      );

      const toggleButton = screen.getByRole("button", {
        name: /toggle billing interval/i,
      });
      expect(toggleButton).toHaveClass("bg-primary");

      const toggleIndicator = container.querySelector(".rounded-full.bg-white");
      expect(toggleIndicator).toHaveClass("translate-x-7");
    });
  });

  describe("click interactions", () => {
    it("calls onIntervalChange with monthly when monthly button clicked", () => {
      const onIntervalChange = vi.fn();

      render(
        <PricingToggle
          interval="yearly"
          onIntervalChange={onIntervalChange}
          savingsPercent={17}
        />
      );

      fireEvent.click(screen.getByText("Monthly"));

      expect(onIntervalChange).toHaveBeenCalledWith("monthly");
    });

    it("calls onIntervalChange with yearly when yearly button clicked", () => {
      const onIntervalChange = vi.fn();

      render(
        <PricingToggle
          interval="monthly"
          onIntervalChange={onIntervalChange}
          savingsPercent={17}
        />
      );

      // Click on the Yearly text button
      const yearlyButton = screen.getByRole("button", {
        name: /yearly save/i,
      });
      fireEvent.click(yearlyButton);

      expect(onIntervalChange).toHaveBeenCalledWith("yearly");
    });

    it("toggles to yearly when toggle button clicked from monthly", () => {
      const onIntervalChange = vi.fn();

      render(
        <PricingToggle
          interval="monthly"
          onIntervalChange={onIntervalChange}
          savingsPercent={17}
        />
      );

      const toggleButton = screen.getByRole("button", {
        name: /toggle billing interval/i,
      });
      fireEvent.click(toggleButton);

      expect(onIntervalChange).toHaveBeenCalledWith("yearly");
    });

    it("toggles to monthly when toggle button clicked from yearly", () => {
      const onIntervalChange = vi.fn();

      render(
        <PricingToggle
          interval="yearly"
          onIntervalChange={onIntervalChange}
          savingsPercent={17}
        />
      );

      const toggleButton = screen.getByRole("button", {
        name: /toggle billing interval/i,
      });
      fireEvent.click(toggleButton);

      expect(onIntervalChange).toHaveBeenCalledWith("monthly");
    });
  });

  describe("styling", () => {
    it("has proper flex layout", () => {
      const { container } = render(<PricingToggle {...defaultProps} />);

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("flex", "items-center", "justify-center");
    });

    it("savings badge has green styling", () => {
      render(<PricingToggle {...defaultProps} />);

      const badge = screen.getByText("Save 17%");
      expect(badge).toHaveClass("bg-green-100", "text-green-700");
    });
  });
});
