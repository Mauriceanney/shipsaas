/**
 * TDD: Subscription Status Component Tests
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SubscriptionStatus } from "@/components/billing/subscription-status";

import type { SubscriptionInfo } from "@/lib/stripe/types";

describe("SubscriptionStatus", () => {
  const baseSubscription: SubscriptionInfo = {
    status: "ACTIVE",
    plan: "PLUS",
    currentPeriodEnd: new Date("2024-12-31"),
    trialEnd: null,
    cancelAtPeriodEnd: false,
    stripeCustomerId: "cus_123",
    stripeSubscriptionId: "sub_123",
  };

  describe("when subscription is null", () => {
    it("renders no subscription message", () => {
      render(<SubscriptionStatus subscription={null} />);

      expect(screen.getByText("No subscription found")).toBeInTheDocument();
    });

    it("does not render plan information", () => {
      render(<SubscriptionStatus subscription={null} />);

      expect(screen.queryByText(/Plan/)).not.toBeInTheDocument();
    });
  });

  describe("with active subscription", () => {
    it("renders the plan name", () => {
      render(<SubscriptionStatus subscription={baseSubscription} />);

      expect(screen.getByText("PRO Plan")).toBeInTheDocument();
    });

    it("renders the status badge", () => {
      render(<SubscriptionStatus subscription={baseSubscription} />);

      expect(screen.getByText("ACTIVE")).toBeInTheDocument();
    });

    it("renders next billing date", () => {
      render(<SubscriptionStatus subscription={baseSubscription} />);

      expect(screen.getByText(/Next billing date:/)).toBeInTheDocument();
      expect(screen.getByText("December 31, 2024")).toBeInTheDocument();
    });

    it("does not render cancellation message when not cancelled", () => {
      render(<SubscriptionStatus subscription={baseSubscription} />);

      expect(
        screen.queryByText(/Your subscription will end on/)
      ).not.toBeInTheDocument();
    });
  });

  describe("with cancelled subscription", () => {
    it("renders cancellation end date", () => {
      const cancelledSubscription: SubscriptionInfo = {
        ...baseSubscription,
        cancelAtPeriodEnd: true,
      };

      render(<SubscriptionStatus subscription={cancelledSubscription} />);

      expect(
        screen.getByText(/Your subscription will end on/)
      ).toBeInTheDocument();
      expect(screen.getByText("December 31, 2024")).toBeInTheDocument();
    });

    it("does not show next billing date when cancelled", () => {
      const cancelledSubscription: SubscriptionInfo = {
        ...baseSubscription,
        cancelAtPeriodEnd: true,
      };

      render(<SubscriptionStatus subscription={cancelledSubscription} />);

      expect(screen.queryByText(/Next billing date:/)).not.toBeInTheDocument();
    });
  });

  describe("status badge colors", () => {
    it("renders green badge for ACTIVE status", () => {
      render(<SubscriptionStatus subscription={baseSubscription} />);

      const badge = screen.getByText("ACTIVE");
      expect(badge).toHaveClass("bg-green-100", "text-green-700");
    });

    it("renders blue badge for TRIALING status", () => {
      const trialingSubscription: SubscriptionInfo = {
        ...baseSubscription,
        status: "TRIALING",
      };

      render(<SubscriptionStatus subscription={trialingSubscription} />);

      const badge = screen.getByText("TRIALING");
      expect(badge).toHaveClass("bg-blue-100", "text-blue-700");
    });

    it("renders yellow badge for PAST_DUE status", () => {
      const pastDueSubscription: SubscriptionInfo = {
        ...baseSubscription,
        status: "PAST_DUE",
      };

      render(<SubscriptionStatus subscription={pastDueSubscription} />);

      const badge = screen.getByText("PAST_DUE");
      expect(badge).toHaveClass("bg-yellow-100", "text-yellow-700");
    });

    it("renders red badge for CANCELED status", () => {
      const canceledSubscription: SubscriptionInfo = {
        ...baseSubscription,
        status: "CANCELED",
      };

      render(<SubscriptionStatus subscription={canceledSubscription} />);

      const badge = screen.getByText("CANCELED");
      expect(badge).toHaveClass("bg-red-100", "text-red-700");
    });

    it("renders gray badge for INACTIVE status", () => {
      const inactiveSubscription: SubscriptionInfo = {
        ...baseSubscription,
        status: "INACTIVE",
      };

      render(<SubscriptionStatus subscription={inactiveSubscription} />);

      const badge = screen.getByText("INACTIVE");
      expect(badge).toHaveClass("bg-gray-100", "text-gray-700");
    });
  });

  describe("with no current period end", () => {
    it("does not render billing date section", () => {
      const subscriptionNoPeriodEnd: SubscriptionInfo = {
        ...baseSubscription,
        currentPeriodEnd: null,
      };

      render(<SubscriptionStatus subscription={subscriptionNoPeriodEnd} />);

      expect(screen.queryByText(/Next billing date:/)).not.toBeInTheDocument();
      expect(
        screen.queryByText(/Your subscription will end on/)
      ).not.toBeInTheDocument();
    });
  });

  describe("different plan types", () => {
    it("renders FREE plan correctly", () => {
      const freePlan: SubscriptionInfo = {
        ...baseSubscription,
        plan: "FREE",
      };

      render(<SubscriptionStatus subscription={freePlan} />);

      expect(screen.getByText("FREE Plan")).toBeInTheDocument();
    });

    it("renders PRO plan correctly", () => {
      const enterprisePlan: SubscriptionInfo = {
        ...baseSubscription,
        plan: "PLUS",
      };

      render(<SubscriptionStatus subscription={enterprisePlan} />);

      expect(screen.getByText("ENTERPRISE Plan")).toBeInTheDocument();
    });
  });
});
