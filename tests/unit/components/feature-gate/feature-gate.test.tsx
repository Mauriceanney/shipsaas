import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next-auth/react
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
}));

import { FeatureGate } from "@/components/feature-gate/feature-gate";
import { useSession } from "next-auth/react";

describe("FeatureGate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when user has required plan access", () => {
    it("renders children when PRO user views PRO gate", () => {
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            id: "user-1",
            email: "pro@example.com",
            role: "USER",
          },
          subscription: {
            plan: "PRO",
            status: "ACTIVE",
            stripeCurrentPeriodEnd: null,
            statusChangedAt: null,
          },
          expires: new Date(Date.now() + 86400000).toISOString(),
        },
        status: "authenticated",
        update: vi.fn(),
      });

      render(
        <FeatureGate plan="PRO">
          <div data-testid="protected-content">Protected Feature</div>
        </FeatureGate>
      );

      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
      expect(screen.getByText("Protected Feature")).toBeInTheDocument();
    });

    it("renders children when ENTERPRISE user views PRO gate", () => {
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            id: "user-1",
            email: "enterprise@example.com",
            role: "USER",
          },
          subscription: {
            plan: "ENTERPRISE",
            status: "ACTIVE",
            stripeCurrentPeriodEnd: null,
            statusChangedAt: null,
          },
          expires: new Date(Date.now() + 86400000).toISOString(),
        },
        status: "authenticated",
        update: vi.fn(),
      });

      render(
        <FeatureGate plan="PRO">
          <div data-testid="protected-content">Protected Feature</div>
        </FeatureGate>
      );

      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });

    it("renders children when ENTERPRISE user views ENTERPRISE gate", () => {
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            id: "user-1",
            email: "enterprise@example.com",
            role: "USER",
          },
          subscription: {
            plan: "ENTERPRISE",
            status: "ACTIVE",
            stripeCurrentPeriodEnd: null,
            statusChangedAt: null,
          },
          expires: new Date(Date.now() + 86400000).toISOString(),
        },
        status: "authenticated",
        update: vi.fn(),
      });

      render(
        <FeatureGate plan="ENTERPRISE">
          <div data-testid="protected-content">Enterprise Feature</div>
        </FeatureGate>
      );

      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });

    it("renders children when user is on trial period", () => {
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            id: "user-1",
            email: "trial@example.com",
            role: "USER",
          },
          subscription: {
            plan: "PRO",
            status: "TRIALING",
            stripeCurrentPeriodEnd: null,
            statusChangedAt: null,
          },
          expires: new Date(Date.now() + 86400000).toISOString(),
        },
        status: "authenticated",
        update: vi.fn(),
      });

      render(
        <FeatureGate plan="PRO">
          <div data-testid="protected-content">Protected Feature</div>
        </FeatureGate>
      );

      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });
  });

  describe("when user does not have required plan access", () => {
    it("shows UpgradeCard when FREE user views PRO gate", () => {
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            id: "user-1",
            email: "free@example.com",
            role: "USER",
          },
          subscription: {
            plan: "FREE",
            status: "ACTIVE",
            stripeCurrentPeriodEnd: null,
            statusChangedAt: null,
          },
          expires: new Date(Date.now() + 86400000).toISOString(),
        },
        status: "authenticated",
        update: vi.fn(),
      });

      render(
        <FeatureGate plan="PRO">
          <div data-testid="protected-content">Protected Feature</div>
        </FeatureGate>
      );

      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: /upgrade to pro/i })).toBeInTheDocument();
    });

    it("shows UpgradeCard when FREE user views ENTERPRISE gate", () => {
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            id: "user-1",
            email: "free@example.com",
            role: "USER",
          },
          subscription: {
            plan: "FREE",
            status: "ACTIVE",
            stripeCurrentPeriodEnd: null,
            statusChangedAt: null,
          },
          expires: new Date(Date.now() + 86400000).toISOString(),
        },
        status: "authenticated",
        update: vi.fn(),
      });

      render(
        <FeatureGate plan="ENTERPRISE">
          <div data-testid="protected-content">Protected Feature</div>
        </FeatureGate>
      );

      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: /upgrade to enterprise/i })).toBeInTheDocument();
    });

    it("shows UpgradeCard when PRO user views ENTERPRISE gate", () => {
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            id: "user-1",
            email: "pro@example.com",
            role: "USER",
          },
          subscription: {
            plan: "PRO",
            status: "ACTIVE",
            stripeCurrentPeriodEnd: null,
            statusChangedAt: null,
          },
          expires: new Date(Date.now() + 86400000).toISOString(),
        },
        status: "authenticated",
        update: vi.fn(),
      });

      render(
        <FeatureGate plan="ENTERPRISE">
          <div data-testid="protected-content">Protected Feature</div>
        </FeatureGate>
      );

      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: /upgrade to enterprise/i })).toBeInTheDocument();
    });

    it("shows UpgradeCard when subscription is INACTIVE", () => {
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            id: "user-1",
            email: "inactive@example.com",
            role: "USER",
          },
          subscription: {
            plan: "PRO",
            status: "INACTIVE",
            stripeCurrentPeriodEnd: null,
            statusChangedAt: null,
          },
          expires: new Date(Date.now() + 86400000).toISOString(),
        },
        status: "authenticated",
        update: vi.fn(),
      });

      render(
        <FeatureGate plan="PRO">
          <div data-testid="protected-content">Protected Feature</div>
        </FeatureGate>
      );

      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: /upgrade to pro/i })).toBeInTheDocument();
    });

    it("shows UpgradeCard when subscription is CANCELED", () => {
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            id: "user-1",
            email: "canceled@example.com",
            role: "USER",
          },
          subscription: {
            plan: "PRO",
            status: "CANCELED",
            stripeCurrentPeriodEnd: null,
            statusChangedAt: null,
          },
          expires: new Date(Date.now() + 86400000).toISOString(),
        },
        status: "authenticated",
        update: vi.fn(),
      });

      render(
        <FeatureGate plan="PRO">
          <div data-testid="protected-content">Protected Feature</div>
        </FeatureGate>
      );

      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: /upgrade to pro/i })).toBeInTheDocument();
    });
  });

  describe("custom fallback", () => {
    it("renders custom fallback when provided and user lacks access", () => {
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            id: "user-1",
            email: "free@example.com",
            role: "USER",
          },
          subscription: {
            plan: "FREE",
            status: "ACTIVE",
            stripeCurrentPeriodEnd: null,
            statusChangedAt: null,
          },
          expires: new Date(Date.now() + 86400000).toISOString(),
        },
        status: "authenticated",
        update: vi.fn(),
      });

      render(
        <FeatureGate
          plan="PRO"
          fallback={<div data-testid="custom-fallback">Custom upgrade message</div>}
        >
          <div data-testid="protected-content">Protected Feature</div>
        </FeatureGate>
      );

      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
      expect(screen.getByTestId("custom-fallback")).toBeInTheDocument();
      expect(screen.getByText("Custom upgrade message")).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: /upgrade to pro/i })).not.toBeInTheDocument();
    });
  });

  describe("loading and unauthenticated states", () => {
    it("shows UpgradeCard when session is loading", () => {
      vi.mocked(useSession).mockReturnValue({
        data: null,
        status: "loading",
        update: vi.fn(),
      });

      render(
        <FeatureGate plan="PRO">
          <div data-testid="protected-content">Protected Feature</div>
        </FeatureGate>
      );

      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: /upgrade to pro/i })).toBeInTheDocument();
    });

    it("shows UpgradeCard when user is not authenticated", () => {
      vi.mocked(useSession).mockReturnValue({
        data: null,
        status: "unauthenticated",
        update: vi.fn(),
      });

      render(
        <FeatureGate plan="PRO">
          <div data-testid="protected-content">Protected Feature</div>
        </FeatureGate>
      );

      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: /upgrade to pro/i })).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("handles PAST_DUE status as no access (grace period handled server-side)", () => {
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            id: "user-1",
            email: "pastdue@example.com",
            role: "USER",
          },
          subscription: {
            plan: "PRO",
            status: "PAST_DUE",
            stripeCurrentPeriodEnd: null,
            statusChangedAt: null,
          },
          expires: new Date(Date.now() + 86400000).toISOString(),
        },
        status: "authenticated",
        update: vi.fn(),
      });

      render(
        <FeatureGate plan="PRO">
          <div data-testid="protected-content">Protected Feature</div>
        </FeatureGate>
      );

      // PAST_DUE should not grant access client-side
      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: /upgrade to pro/i })).toBeInTheDocument();
    });
  });
});
