import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the useCookieConsent hook
vi.mock("@/hooks/use-cookie-consent", () => ({
  useCookieConsent: vi.fn(),
}));

import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { useCookieConsent } from "@/hooks/use-cookie-consent";

describe("CookieConsentBanner", () => {
  const mockAcceptAll = vi.fn();
  const mockRejectNonEssential = vi.fn();
  const mockSavePreferences = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when consent is needed", () => {
    beforeEach(() => {
      vi.mocked(useCookieConsent).mockReturnValue({
        status: "pending",
        preferences: { essential: true, analytics: false, marketing: false },
        isLoaded: true,
        needsConsent: true,
        acceptAll: mockAcceptAll,
        rejectNonEssential: mockRejectNonEssential,
        savePreferences: mockSavePreferences,
        resetConsent: vi.fn(),
        isAllowed: vi.fn(),
      });
    });

    it("renders the banner when consent is needed", () => {
      render(<CookieConsentBanner />);

      expect(screen.getByTestId("cookie-consent-banner")).toBeInTheDocument();
      expect(screen.getByText("We value your privacy")).toBeInTheDocument();
    });

    it("renders all three action buttons", () => {
      render(<CookieConsentBanner />);

      expect(screen.getByTestId("cookie-accept-btn")).toBeInTheDocument();
      expect(screen.getByTestId("cookie-reject-btn")).toBeInTheDocument();
      expect(screen.getByTestId("cookie-customize-btn")).toBeInTheDocument();
    });

    it("calls acceptAll when Accept All button is clicked", async () => {
      const user = userEvent.setup();
      render(<CookieConsentBanner />);

      await user.click(screen.getByTestId("cookie-accept-btn"));

      expect(mockAcceptAll).toHaveBeenCalledTimes(1);
    });

    it("calls rejectNonEssential when Reject Non-Essential button is clicked", async () => {
      const user = userEvent.setup();
      render(<CookieConsentBanner />);

      await user.click(screen.getByTestId("cookie-reject-btn"));

      expect(mockRejectNonEssential).toHaveBeenCalledTimes(1);
    });

    it("opens customize dialog when Customize button is clicked", async () => {
      const user = userEvent.setup();
      render(<CookieConsentBanner />);

      await user.click(screen.getByTestId("cookie-customize-btn"));

      expect(screen.getByText("Cookie Preferences")).toBeInTheDocument();
      expect(screen.getByText("Essential Cookies")).toBeInTheDocument();
      expect(screen.getByText("Analytics Cookies")).toBeInTheDocument();
      expect(screen.getByText("Marketing Cookies")).toBeInTheDocument();
    });

    it("has a link to privacy policy", () => {
      render(<CookieConsentBanner />);

      const privacyLink = screen.getByRole("link", { name: /privacy policy/i });
      expect(privacyLink).toHaveAttribute("href", "/privacy");
    });
  });

  describe("customize dialog", () => {
    beforeEach(() => {
      vi.mocked(useCookieConsent).mockReturnValue({
        status: "pending",
        preferences: { essential: true, analytics: false, marketing: false },
        isLoaded: true,
        needsConsent: true,
        acceptAll: mockAcceptAll,
        rejectNonEssential: mockRejectNonEssential,
        savePreferences: mockSavePreferences,
        resetConsent: vi.fn(),
        isAllowed: vi.fn(),
      });
    });

    it("shows essential cookies as always enabled", async () => {
      const user = userEvent.setup();
      render(<CookieConsentBanner />);

      await user.click(screen.getByTestId("cookie-customize-btn"));

      // Essential cookies switch should be disabled and checked
      const essentialSwitch = screen.getByRole("switch", { name: /essential cookies/i });
      expect(essentialSwitch).toBeDisabled();
      expect(essentialSwitch).toBeChecked();
    });

    it("allows toggling analytics cookies", async () => {
      const user = userEvent.setup();
      render(<CookieConsentBanner />);

      await user.click(screen.getByTestId("cookie-customize-btn"));

      const analyticsSwitch = screen.getByTestId("cookie-analytics-switch");
      expect(analyticsSwitch).not.toBeChecked();

      await user.click(analyticsSwitch);
      expect(analyticsSwitch).toBeChecked();
    });

    it("allows toggling marketing cookies", async () => {
      const user = userEvent.setup();
      render(<CookieConsentBanner />);

      await user.click(screen.getByTestId("cookie-customize-btn"));

      const marketingSwitch = screen.getByTestId("cookie-marketing-switch");
      expect(marketingSwitch).not.toBeChecked();

      await user.click(marketingSwitch);
      expect(marketingSwitch).toBeChecked();
    });

    it("calls savePreferences with selected options when Save Preferences is clicked", async () => {
      const user = userEvent.setup();
      render(<CookieConsentBanner />);

      await user.click(screen.getByTestId("cookie-customize-btn"));

      // Enable analytics
      await user.click(screen.getByTestId("cookie-analytics-switch"));

      // Save preferences
      await user.click(screen.getByTestId("cookie-save-preferences-btn"));

      expect(mockSavePreferences).toHaveBeenCalledWith({
        essential: true,
        analytics: true,
        marketing: false,
      });
    });

    it("closes dialog when Cancel is clicked", async () => {
      const user = userEvent.setup();
      render(<CookieConsentBanner />);

      await user.click(screen.getByTestId("cookie-customize-btn"));
      expect(screen.getByText("Cookie Preferences")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /cancel/i }));

      await waitFor(() => {
        expect(screen.queryByText("Cookie Preferences")).not.toBeInTheDocument();
      });
    });
  });

  describe("when consent is not needed", () => {
    it("does not render the banner when consent already given", () => {
      vi.mocked(useCookieConsent).mockReturnValue({
        status: "accepted",
        preferences: { essential: true, analytics: true, marketing: true },
        isLoaded: true,
        needsConsent: false,
        acceptAll: mockAcceptAll,
        rejectNonEssential: mockRejectNonEssential,
        savePreferences: mockSavePreferences,
        resetConsent: vi.fn(),
        isAllowed: vi.fn(),
      });

      render(<CookieConsentBanner />);

      expect(screen.queryByTestId("cookie-consent-banner")).not.toBeInTheDocument();
    });

    it("does not render when rejected", () => {
      vi.mocked(useCookieConsent).mockReturnValue({
        status: "rejected",
        preferences: { essential: true, analytics: false, marketing: false },
        isLoaded: true,
        needsConsent: false,
        acceptAll: mockAcceptAll,
        rejectNonEssential: mockRejectNonEssential,
        savePreferences: mockSavePreferences,
        resetConsent: vi.fn(),
        isAllowed: vi.fn(),
      });

      render(<CookieConsentBanner />);

      expect(screen.queryByTestId("cookie-consent-banner")).not.toBeInTheDocument();
    });
  });
});
