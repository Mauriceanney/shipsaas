/**
 * TDD: Manage Subscription Button Component Tests
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { ManageSubscriptionButton } from "@/components/billing/manage-subscription-button";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

import { toast } from "sonner";
const mockToast = vi.mocked(toast);

describe("ManageSubscriptionButton", () => {
  const mockFetch = vi.fn();
  const originalLocation = window.location;

  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    // Mock window.location
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

  describe("when hasSubscription is false", () => {
    it("renders nothing", () => {
      const { container } = render(
        <ManageSubscriptionButton hasSubscription={false} />
      );

      expect(container).toBeEmptyDOMElement();
    });

    it("does not render the button", () => {
      render(<ManageSubscriptionButton hasSubscription={false} />);

      expect(
        screen.queryByRole("button", { name: /manage subscription/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("when hasSubscription is true", () => {
    it("renders the manage subscription button", () => {
      render(<ManageSubscriptionButton hasSubscription={true} />);

      expect(
        screen.getByRole("button", { name: /manage subscription/i })
      ).toBeInTheDocument();
    });

    it("renders the external link icon", () => {
      const { container } = render(
        <ManageSubscriptionButton hasSubscription={true} />
      );

      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("button is not disabled initially", () => {
      render(<ManageSubscriptionButton hasSubscription={true} />);

      const button = screen.getByRole("button", {
        name: /manage subscription/i,
      });
      expect(button).not.toBeDisabled();
    });
  });

  describe("click handling", () => {
    it("calls fetch with correct endpoint on click", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ url: "https://billing.stripe.com/portal" }),
      });

      render(<ManageSubscriptionButton hasSubscription={true} />);

      const button = screen.getByRole("button", {
        name: /manage subscription/i,
      });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/stripe/portal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
      });
    });

    it("redirects to Stripe portal on success", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ url: "https://billing.stripe.com/portal" }),
      });

      render(<ManageSubscriptionButton hasSubscription={true} />);

      const button = screen.getByRole("button", {
        name: /manage subscription/i,
      });
      fireEvent.click(button);

      await waitFor(() => {
        expect(window.location.href).toBe("https://billing.stripe.com/portal");
      });
    });
  });

  describe("loading state", () => {
    it("shows loading text while fetching", async () => {
      let resolvePromise: (value: unknown) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(pendingPromise);

      render(<ManageSubscriptionButton hasSubscription={true} />);

      const button = screen.getByRole("button", {
        name: /manage subscription/i,
      });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText("Loading...")).toBeInTheDocument();
      });

      // Resolve to cleanup
      resolvePromise!({
        ok: true,
        json: () => Promise.resolve({ url: "https://stripe.com" }),
      });
    });

    it("disables button while loading", async () => {
      let resolvePromise: (value: unknown) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(pendingPromise);

      render(<ManageSubscriptionButton hasSubscription={true} />);

      const button = screen.getByRole("button", {
        name: /manage subscription/i,
      });
      fireEvent.click(button);

      await waitFor(() => {
        expect(button).toBeDisabled();
      });

      // Resolve to cleanup
      resolvePromise!({
        ok: true,
        json: () => Promise.resolve({ url: "https://stripe.com" }),
      });
    });
  });

  describe("error handling", () => {
    it("displays error toast on API failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: "Failed to open portal" }),
      });

      render(<ManageSubscriptionButton hasSubscription={true} />);

      const button = screen.getByRole("button", {
        name: /manage subscription/i,
      });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith("Failed to open portal");
      });
    });

    it("displays default error toast when no error provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      });

      render(<ManageSubscriptionButton hasSubscription={true} />);

      const button = screen.getByRole("button", {
        name: /manage subscription/i,
      });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith("Failed to open portal");
      });
    });

    it("displays error toast on network failure", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      render(<ManageSubscriptionButton hasSubscription={true} />);

      const button = screen.getByRole("button", {
        name: /manage subscription/i,
      });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith("Network error");
      });
    });

    it("handles non-Error exceptions gracefully", async () => {
      mockFetch.mockRejectedValueOnce("String error");

      render(<ManageSubscriptionButton hasSubscription={true} />);

      const button = screen.getByRole("button", {
        name: /manage subscription/i,
      });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith("An error occurred");
      });
    });

    it("re-enables button after error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      render(<ManageSubscriptionButton hasSubscription={true} />);

      const button = screen.getByRole("button", {
        name: /manage subscription/i,
      });
      fireEvent.click(button);

      await waitFor(() => {
        expect(button).not.toBeDisabled();
        expect(screen.getByText("Manage Subscription")).toBeInTheDocument();
      });
    });
  });
});
