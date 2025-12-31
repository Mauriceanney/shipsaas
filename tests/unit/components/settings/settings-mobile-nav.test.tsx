import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/settings"),
}));

import { usePathname } from "next/navigation";
import { SettingsMobileNav } from "@/components/settings/settings-mobile-nav";

describe("SettingsMobileNav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the menu trigger button", () => {
    render(<SettingsMobileNav />);

    const button = screen.getByRole("button", { name: /open settings menu/i });
    expect(button).toBeInTheDocument();
  });

  it("opens sheet when trigger is clicked", () => {
    render(<SettingsMobileNav />);

    const button = screen.getByRole("button", { name: /open settings menu/i });
    fireEvent.click(button);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("renders all navigation groups", () => {
    render(<SettingsMobileNav />);

    const button = screen.getByRole("button", { name: /open settings menu/i });
    fireEvent.click(button);

    expect(screen.getByText("Account")).toBeInTheDocument();
    expect(screen.getByText("Preferences")).toBeInTheDocument();
    expect(screen.getByText("Legal")).toBeInTheDocument();
  });

  it("renders all navigation items", () => {
    render(<SettingsMobileNav />);

    const button = screen.getByRole("button", { name: /open settings menu/i });
    fireEvent.click(button);

    // Account group
    expect(screen.getByRole("link", { name: /general/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /profile/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /security/i })).toBeInTheDocument();

    // Preferences group
    expect(screen.getByRole("link", { name: /notifications/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /billing/i })).toBeInTheDocument();

    // Legal group
    expect(screen.getByRole("link", { name: /privacy/i })).toBeInTheDocument();
  });

  it("highlights current route as active", () => {
    vi.mocked(usePathname).mockReturnValue("/settings");

    render(<SettingsMobileNav />);

    const button = screen.getByRole("button", { name: /open settings menu/i });
    fireEvent.click(button);

    const generalLink = screen.getByRole("link", { name: /general/i });
    expect(generalLink).toHaveAttribute("aria-current", "page");
  });

  it("highlights nested routes correctly", () => {
    vi.mocked(usePathname).mockReturnValue("/settings/security");

    render(<SettingsMobileNav />);

    const button = screen.getByRole("button", { name: /open settings menu/i });
    fireEvent.click(button);

    const securityLink = screen.getByRole("link", { name: /security/i });
    expect(securityLink).toHaveAttribute("aria-current", "page");

    // General should not be active
    const generalLink = screen.getByRole("link", { name: /general/i });
    expect(generalLink).not.toHaveAttribute("aria-current");
  });

  it("has proper touch targets (min 44px height)", () => {
    render(<SettingsMobileNav />);

    const button = screen.getByRole("button", { name: /open settings menu/i });
    fireEvent.click(button);

    const links = screen.getAllByRole("link");
    links.forEach((link) => {
      expect(link).toHaveClass("min-h-[44px]");
    });
  });

  it("has correct href attributes on links", () => {
    render(<SettingsMobileNav />);

    const button = screen.getByRole("button", { name: /open settings menu/i });
    fireEvent.click(button);

    expect(screen.getByRole("link", { name: /general/i })).toHaveAttribute(
      "href",
      "/settings"
    );
    expect(screen.getByRole("link", { name: /profile/i })).toHaveAttribute(
      "href",
      "/settings/profile"
    );
    expect(screen.getByRole("link", { name: /security/i })).toHaveAttribute(
      "href",
      "/settings/security"
    );
    expect(screen.getByRole("link", { name: /notifications/i })).toHaveAttribute(
      "href",
      "/settings/notifications"
    );
    expect(screen.getByRole("link", { name: /billing/i })).toHaveAttribute(
      "href",
      "/settings/billing"
    );
    expect(screen.getByRole("link", { name: /privacy/i })).toHaveAttribute(
      "href",
      "/settings/privacy"
    );
  });

  it("has accessible navigation landmark", () => {
    render(<SettingsMobileNav />);

    const button = screen.getByRole("button", { name: /open settings menu/i });
    fireEvent.click(button);

    expect(
      screen.getByRole("navigation", { name: /settings navigation/i })
    ).toBeInTheDocument();
  });
});
