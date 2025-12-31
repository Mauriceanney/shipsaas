/**
 * Unit tests for SettingsNav component
 * Left sidebar navigation for settings pages
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoist mocks for vitest
const { mockUsePathname } = vi.hoisted(() => ({
  mockUsePathname: vi.fn(),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: mockUsePathname,
}));

import { SettingsNav } from "@/components/settings/settings-nav";

describe("SettingsNav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue("/settings");
  });

  describe("rendering", () => {
    it("renders all navigation items", () => {
      render(<SettingsNav />);

      expect(screen.getByRole("link", { name: /general/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /profile/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /security/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /notifications/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /billing/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /privacy/i })).toBeInTheDocument();
    });

    it("links have correct hrefs", () => {
      render(<SettingsNav />);

      expect(screen.getByRole("link", { name: /general/i })).toHaveAttribute("href", "/settings");
      expect(screen.getByRole("link", { name: /profile/i })).toHaveAttribute("href", "/settings/profile");
      expect(screen.getByRole("link", { name: /security/i })).toHaveAttribute("href", "/settings/security");
      expect(screen.getByRole("link", { name: /notifications/i })).toHaveAttribute("href", "/settings/notifications");
      expect(screen.getByRole("link", { name: /billing/i })).toHaveAttribute("href", "/settings/billing");
      expect(screen.getByRole("link", { name: /privacy/i })).toHaveAttribute("href", "/settings/privacy");
    });
  });

  describe("active state", () => {
    it("highlights General when on /settings", () => {
      mockUsePathname.mockReturnValue("/settings");
      render(<SettingsNav />);

      const generalLink = screen.getByRole("link", { name: /general/i });
      expect(generalLink).toHaveClass("bg-accent");
    });

    it("highlights Profile when on /settings/profile", () => {
      mockUsePathname.mockReturnValue("/settings/profile");
      render(<SettingsNav />);

      const profileLink = screen.getByRole("link", { name: /profile/i });
      expect(profileLink).toHaveClass("bg-accent");
    });

    it("highlights Security when on /settings/security", () => {
      mockUsePathname.mockReturnValue("/settings/security");
      render(<SettingsNav />);

      const securityLink = screen.getByRole("link", { name: /security/i });
      expect(securityLink).toHaveClass("bg-accent");
    });

    it("highlights Notifications when on /settings/notifications", () => {
      mockUsePathname.mockReturnValue("/settings/notifications");
      render(<SettingsNav />);

      const notificationsLink = screen.getByRole("link", { name: /notifications/i });
      expect(notificationsLink).toHaveClass("bg-accent");
    });

    it("highlights Billing when on /settings/billing", () => {
      mockUsePathname.mockReturnValue("/settings/billing");
      render(<SettingsNav />);

      const billingLink = screen.getByRole("link", { name: /billing/i });
      expect(billingLink).toHaveClass("bg-accent");
    });

    it("highlights Privacy when on /settings/privacy", () => {
      mockUsePathname.mockReturnValue("/settings/privacy");
      render(<SettingsNav />);

      const privacyLink = screen.getByRole("link", { name: /privacy/i });
      expect(privacyLink).toHaveClass("bg-accent");
    });

    it("non-active links do not have bg-accent", () => {
      mockUsePathname.mockReturnValue("/settings");
      render(<SettingsNav />);

      const profileLink = screen.getByRole("link", { name: /profile/i });
      expect(profileLink).not.toHaveClass("bg-accent");
    });
  });

  describe("accessibility", () => {
    it("all navigation links are focusable", () => {
      render(<SettingsNav />);

      const links = screen.getAllByRole("link");
      links.forEach((link) => {
        expect(link).not.toHaveAttribute("tabindex", "-1");
      });
    });

    it("renders as nav element", () => {
      render(<SettingsNav />);

      expect(screen.getByRole("navigation")).toBeInTheDocument();
    });
  });
});
