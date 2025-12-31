import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock analytics
vi.mock("@/lib/analytics/client", () => ({
  trackEvent: vi.fn(),
}));

import { UsageLimitModal } from "@/components/billing/usage-limit-modal";
import { trackEvent } from "@/lib/analytics/client";
import { UPGRADE_PROMPT_EVENTS } from "@/lib/analytics/events";

describe("UsageLimitModal", () => {
  const defaultProps = {
    metric: "apiCalls" as const,
    currentUsage: 900,
    limit: 1000,
    plan: "FREE" as const,
    isOpen: true,
    onOpenChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders approaching limit message when under 100%", () => {
      render(<UsageLimitModal {...defaultProps} />);

      expect(screen.getByText("Approaching API Calls Limit")).toBeInTheDocument();
      expect(
        screen.getByText(/You're using 90% of your monthly API requests limit/)
      ).toBeInTheDocument();
    });

    it("renders limit reached message at 100%", () => {
      render(
        <UsageLimitModal {...defaultProps} currentUsage={1000} limit={1000} />
      );

      expect(screen.getByText("API Calls Limit Reached")).toBeInTheDocument();
      expect(
        screen.getByText(/You've used all your monthly API requests/)
      ).toBeInTheDocument();
    });

    it("displays correct usage values", () => {
      render(<UsageLimitModal {...defaultProps} />);

      expect(screen.getByText("900 / 1,000")).toBeInTheDocument();
    });

    it("shows upgrade to Plus for FREE users", () => {
      render(<UsageLimitModal {...defaultProps} plan="FREE" />);

      const upgradeLink = screen.getByRole("link", { name: /Upgrade to Plus/i });
      expect(upgradeLink).toBeInTheDocument();
      expect(upgradeLink).toHaveAttribute(
        "href",
        "/pricing?source=usage_limit_modal&metric=apiCalls&plan=PLUS"
      );
    });

    it("shows upgrade to Pro for PLUS users", () => {
      render(<UsageLimitModal {...defaultProps} plan="PLUS" />);

      const upgradeLink = screen.getByRole("link", { name: /Upgrade to Pro/i });
      expect(upgradeLink).toBeInTheDocument();
      expect(upgradeLink).toHaveAttribute(
        "href",
        "/pricing?source=usage_limit_modal&metric=apiCalls&plan=PRO"
      );
    });

    it("formats storage values correctly", () => {
      render(
        <UsageLimitModal
          {...defaultProps}
          metric="storage"
          currentUsage={500 * 1024 * 1024} // 500 MB
          limit={1024 * 1024 * 1024} // 1 GB
        />
      );

      expect(screen.getByText("500.0 MB / 1.0 GB")).toBeInTheDocument();
    });
  });

  describe("analytics tracking", () => {
    it("tracks impression when modal opens for approaching limit", () => {
      render(<UsageLimitModal {...defaultProps} />);

      expect(trackEvent).toHaveBeenCalledWith(
        UPGRADE_PROMPT_EVENTS.UPGRADE_PROMPT_SHOWN,
        expect.objectContaining({
          metric: "apiCalls",
          usagePercentage: 90,
          plan: "FREE",
        })
      );
    });

    it("tracks blocked event when at 100% limit", () => {
      render(
        <UsageLimitModal {...defaultProps} currentUsage={1000} limit={1000} />
      );

      expect(trackEvent).toHaveBeenCalledWith(
        UPGRADE_PROMPT_EVENTS.UPGRADE_LIMIT_BLOCKED,
        expect.objectContaining({
          metric: "apiCalls",
          usagePercentage: 100,
        })
      );
    });

    it("tracks click when upgrade button is clicked", async () => {
      const user = userEvent.setup();
      render(<UsageLimitModal {...defaultProps} />);

      await user.click(screen.getByRole("link", { name: /Upgrade to Plus/i }));

      expect(trackEvent).toHaveBeenCalledWith(
        UPGRADE_PROMPT_EVENTS.UPGRADE_PROMPT_CLICKED,
        expect.objectContaining({
          metric: "apiCalls",
          targetPlan: "PLUS",
        })
      );
    });

    it("tracks dismissal when dismiss button is clicked", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(<UsageLimitModal {...defaultProps} onOpenChange={onOpenChange} />);

      await user.click(screen.getByRole("button", { name: "Not Now" }));

      expect(trackEvent).toHaveBeenCalledWith(
        UPGRADE_PROMPT_EVENTS.UPGRADE_PROMPT_DISMISSED,
        expect.objectContaining({
          metric: "apiCalls",
        })
      );
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("different metrics", () => {
    it("renders correctly for projects metric", () => {
      render(<UsageLimitModal {...defaultProps} metric="projects" />);

      expect(screen.getByText("Approaching Projects Limit")).toBeInTheDocument();
      expect(
        screen.getByText(/You're using 90% of your active projects limit/)
      ).toBeInTheDocument();
    });

    it("renders correctly for teamMembers metric", () => {
      render(<UsageLimitModal {...defaultProps} metric="teamMembers" />);

      expect(
        screen.getByText("Approaching Team Members Limit")
      ).toBeInTheDocument();
      expect(
        screen.getByText(/You're using 90% of your team seats limit/)
      ).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has accessible progress bar", () => {
      render(<UsageLimitModal {...defaultProps} />);

      const progressBar = screen.getByRole("progressbar");
      expect(progressBar).toHaveAttribute(
        "aria-label",
        "90% of API Calls used"
      );
    });
  });
});
