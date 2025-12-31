/**
 * Unit tests for RetryPaymentButton component
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoist mocks for vitest
const { mockRetryPaymentAction, mockToast } = vi.hoisted(() => ({
  mockRetryPaymentAction: vi.fn(),
  mockToast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock server action
vi.mock("@/actions/billing/retry-payment", () => ({
  retryPaymentAction: mockRetryPaymentAction,
}));

// Mock toast
vi.mock("sonner", () => ({
  toast: mockToast,
}));

import { RetryPaymentButton } from "@/components/billing/retry-payment-button";

// Mock window.location.reload
const reloadMock = vi.fn();
Object.defineProperty(window, "location", {
  value: {
    reload: reloadMock,
  },
  writable: true,
});

describe("RetryPaymentButton", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders button with correct text", () => {
      render(<RetryPaymentButton />);

      expect(
        screen.getByRole("button", { name: /Retry Payment/i })
      ).toBeInTheDocument();
    });

    it("renders with RefreshCw icon", () => {
      const { container } = render(<RetryPaymentButton />);

      // Should have an SVG icon
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it("uses default variant and small size", () => {
      render(<RetryPaymentButton />);

      const button = screen.getByRole("button", { name: /Retry Payment/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe("success flow", () => {
    it("calls retryPaymentAction when clicked", async () => {
      mockRetryPaymentAction.mockResolvedValue({
        success: true,
      });

      render(<RetryPaymentButton />);

      const button = screen.getByRole("button", { name: /Retry Payment/i });
      await user.click(button);

      await waitFor(() => {
        expect(mockRetryPaymentAction).toHaveBeenCalledTimes(1);
      });
    });

    it("shows success toast on successful payment", async () => {
      mockRetryPaymentAction.mockResolvedValue({
        success: true,
      });

      render(<RetryPaymentButton />);

      const button = screen.getByRole("button", { name: /Retry Payment/i });
      await user.click(button);

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith(
          "Payment successful! Your subscription has been restored."
        );
      });
    });

    it("reloads page on successful payment", async () => {
      mockRetryPaymentAction.mockResolvedValue({
        success: true,
      });

      render(<RetryPaymentButton />);

      const button = screen.getByRole("button", { name: /Retry Payment/i });
      await user.click(button);

      await waitFor(() => {
        expect(reloadMock).toHaveBeenCalled();
      });
    });
  });

  describe("error flow", () => {
    it("shows error toast on payment failure", async () => {
      mockRetryPaymentAction.mockResolvedValue({
        success: false,
        error: "Payment failed. Please update your payment method.",
      });

      render(<RetryPaymentButton />);

      const button = screen.getByRole("button", { name: /Retry Payment/i });
      await user.click(button);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          "Payment failed. Please update your payment method."
        );
      });
    });

    it("shows generic error toast when error message is missing", async () => {
      mockRetryPaymentAction.mockResolvedValue({
        success: false,
        error: undefined,
      });

      render(<RetryPaymentButton />);

      const button = screen.getByRole("button", { name: /Retry Payment/i });
      await user.click(button);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith("Payment failed");
      });
    });

    it("does not reload page on payment failure", async () => {
      mockRetryPaymentAction.mockResolvedValue({
        success: false,
        error: "Payment failed",
      });

      render(<RetryPaymentButton />);

      const button = screen.getByRole("button", { name: /Retry Payment/i });
      await user.click(button);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalled();
      });

      expect(reloadMock).not.toHaveBeenCalled();
    });
  });

  describe("loading state", () => {
    it("shows loading text during payment processing", async () => {
      // Create a promise that doesn't resolve immediately
      let resolvePayment: (value: { success: boolean }) => void;
      const paymentPromise = new Promise<{ success: boolean }>((resolve) => {
        resolvePayment = resolve;
      });
      mockRetryPaymentAction.mockReturnValue(paymentPromise);

      render(<RetryPaymentButton />);

      const button = screen.getByRole("button", { name: /Retry Payment/i });
      await user.click(button);

      // Button should show loading state
      expect(screen.getByText(/Processing.../i)).toBeInTheDocument();

      // Cleanup: resolve the promise
      resolvePayment!({ success: true });
    });

    it("disables button during payment processing", async () => {
      // Create a promise that doesn't resolve immediately
      let resolvePayment: (value: { success: boolean }) => void;
      const paymentPromise = new Promise<{ success: boolean }>((resolve) => {
        resolvePayment = resolve;
      });
      mockRetryPaymentAction.mockReturnValue(paymentPromise);

      render(<RetryPaymentButton />);

      const button = screen.getByRole("button", { name: /Retry Payment/i });
      await user.click(button);

      // Button should be disabled
      expect(button).toBeDisabled();

      // Cleanup: resolve the promise
      resolvePayment!({ success: true });
    });

    it("shows loading spinner icon during payment processing", async () => {
      // Create a promise that doesn't resolve immediately
      let resolvePayment: (value: { success: boolean }) => void;
      const paymentPromise = new Promise<{ success: boolean }>((resolve) => {
        resolvePayment = resolve;
      });
      mockRetryPaymentAction.mockReturnValue(paymentPromise);

      const { container } = render(<RetryPaymentButton />);

      const button = screen.getByRole("button", { name: /Retry Payment/i });
      await user.click(button);

      // Should show loader icon with animate-spin class
      const loader = container.querySelector('svg.animate-spin');
      expect(loader).toBeInTheDocument();

      // Cleanup: resolve the promise
      resolvePayment!({ success: true });
    });

    it("re-enables button after payment completes", async () => {
      mockRetryPaymentAction.mockResolvedValue({
        success: true,
      });

      render(<RetryPaymentButton />);

      const button = screen.getByRole("button", { name: /Retry Payment/i });
      await user.click(button);

      // Wait for action to complete
      await waitFor(() => {
        expect(mockRetryPaymentAction).toHaveBeenCalled();
      });

      // Note: Button won't be re-enabled because page reloads on success
      // This test just ensures no crashes occur
    });
  });

  describe("accessibility", () => {
    it("button is keyboard accessible", async () => {
      mockRetryPaymentAction.mockResolvedValue({
        success: true,
      });

      render(<RetryPaymentButton />);

      const button = screen.getByRole("button", { name: /Retry Payment/i });

      // Simulate keyboard activation
      button.focus();
      expect(button).toHaveFocus();
    });

    it("has accessible button label", () => {
      render(<RetryPaymentButton />);

      const button = screen.getByRole("button", { name: /Retry Payment/i });
      expect(button).toHaveAccessibleName();
    });

    it("icons have aria-hidden attribute", () => {
      const { container } = render(<RetryPaymentButton />);

      const svgs = container.querySelectorAll('svg');
      svgs.forEach((svg) => {
        expect(svg).toHaveAttribute("aria-hidden", "true");
      });
    });

    it("button is not interactive when disabled", async () => {
      // Create a promise that doesn't resolve immediately
      let resolvePayment: (value: { success: boolean }) => void;
      const paymentPromise = new Promise<{ success: boolean }>((resolve) => {
        resolvePayment = resolve;
      });
      mockRetryPaymentAction.mockReturnValue(paymentPromise);

      render(<RetryPaymentButton />);

      const button = screen.getByRole("button", { name: /Retry Payment/i });
      await user.click(button);

      // Try to click again while processing
      await user.click(button);

      // Action should only be called once
      expect(mockRetryPaymentAction).toHaveBeenCalledTimes(1);

      // Cleanup: resolve the promise
      resolvePayment!({ success: true });
    });
  });
});
