/**
 * Unit tests for NotificationPreferences component
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoist mocks for vitest
const { mockUpdateNotificationPreferences } = vi.hoisted(() => ({
  mockUpdateNotificationPreferences: vi.fn(),
}));

// Mock the server action
vi.mock("@/actions/settings/update-notification-preferences", () => ({
  updateNotificationPreferences: mockUpdateNotificationPreferences,
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { NotificationPreferences } from "@/components/settings/notification-preferences";
import { toast } from "sonner";

const defaultPreferences = {
  emailMarketingOptIn: true,
  emailProductUpdates: true,
  emailSecurityAlerts: true,
};

describe("NotificationPreferences", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateNotificationPreferences.mockResolvedValue({ success: true });
  });

  describe("rendering", () => {
    it("renders all notification settings", () => {
      render(<NotificationPreferences preferences={defaultPreferences} />);

      expect(screen.getByText("Marketing emails")).toBeInTheDocument();
      expect(screen.getByText("Product updates")).toBeInTheDocument();
      expect(screen.getByText("Security alerts")).toBeInTheDocument();
    });

    it("renders card title and description", () => {
      render(<NotificationPreferences preferences={defaultPreferences} />);

      expect(screen.getByText("Email Notifications")).toBeInTheDocument();
      expect(screen.getByText(/choose which emails/i)).toBeInTheDocument();
    });

    it("shows recommended badge for security alerts", () => {
      render(<NotificationPreferences preferences={defaultPreferences} />);

      expect(screen.getByText("(Recommended)")).toBeInTheDocument();
    });

    it("renders switches with correct initial state", () => {
      const preferences = {
        emailMarketingOptIn: false,
        emailProductUpdates: true,
        emailSecurityAlerts: true,
      };

      render(<NotificationPreferences preferences={preferences} />);

      const marketingSwitch = screen.getByRole("switch", { name: /toggle marketing emails/i });
      const productSwitch = screen.getByRole("switch", { name: /toggle product updates/i });
      const securitySwitch = screen.getByRole("switch", { name: /toggle security alerts/i });

      expect(marketingSwitch).toHaveAttribute("data-state", "unchecked");
      expect(productSwitch).toHaveAttribute("data-state", "checked");
      expect(securitySwitch).toHaveAttribute("data-state", "checked");
    });
  });

  describe("toggle behavior", () => {
    it("calls updateNotificationPreferences when toggling marketing emails", async () => {
      render(<NotificationPreferences preferences={defaultPreferences} />);

      const marketingSwitch = screen.getByRole("switch", { name: /toggle marketing emails/i });
      await user.click(marketingSwitch);

      await waitFor(() => {
        expect(mockUpdateNotificationPreferences).toHaveBeenCalledWith({
          emailMarketingOptIn: false,
        });
      });
    });

    it("calls updateNotificationPreferences when toggling product updates", async () => {
      render(<NotificationPreferences preferences={defaultPreferences} />);

      const productSwitch = screen.getByRole("switch", { name: /toggle product updates/i });
      await user.click(productSwitch);

      await waitFor(() => {
        expect(mockUpdateNotificationPreferences).toHaveBeenCalledWith({
          emailProductUpdates: false,
        });
      });
    });

    it("calls updateNotificationPreferences when toggling security alerts", async () => {
      render(<NotificationPreferences preferences={defaultPreferences} />);

      const securitySwitch = screen.getByRole("switch", { name: /toggle security alerts/i });
      await user.click(securitySwitch);

      await waitFor(() => {
        expect(mockUpdateNotificationPreferences).toHaveBeenCalledWith({
          emailSecurityAlerts: false,
        });
      });
    });

    it("shows success toast on successful update", async () => {
      mockUpdateNotificationPreferences.mockResolvedValue({ success: true });

      render(<NotificationPreferences preferences={defaultPreferences} />);

      const marketingSwitch = screen.getByRole("switch", { name: /toggle marketing emails/i });
      await user.click(marketingSwitch);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Preferences updated");
      });
    });

    it("shows error toast on failed update", async () => {
      mockUpdateNotificationPreferences.mockResolvedValue({
        success: false,
        error: "Failed to update",
      });

      render(<NotificationPreferences preferences={defaultPreferences} />);

      const marketingSwitch = screen.getByRole("switch", { name: /toggle marketing emails/i });
      await user.click(marketingSwitch);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to update");
      });
    });
  });

  describe("accessibility", () => {
    it("all switches are keyboard accessible", () => {
      render(<NotificationPreferences preferences={defaultPreferences} />);

      const switches = screen.getAllByRole("switch");
      expect(switches).toHaveLength(3);

      switches.forEach((switchEl) => {
        expect(switchEl).not.toHaveAttribute("tabindex", "-1");
      });
    });

    it("switches have proper aria-labels", () => {
      render(<NotificationPreferences preferences={defaultPreferences} />);

      expect(screen.getByRole("switch", { name: /toggle marketing emails/i })).toBeInTheDocument();
      expect(screen.getByRole("switch", { name: /toggle product updates/i })).toBeInTheDocument();
      expect(screen.getByRole("switch", { name: /toggle security alerts/i })).toBeInTheDocument();
    });
  });
});
