/**
 * TDD: Pricing Table Component Tests
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { PricingTable } from "@/components/pricing/pricing-table";

import type { PlanConfig } from "@/lib/stripe/types";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock Stripe config
vi.mock("@/lib/stripe/config", () => ({
  calculateYearlySavings: vi.fn().mockReturnValue(17),
  PLAN_PRICING: {
    PRO: { monthly: 19, yearly: 190 },
    ENTERPRISE: { monthly: 99, yearly: 990 },
  },
}));

describe("PricingTable", () => {
  const mockFetch = vi.fn();
  const originalLocation = window.location;

  const planConfigs: PlanConfig[] = [
    {
      id: "FREE",
      name: "Free",
      description: "For individuals getting started",
      prices: { monthly: "", yearly: "" },
      features: ["Basic feature"],
    },
    {
      id: "PRO",
      name: "Pro",
      description: "For professionals",
      prices: { monthly: "price_pro_monthly", yearly: "price_pro_yearly" },
      features: ["Pro feature 1", "Pro feature 2"],
      highlighted: true,
      badge: "Popular",
    },
    {
      id: "ENTERPRISE",
      name: "Enterprise",
      description: "For organizations",
      prices: {
        monthly: "price_ent_monthly",
        yearly: "price_ent_yearly",
      },
      features: ["Enterprise feature"],
    },
  ];

  const defaultProps = {
    planConfigs,
    currentPlan: undefined,
    isAuthenticated: true,
  };

  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    Object.defineProperty(window, "location", {
      value: { href: "" },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
  });

  describe("rendering", () => {
    it("renders pricing toggle", () => {
      render(<PricingTable {...defaultProps} />);

      expect(screen.getByText("Monthly")).toBeInTheDocument();
      expect(screen.getByText("Yearly")).toBeInTheDocument();
    });

    it("renders all plan cards", () => {
      render(<PricingTable {...defaultProps} />);

      expect(screen.getByText("Free")).toBeInTheDocument();
      expect(screen.getByText("Pro")).toBeInTheDocument();
      expect(screen.getByText("Enterprise")).toBeInTheDocument();
    });

    it("renders plan descriptions", () => {
      render(<PricingTable {...defaultProps} />);

      expect(
        screen.getByText("For individuals getting started")
      ).toBeInTheDocument();
      expect(screen.getByText("For professionals")).toBeInTheDocument();
      expect(screen.getByText("For organizations")).toBeInTheDocument();
    });

    it("renders savings percentage in toggle", () => {
      render(<PricingTable {...defaultProps} />);

      expect(screen.getByText("Save 17%")).toBeInTheDocument();
    });

    it("does not show error initially", () => {
      render(<PricingTable {...defaultProps} />);

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("interval toggle", () => {
    it("defaults to monthly interval", () => {
      render(<PricingTable {...defaultProps} />);

      // Monthly should be highlighted
      const monthlyButton = screen.getByText("Monthly");
      expect(monthlyButton).toHaveClass("text-foreground");
    });

    it("toggles to yearly when yearly button clicked", async () => {
      render(<PricingTable {...defaultProps} />);

      const yearlyButton = screen.getByRole("button", { name: /yearly save/i });
      fireEvent.click(yearlyButton);

      await waitFor(() => {
        const monthlyButton = screen.getByText("Monthly");
        expect(monthlyButton).toHaveClass("text-muted-foreground");
      });
    });

    it("updates prices when interval changes", async () => {
      render(<PricingTable {...defaultProps} />);

      // Initially showing monthly
      expect(screen.getByText("$19")).toBeInTheDocument();

      // Toggle to yearly
      const yearlyButton = screen.getByRole("button", { name: /yearly save/i });
      fireEvent.click(yearlyButton);

      await waitFor(() => {
        expect(screen.getByText("$190")).toBeInTheDocument();
      });
    });
  });

  describe("subscription flow", () => {
    it("calls checkout API when subscribing", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ url: "https://checkout.stripe.com/session" }),
      });

      render(<PricingTable {...defaultProps} />);

      // Find and click the Pro plan subscribe button
      const subscribeButtons = screen.getAllByRole("button", {
        name: /subscribe/i,
      });
      fireEvent.click(subscribeButtons[0]!);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ priceId: "price_pro_monthly" }),
        });
      });
    });

    it("redirects to Stripe checkout on success", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ url: "https://checkout.stripe.com/session" }),
      });

      render(<PricingTable {...defaultProps} />);

      const subscribeButtons = screen.getAllByRole("button", {
        name: /subscribe/i,
      });
      fireEvent.click(subscribeButtons[0]!);

      await waitFor(() => {
        expect(window.location.href).toBe(
          "https://checkout.stripe.com/session"
        );
      });
    });

    it("uses correct price ID for yearly interval", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ url: "https://checkout.stripe.com" }),
      });

      render(<PricingTable {...defaultProps} />);

      // Toggle to yearly
      const yearlyButton = screen.getByRole("button", { name: /yearly save/i });
      fireEvent.click(yearlyButton);

      // Subscribe
      await waitFor(async () => {
        const subscribeButtons = screen.getAllByRole("button", {
          name: /subscribe/i,
        });
        fireEvent.click(subscribeButtons[0]!);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/stripe/checkout",
          expect.objectContaining({
            body: JSON.stringify({ priceId: "price_pro_yearly" }),
          })
        );
      });
    });
  });

  describe("error handling", () => {
    it("displays error from API response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: "Payment method required" }),
      });

      render(<PricingTable {...defaultProps} />);

      const subscribeButtons = screen.getAllByRole("button", {
        name: /subscribe/i,
      });
      fireEvent.click(subscribeButtons[0]!);

      await waitFor(() => {
        expect(screen.getByText("Payment method required")).toBeInTheDocument();
      });
    });

    it("displays default error when no error message in response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      });

      render(<PricingTable {...defaultProps} />);

      const subscribeButtons = screen.getAllByRole("button", {
        name: /subscribe/i,
      });
      fireEvent.click(subscribeButtons[0]!);

      await waitFor(() => {
        expect(
          screen.getByText("Failed to create checkout session")
        ).toBeInTheDocument();
      });
    });

    it("displays error on network failure", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      render(<PricingTable {...defaultProps} />);

      const subscribeButtons = screen.getAllByRole("button", {
        name: /subscribe/i,
      });
      fireEvent.click(subscribeButtons[0]!);

      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeInTheDocument();
      });
    });

    it("displays generic error for non-Error exceptions", async () => {
      mockFetch.mockRejectedValueOnce("String error");

      render(<PricingTable {...defaultProps} />);

      const subscribeButtons = screen.getAllByRole("button", {
        name: /subscribe/i,
      });
      fireEvent.click(subscribeButtons[0]!);

      await waitFor(() => {
        expect(screen.getByText("An error occurred")).toBeInTheDocument();
      });
    });

    it("clears error when starting new subscription", async () => {
      // First call fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: "First error" }),
      });

      render(<PricingTable {...defaultProps} />);

      const subscribeButtons = screen.getAllByRole("button", {
        name: /subscribe/i,
      });
      fireEvent.click(subscribeButtons[0]!);

      await waitFor(() => {
        expect(screen.getByText("First error")).toBeInTheDocument();
      });

      // Second call - should clear error first
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ url: "https://stripe.com" }),
      });

      fireEvent.click(subscribeButtons[0]!);

      // Error should be cleared while loading
      await waitFor(() => {
        expect(screen.queryByText("First error")).not.toBeInTheDocument();
      });
    });

    it("displays error from onError callback", async () => {
      // Test with a plan that has no price ID configured
      const planWithoutPriceId: PlanConfig[] = [
        {
          id: "PRO",
          name: "Pro",
          description: "Test",
          prices: { monthly: "", yearly: "" },
          features: ["Feature"],
        },
      ];

      render(
        <PricingTable
          planConfigs={planWithoutPriceId}
          isAuthenticated={true}
          currentPlan={undefined}
        />
      );

      const subscribeButton = screen.getByRole("button", { name: /subscribe/i });
      fireEvent.click(subscribeButton);

      await waitFor(() => {
        expect(
          screen.getByText(
            "Stripe is not configured. Please set up your Stripe Price IDs."
          )
        ).toBeInTheDocument();
      });
    });

    it("applies destructive text styling to error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Test error"));

      render(<PricingTable {...defaultProps} />);

      const subscribeButtons = screen.getAllByRole("button", {
        name: /subscribe/i,
      });
      fireEvent.click(subscribeButtons[0]!);

      await waitFor(() => {
        const errorElement = screen.getByText("Test error");
        expect(errorElement).toHaveClass("text-destructive");
      });
    });
  });

  describe("with current plan", () => {
    it("shows Current Plan for matching plan", () => {
      render(<PricingTable {...defaultProps} currentPlan="PRO" />);

      expect(
        screen.getByRole("button", { name: "Current Plan" })
      ).toBeInTheDocument();
    });

    it("shows Upgrade for higher plans when on FREE", () => {
      render(<PricingTable {...defaultProps} currentPlan="FREE" />);

      const upgradeButtons = screen.getAllByRole("button", { name: "Upgrade" });
      expect(upgradeButtons.length).toBeGreaterThan(0);
    });
  });

  describe("unauthenticated user", () => {
    it("shows Sign up buttons", () => {
      render(<PricingTable {...defaultProps} isAuthenticated={false} />);

      const signUpButtons = screen.getAllByRole("button", { name: "Sign up" });
      expect(signUpButtons.length).toBeGreaterThan(0);
    });
  });

  describe("layout", () => {
    it("has proper grid layout for cards", () => {
      const { container } = render(<PricingTable {...defaultProps} />);

      const grid = container.querySelector(".grid.md\\:grid-cols-3");
      expect(grid).toBeInTheDocument();
    });

    it("has centered spacing", () => {
      const { container } = render(<PricingTable {...defaultProps} />);

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("space-y-8");
    });
  });
});
