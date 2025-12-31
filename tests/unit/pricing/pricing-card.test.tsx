/**
 * TDD: Pricing Card Component Tests
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { PricingCard } from "@/components/pricing/pricing-card";

import type { BillingInterval, PlanConfig } from "@/lib/stripe/types";
import type { Plan } from "@prisma/client";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock Stripe config
vi.mock("@/lib/stripe/config", () => ({
  PLAN_PRICING: {
    PLUS: { monthly: 19, yearly: 190 },
    PRO: { monthly: 99, yearly: 990 },
  },
}));

describe("PricingCard", () => {
  const proPlan: PlanConfig = {
    id: "PLUS",
    name: "Pro",
    description: "For professionals and small teams",
    prices: { monthly: "price_pro_monthly", yearly: "price_pro_yearly" },
    features: ["Feature 1", "Feature 2", "Feature 3"],
    highlighted: true,
    badge: "Popular",
  };

  const freePlan: PlanConfig = {
    id: "FREE",
    name: "Free",
    description: "For individuals getting started",
    prices: { monthly: "", yearly: "" },
    features: ["Basic feature"],
  };

  const enterprisePlan: PlanConfig = {
    id: "PRO",
    name: "Enterprise",
    description: "For large organizations",
    prices: {
      monthly: "price_enterprise_monthly",
      yearly: "price_enterprise_yearly",
    },
    features: ["Enterprise feature"],
  };

  const defaultProps = {
    plan: proPlan,
    interval: "monthly" as BillingInterval,
    currentPlan: undefined as Plan | undefined,
    isAuthenticated: true,
    onSubscribe: vi.fn(),
    onError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders plan name", () => {
      render(<PricingCard {...defaultProps} />);

      expect(screen.getByText("Pro")).toBeInTheDocument();
    });

    it("renders plan description", () => {
      render(<PricingCard {...defaultProps} />);

      expect(
        screen.getByText("For professionals and small teams")
      ).toBeInTheDocument();
    });

    it("renders monthly price", () => {
      render(<PricingCard {...defaultProps} interval="monthly" />);

      expect(screen.getByText("$19")).toBeInTheDocument();
      expect(screen.getByText("/mo")).toBeInTheDocument();
    });

    it("renders yearly price", () => {
      render(<PricingCard {...defaultProps} interval="yearly" />);

      expect(screen.getByText("$190")).toBeInTheDocument();
      expect(screen.getByText("/yr")).toBeInTheDocument();
    });

    it("renders all features", () => {
      render(<PricingCard {...defaultProps} />);

      expect(screen.getByText("Feature 1")).toBeInTheDocument();
      expect(screen.getByText("Feature 2")).toBeInTheDocument();
      expect(screen.getByText("Feature 3")).toBeInTheDocument();
    });

    it("renders check icons for features", () => {
      const { container } = render(<PricingCard {...defaultProps} />);

      const checkIcons = container.querySelectorAll("svg");
      expect(checkIcons.length).toBeGreaterThanOrEqual(3);
    });

    it("renders badge when provided", () => {
      render(<PricingCard {...defaultProps} />);

      expect(screen.getByText("Popular")).toBeInTheDocument();
    });

    it("does not render badge when not provided", () => {
      render(<PricingCard {...defaultProps} plan={enterprisePlan} />);

      expect(screen.queryByText("Popular")).not.toBeInTheDocument();
    });

    it("applies highlighted styling when highlighted", () => {
      const { container } = render(<PricingCard {...defaultProps} />);

      const card = container.querySelector('[class*="border-primary"]');
      expect(card).toBeInTheDocument();
    });

    it("does not apply highlighted styling when not highlighted", () => {
      const { container } = render(
        <PricingCard {...defaultProps} plan={enterprisePlan} />
      );

      const card = container.querySelector('[class*="border-primary"]');
      expect(card).not.toBeInTheDocument();
    });
  });

  describe("free plan", () => {
    it("renders $0 price", () => {
      render(<PricingCard {...defaultProps} plan={freePlan} />);

      expect(screen.getByText("$0")).toBeInTheDocument();
    });

    it("does not show interval suffix for free plan", () => {
      render(<PricingCard {...defaultProps} plan={freePlan} />);

      expect(screen.queryByText("/mo")).not.toBeInTheDocument();
      expect(screen.queryByText("/yr")).not.toBeInTheDocument();
    });

    it("shows Get Started button", () => {
      render(<PricingCard {...defaultProps} plan={freePlan} />);

      expect(
        screen.getByRole("button", { name: "Get Started" })
      ).toBeInTheDocument();
    });
  });

  describe("button states", () => {
    it("shows Subscribe button for authenticated user without subscription", () => {
      render(<PricingCard {...defaultProps} />);

      expect(
        screen.getByRole("button", { name: "Subscribe" })
      ).toBeInTheDocument();
    });

    it("shows Sign up button for unauthenticated user", () => {
      render(<PricingCard {...defaultProps} isAuthenticated={false} />);

      expect(
        screen.getByRole("button", { name: "Sign up" })
      ).toBeInTheDocument();
    });

    it("shows Current Plan button when plan matches", () => {
      render(<PricingCard {...defaultProps} currentPlan="PLUS" />);

      expect(
        screen.getByRole("button", { name: "Current Plan" })
      ).toBeInTheDocument();
    });

    it("shows Upgrade button when current plan is FREE", () => {
      render(<PricingCard {...defaultProps} currentPlan="FREE" />);

      expect(
        screen.getByRole("button", { name: "Upgrade" })
      ).toBeInTheDocument();
    });

    it("shows Downgrade button when downgrading from PRO to PLUS", () => {
      render(<PricingCard {...defaultProps} currentPlan="PRO" />);

      expect(
        screen.getByRole("button", { name: "Downgrade" })
      ).toBeInTheDocument();
    });

    it("disables button when current plan", () => {
      render(<PricingCard {...defaultProps} currentPlan="PLUS" />);

      expect(screen.getByRole("button", { name: "Current Plan" })).toBeDisabled();
    });

    it("uses default variant for highlighted plan", () => {
      render(<PricingCard {...defaultProps} />);

      const button = screen.getByRole("button", { name: "Subscribe" });
      // Highlighted plan uses default (primary) variant, not outline
      expect(button).toHaveClass("bg-primary");
    });

    it("uses outline variant for non-highlighted plan", () => {
      render(<PricingCard {...defaultProps} plan={enterprisePlan} />);

      const button = screen.getByRole("button", { name: "Subscribe" });
      expect(button.className).toContain("border");
    });
  });

  describe("click handling", () => {
    it("redirects to login when unauthenticated user clicks", async () => {
      render(<PricingCard {...defaultProps} isAuthenticated={false} />);

      const button = screen.getByRole("button", { name: "Sign up" });
      fireEvent.click(button);

      expect(mockPush).toHaveBeenCalledWith("/login?callbackUrl=/pricing");
    });

    it("does nothing when clicking on free plan", async () => {
      const onSubscribe = vi.fn();
      render(
        <PricingCard {...defaultProps} plan={freePlan} onSubscribe={onSubscribe} />
      );

      const button = screen.getByRole("button", { name: "Get Started" });
      fireEvent.click(button);

      expect(onSubscribe).not.toHaveBeenCalled();
    });

    it("does nothing when clicking on current plan", async () => {
      const onSubscribe = vi.fn();
      render(
        <PricingCard
          {...defaultProps}
          currentPlan="PLUS"
          onSubscribe={onSubscribe}
        />
      );

      const button = screen.getByRole("button", { name: "Current Plan" });
      fireEvent.click(button);

      expect(onSubscribe).not.toHaveBeenCalled();
    });

    it("calls onSubscribe with price ID when subscribing", async () => {
      const onSubscribe = vi.fn().mockResolvedValue(undefined);

      render(<PricingCard {...defaultProps} onSubscribe={onSubscribe} />);

      const button = screen.getByRole("button", { name: "Subscribe" });
      fireEvent.click(button);

      await waitFor(() => {
        expect(onSubscribe).toHaveBeenCalledWith("price_pro_monthly");
      });
    });

    it("uses yearly price ID when interval is yearly", async () => {
      const onSubscribe = vi.fn().mockResolvedValue(undefined);

      render(
        <PricingCard {...defaultProps} interval="yearly" onSubscribe={onSubscribe} />
      );

      const button = screen.getByRole("button", { name: "Subscribe" });
      fireEvent.click(button);

      await waitFor(() => {
        expect(onSubscribe).toHaveBeenCalledWith("price_pro_yearly");
      });
    });
  });

  describe("loading state", () => {
    it("shows loading text while subscribing", async () => {
      let resolvePromise: () => void;
      const pendingPromise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });
      const onSubscribe = vi.fn().mockReturnValue(pendingPromise);

      render(<PricingCard {...defaultProps} onSubscribe={onSubscribe} />);

      const button = screen.getByRole("button", { name: "Subscribe" });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText("Loading...")).toBeInTheDocument();
      });

      resolvePromise!();
    });

    it("disables button while loading", async () => {
      let resolvePromise: () => void;
      const pendingPromise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });
      const onSubscribe = vi.fn().mockReturnValue(pendingPromise);

      render(<PricingCard {...defaultProps} onSubscribe={onSubscribe} />);

      const button = screen.getByRole("button", { name: "Subscribe" });
      fireEvent.click(button);

      await waitFor(() => {
        expect(button).toBeDisabled();
      });

      resolvePromise!();
    });

    it("re-enables button after loading completes", async () => {
      const onSubscribe = vi.fn().mockResolvedValue(undefined);

      render(<PricingCard {...defaultProps} onSubscribe={onSubscribe} />);

      const button = screen.getByRole("button", { name: "Subscribe" });
      fireEvent.click(button);

      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe("error handling", () => {
    it("calls onError when price ID is missing", async () => {
      const onError = vi.fn();
      const planNoPriceId: PlanConfig = {
        ...proPlan,
        prices: { monthly: "", yearly: "" },
      };

      render(
        <PricingCard {...defaultProps} plan={planNoPriceId} onError={onError} />
      );

      const button = screen.getByRole("button", { name: "Subscribe" });
      fireEvent.click(button);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          "Stripe is not configured. Please set up your Stripe Price IDs."
        );
      });
    });

    it("calls onError when subscription fails with Error", async () => {
      const onSubscribe = vi.fn().mockRejectedValue(new Error("Payment failed"));
      const onError = vi.fn();

      render(
        <PricingCard
          {...defaultProps}
          onSubscribe={onSubscribe}
          onError={onError}
        />
      );

      const button = screen.getByRole("button", { name: "Subscribe" });
      fireEvent.click(button);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith("Payment failed");
      });
    });

    it("calls onError with generic message for non-Error exceptions", async () => {
      const onSubscribe = vi.fn().mockRejectedValue("String error");
      const onError = vi.fn();

      render(
        <PricingCard
          {...defaultProps}
          onSubscribe={onSubscribe}
          onError={onError}
        />
      );

      const button = screen.getByRole("button", { name: "Subscribe" });
      fireEvent.click(button);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith("An error occurred");
      });
    });

    it("resets loading state after error", async () => {
      const onSubscribe = vi.fn().mockRejectedValue(new Error("Error"));
      const onError = vi.fn();

      render(
        <PricingCard
          {...defaultProps}
          onSubscribe={onSubscribe}
          onError={onError}
        />
      );

      const button = screen.getByRole("button", { name: "Subscribe" });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText("Subscribe")).toBeInTheDocument();
        expect(button).not.toBeDisabled();
      });
    });
  });
});
