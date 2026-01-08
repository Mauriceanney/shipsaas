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
    it("renders free plan message", () => {
      render(<SubscriptionStatus subscription={null} />);

      expect(screen.getByText("Free Plan")).toBeInTheDocument();
    });

    it("renders free plan features", () => {
      render(<SubscriptionStatus subscription={null} />);

      expect(screen.getByText("Basic features to get started")).toBeInTheDocument();
    });
  });

  describe("with active subscription", () => {
    it("renders the plan name", () => {
      render(<SubscriptionStatus subscription={baseSubscription} />);

      // PLUS plan renders as "Plus Plan"
      expect(screen.getByText("Plus Plan")).toBeInTheDocument();
    });

    it("renders the status badge", () => {
      render(<SubscriptionStatus subscription={baseSubscription} />);

      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("renders next billing date", () => {
      render(<SubscriptionStatus subscription={baseSubscription} />);

      expect(screen.getByText("Next billing date")).toBeInTheDocument();
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
    it("renders success badge for ACTIVE status", () => {
      render(<SubscriptionStatus subscription={baseSubscription} />);

      const badge = screen.getByText("Active");
      expect(badge).toBeInTheDocument();
    });

    it("renders info badge for TRIALING status", () => {
      const trialingSubscription: SubscriptionInfo = {
        ...baseSubscription,
        status: "TRIALING",
      };

      render(<SubscriptionStatus subscription={trialingSubscription} />);

      const badge = screen.getByText("Trial");
      expect(badge).toBeInTheDocument();
    });

    it("renders warning badge for PAST_DUE status", () => {
      const pastDueSubscription: SubscriptionInfo = {
        ...baseSubscription,
        status: "PAST_DUE",
      };

      render(<SubscriptionStatus subscription={pastDueSubscription} />);

      const badge = screen.getByText("Past Due");
      expect(badge).toBeInTheDocument();
    });

    it("renders error badge for CANCELED status", () => {
      const canceledSubscription: SubscriptionInfo = {
        ...baseSubscription,
        status: "CANCELED",
      };

      render(<SubscriptionStatus subscription={canceledSubscription} />);

      const badge = screen.getByText("Canceled");
      expect(badge).toBeInTheDocument();
    });

    it("renders secondary badge for INACTIVE status", () => {
      const inactiveSubscription: SubscriptionInfo = {
        ...baseSubscription,
        status: "INACTIVE",
      };

      render(<SubscriptionStatus subscription={inactiveSubscription} />);

      const badge = screen.getByText("Inactive");
      expect(badge).toBeInTheDocument();
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

      // FREE plan shows the Free Plan UI
      expect(screen.getByText("Free Plan")).toBeInTheDocument();
    });

    it("renders PRO plan correctly", () => {
      const proPlan: SubscriptionInfo = {
        ...baseSubscription,
        plan: "PRO",
      };

      render(<SubscriptionStatus subscription={proPlan} />);

      expect(screen.getByText("Pro Plan")).toBeInTheDocument();
    });
  });
});
