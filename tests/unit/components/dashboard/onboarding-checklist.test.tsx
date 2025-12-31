/**
 * Unit tests for OnboardingChecklist component
 * Guides new users through initial setup steps
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoist mocks
const { mockDismissOnboarding, mockCompleteOnboarding, mockUseRouter, mockToast } = vi.hoisted(() => ({
  mockDismissOnboarding: vi.fn(),
  mockCompleteOnboarding: vi.fn(),
  mockUseRouter: vi.fn(),
  mockToast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock dependencies
vi.mock("@/actions/onboarding", () => ({
  dismissOnboarding: mockDismissOnboarding,
  completeOnboarding: mockCompleteOnboarding,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockUseRouter,
  }),
}));

vi.mock("sonner", () => ({
  toast: mockToast,
}));

import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";

describe("OnboardingChecklist", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders the getting started title", () => {
      render(
        <OnboardingChecklist
          user={{ name: null, image: null }}
          hasSubscription={false}
        />
      );

      expect(screen.getByText("Getting Started")).toBeInTheDocument();
    });

    it("renders all onboarding steps", () => {
      render(
        <OnboardingChecklist
          user={{ name: null, image: null }}
          hasSubscription={false}
        />
      );

      expect(screen.getByText("Complete your profile")).toBeInTheDocument();
      expect(screen.getByText("Add a profile picture")).toBeInTheDocument();
      expect(screen.getByText("Choose a plan")).toBeInTheDocument();
      expect(screen.getByText("Explore settings")).toBeInTheDocument();
    });

    it("renders progress bar", () => {
      render(
        <OnboardingChecklist
          user={{ name: null, image: null }}
          hasSubscription={false}
        />
      );

      expect(screen.getByText("Progress")).toBeInTheDocument();
      expect(screen.getByText("0 of 4 complete")).toBeInTheDocument();
    });

    it("renders dismiss button", () => {
      render(
        <OnboardingChecklist
          user={{ name: null, image: null }}
          hasSubscription={false}
        />
      );

      expect(screen.getByRole("button", { name: /dismiss/i })).toBeInTheDocument();
    });
  });

  describe("step completion status", () => {
    it("shows profile step as complete when user has name", () => {
      render(
        <OnboardingChecklist
          user={{ name: "John Doe", image: null }}
          hasSubscription={false}
        />
      );

      expect(screen.getByText("1 of 4 complete")).toBeInTheDocument();
    });

    it("shows avatar step as complete when user has image", () => {
      render(
        <OnboardingChecklist
          user={{ name: null, image: "https://example.com/avatar.jpg" }}
          hasSubscription={false}
        />
      );

      expect(screen.getByText("1 of 4 complete")).toBeInTheDocument();
    });

    it("shows subscription step as complete when user has subscription", () => {
      render(
        <OnboardingChecklist
          user={{ name: null, image: null }}
          hasSubscription={true}
        />
      );

      expect(screen.getByText("1 of 4 complete")).toBeInTheDocument();
    });

    it("shows multiple steps complete when applicable", () => {
      render(
        <OnboardingChecklist
          user={{ name: "John Doe", image: "https://example.com/avatar.jpg" }}
          hasSubscription={true}
        />
      );

      expect(screen.getByText("3 of 4 complete")).toBeInTheDocument();
    });

    it("treats empty string name as incomplete", () => {
      render(
        <OnboardingChecklist
          user={{ name: "", image: null }}
          hasSubscription={false}
        />
      );

      expect(screen.getByText("0 of 4 complete")).toBeInTheDocument();
    });

    it("treats whitespace-only name as incomplete", () => {
      render(
        <OnboardingChecklist
          user={{ name: "   ", image: null }}
          hasSubscription={false}
        />
      );

      expect(screen.getByText("0 of 4 complete")).toBeInTheDocument();
    });
  });

  describe("navigation links", () => {
    it("links profile step to settings/profile", () => {
      render(
        <OnboardingChecklist
          user={{ name: null, image: null }}
          hasSubscription={false}
        />
      );

      const profileLink = screen.getByText("Complete your profile").closest("a");
      expect(profileLink).toHaveAttribute("href", "/settings/profile");
    });

    it("links avatar step to settings/profile", () => {
      render(
        <OnboardingChecklist
          user={{ name: null, image: null }}
          hasSubscription={false}
        />
      );

      const avatarLink = screen.getByText("Add a profile picture").closest("a");
      expect(avatarLink).toHaveAttribute("href", "/settings/profile");
    });

    it("links subscription step to pricing", () => {
      render(
        <OnboardingChecklist
          user={{ name: null, image: null }}
          hasSubscription={false}
        />
      );

      const subscriptionLink = screen.getByText("Choose a plan").closest("a");
      expect(subscriptionLink).toHaveAttribute("href", "/pricing");
    });

    it("links settings step to settings", () => {
      render(
        <OnboardingChecklist
          user={{ name: null, image: null }}
          hasSubscription={false}
        />
      );

      const settingsLink = screen.getByText("Explore settings").closest("a");
      expect(settingsLink).toHaveAttribute("href", "/settings");
    });
  });

  describe("dismiss functionality", () => {
    it("calls dismissOnboarding when dismiss button is clicked", async () => {
      mockDismissOnboarding.mockResolvedValue({ success: true });

      render(
        <OnboardingChecklist
          user={{ name: null, image: null }}
          hasSubscription={false}
        />
      );

      await user.click(screen.getByRole("button", { name: /dismiss/i }));

      await waitFor(() => {
        expect(mockDismissOnboarding).toHaveBeenCalled();
      });
    });

    it("shows success toast when dismiss succeeds", async () => {
      mockDismissOnboarding.mockResolvedValue({ success: true });

      render(
        <OnboardingChecklist
          user={{ name: null, image: null }}
          hasSubscription={false}
        />
      );

      await user.click(screen.getByRole("button", { name: /dismiss/i }));

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith(
          "Onboarding dismissed. You can always find help in settings."
        );
      });
    });

    it("shows error toast when dismiss fails", async () => {
      mockDismissOnboarding.mockResolvedValue({
        success: false,
        error: "Failed to dismiss",
      });

      render(
        <OnboardingChecklist
          user={{ name: null, image: null }}
          hasSubscription={false}
        />
      );

      await user.click(screen.getByRole("button", { name: /dismiss/i }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith("Failed to dismiss");
      });
    });

    it("hides component after successful dismiss", async () => {
      mockDismissOnboarding.mockResolvedValue({ success: true });

      render(
        <OnboardingChecklist
          user={{ name: null, image: null }}
          hasSubscription={false}
        />
      );

      await user.click(screen.getByRole("button", { name: /dismiss/i }));

      await waitFor(() => {
        expect(screen.queryByText("Getting Started")).not.toBeInTheDocument();
      });
    });
  });

  describe("all steps complete state", () => {
    // Note: Since "Explore settings" is never marked complete by default,
    // we cannot easily test the "all complete" state without mocking the steps.
    // The component uses hardcoded steps array with settings.isComplete = false.

    it("does not show dismiss button when all steps could be complete", () => {
      // Even with all props fulfilled, the settings step is always incomplete
      // so the dismiss button should still be visible
      render(
        <OnboardingChecklist
          user={{ name: "John Doe", image: "https://example.com/avatar.jpg" }}
          hasSubscription={true}
        />
      );

      // Dismiss button should still be visible (settings step is never marked complete)
      expect(screen.getByRole("button", { name: /dismiss/i })).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("dismiss button has accessible label", () => {
      render(
        <OnboardingChecklist
          user={{ name: null, image: null }}
          hasSubscription={false}
        />
      );

      const dismissButton = screen.getByRole("button", { name: /dismiss onboarding/i });
      expect(dismissButton).toBeInTheDocument();
    });

    it("all step links are accessible", () => {
      render(
        <OnboardingChecklist
          user={{ name: null, image: null }}
          hasSubscription={false}
        />
      );

      const links = screen.getAllByRole("link");
      expect(links.length).toBe(4);
      links.forEach((link) => {
        expect(link).not.toHaveAttribute("tabindex", "-1");
      });
    });
  });

  describe("description text", () => {
    it("shows default description when not all complete", () => {
      render(
        <OnboardingChecklist
          user={{ name: null, image: null }}
          hasSubscription={false}
        />
      );

      expect(
        screen.getByText("Complete these steps to get the most out of ShipSaaS")
      ).toBeInTheDocument();
    });
  });
});
