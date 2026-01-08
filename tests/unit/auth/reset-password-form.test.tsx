/**
 * TDD: ResetPasswordForm Component Tests
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";

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

// Mock the reset password action
const mockResetPasswordAction = vi.fn();
vi.mock("@/actions/auth", () => ({
  resetPasswordAction: (input: unknown) => mockResetPasswordAction(input),
}));

// Mock next/navigation with customizable search params
const mockPush = vi.fn();
let mockToken: string | null = "valid-token";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: (key: string) => (key === "token" ? mockToken : null),
  }),
}));

describe("ResetPasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockToken = "valid-token";
    mockResetPasswordAction.mockResolvedValue({
      success: true,
      message: "Your password has been reset successfully",
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Rendering - With Token", () => {
    it("renders the reset password form with password fields", () => {
      render(<ResetPasswordForm />);

      expect(screen.getByTestId("password")).toBeInTheDocument();
      expect(screen.getByTestId("confirmPassword")).toBeInTheDocument();
      expect(screen.getByTestId("reset-password-button")).toBeInTheDocument();
    });

    it("renders password input with correct attributes", () => {
      render(<ResetPasswordForm />);

      const passwordInput = screen.getByTestId("password");
      expect(passwordInput).toHaveAttribute("type", "password");
      expect(passwordInput).toHaveAttribute("name", "password");
      expect(passwordInput).toHaveAttribute("required");
    });

    it("renders confirm password input with correct attributes", () => {
      render(<ResetPasswordForm />);

      const confirmPasswordInput = screen.getByTestId("confirmPassword");
      expect(confirmPasswordInput).toHaveAttribute("type", "password");
      expect(confirmPasswordInput).toHaveAttribute("name", "confirmPassword");
      expect(confirmPasswordInput).toHaveAttribute("required");
    });


    it("renders sign in link", () => {
      render(<ResetPasswordForm />);

      const signInLink = screen.getByRole("link", { name: /sign in/i });
      expect(signInLink).toBeInTheDocument();
      expect(signInLink).toHaveAttribute("href", "/login");
    });

    it("renders the submit button with correct text", () => {
      render(<ResetPasswordForm />);

      const submitButton = screen.getByTestId("reset-password-button");
      expect(submitButton).toHaveTextContent("Reset password");
    });
  });

  describe("Rendering - Without Token", () => {
    it("shows invalid reset link message when token is missing", () => {
      mockToken = null;
      render(<ResetPasswordForm />);

      expect(screen.getByText("Invalid reset link.")).toBeInTheDocument();
    });

    it("shows link to request new reset link when token is missing", () => {
      mockToken = null;
      render(<ResetPasswordForm />);

      const requestLink = screen.getByRole("link", {
        name: /request a new reset link/i,
      });
      expect(requestLink).toBeInTheDocument();
      expect(requestLink).toHaveAttribute("href", "/forgot-password");
    });

    it("does not render form fields when token is missing", () => {
      mockToken = null;
      render(<ResetPasswordForm />);

      expect(screen.queryByTestId("password")).not.toBeInTheDocument();
      expect(screen.queryByTestId("confirmPassword")).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("reset-password-button")
      ).not.toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("requires password field", () => {
      render(<ResetPasswordForm />);

      const passwordInput = screen.getByTestId("password");
      expect(passwordInput).toBeRequired();
    });

    it("requires confirm password field", () => {
      render(<ResetPasswordForm />);

      const confirmPasswordInput = screen.getByTestId("confirmPassword");
      expect(confirmPasswordInput).toBeRequired();
    });
  });

  describe("Form Submission", () => {
    it("calls resetPasswordAction with correct data on submit", async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      render(<ResetPasswordForm />);

      await user.type(screen.getByTestId("password"), "NewPassword123!");
      await user.type(screen.getByTestId("confirmPassword"), "NewPassword123!");
      await user.click(screen.getByTestId("reset-password-button"));

      await waitFor(() => {
        expect(mockResetPasswordAction).toHaveBeenCalledWith({
          token: "valid-token",
          password: "NewPassword123!",
          confirmPassword: "NewPassword123!",
        });
      });
    });

    it("displays success toast on successful reset", async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      mockResetPasswordAction.mockResolvedValue({
        success: true,
        message: "Your password has been reset successfully",
      });

      render(<ResetPasswordForm />);

      await user.type(screen.getByTestId("password"), "NewPassword123!");
      await user.type(screen.getByTestId("confirmPassword"), "NewPassword123!");
      await user.click(screen.getByTestId("reset-password-button"));

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith("Password updated successfully!", {
          description: "Redirecting to login...",
        });
      });
    });

    it("redirects to login after successful reset", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      mockResetPasswordAction.mockResolvedValue({
        success: true,
        message: "Password reset successfully",
      });

      render(<ResetPasswordForm />);

      await user.type(screen.getByTestId("password"), "NewPassword123!");
      await user.type(screen.getByTestId("confirmPassword"), "NewPassword123!");
      await user.click(screen.getByTestId("reset-password-button"));

      // Wait for reset action to complete
      await waitFor(() => {
        expect(mockResetPasswordAction).toHaveBeenCalled();
      });

      // Advance timer by 2 seconds for the redirect
      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/login");
      });
    });

    it("shows toast for each submission", async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      mockResetPasswordAction.mockResolvedValueOnce({
        success: false,
        error: "Token expired",
      });

      render(<ResetPasswordForm />);

      // First submission - fails
      await user.type(screen.getByTestId("password"), "NewPassword123!");
      await user.type(screen.getByTestId("confirmPassword"), "NewPassword123!");
      await user.click(screen.getByTestId("reset-password-button"));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith("Token expired");
      });

      // Second submission - succeeds
      mockResetPasswordAction.mockResolvedValueOnce({
        success: true,
        message: "Success",
      });
      await user.click(screen.getByTestId("reset-password-button"));

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith("Password updated successfully!", {
          description: "Redirecting to login...",
        });
        expect(mockResetPasswordAction).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("Error Handling", () => {
    it("displays error toast when reset fails", async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      mockResetPasswordAction.mockResolvedValue({
        success: false,
        error: "Invalid or expired reset link",
      });

      render(<ResetPasswordForm />);

      await user.type(screen.getByTestId("password"), "NewPassword123!");
      await user.type(screen.getByTestId("confirmPassword"), "NewPassword123!");
      await user.click(screen.getByTestId("reset-password-button"));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith("Invalid or expired reset link");
      });
    });

    it("displays error toast for password mismatch", async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      mockResetPasswordAction.mockResolvedValue({
        success: false,
        error: "Passwords do not match",
      });

      render(<ResetPasswordForm />);

      await user.type(screen.getByTestId("password"), "NewPassword123!");
      await user.type(screen.getByTestId("confirmPassword"), "Different123!");
      await user.click(screen.getByTestId("reset-password-button"));

      await waitFor(() => {
        expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
      });
    });

    it("displays error toast when token is expired", async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      mockResetPasswordAction.mockResolvedValue({
        success: false,
        error: "Token expired",
      });

      render(<ResetPasswordForm />);

      await user.type(screen.getByTestId("password"), "NewPassword123!");
      await user.type(screen.getByTestId("confirmPassword"), "NewPassword123!");
      await user.click(screen.getByTestId("reset-password-button"));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith("Token expired");
      });
    });
  });

  describe("Loading State", () => {
    it("shows loading text when form is submitting", async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      mockResetPasswordAction.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true, message: "Success" }), 100)
          )
      );

      render(<ResetPasswordForm />);

      await user.type(screen.getByTestId("password"), "NewPassword123!");
      await user.type(screen.getByTestId("confirmPassword"), "NewPassword123!");
      await user.click(screen.getByTestId("reset-password-button"));

      expect(screen.getByText("Resetting...")).toBeInTheDocument();
    });

    it("disables form inputs during submission", async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      mockResetPasswordAction.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true, message: "Success" }), 100)
          )
      );

      render(<ResetPasswordForm />);

      await user.type(screen.getByTestId("password"), "NewPassword123!");
      await user.type(screen.getByTestId("confirmPassword"), "NewPassword123!");
      await user.click(screen.getByTestId("reset-password-button"));

      expect(screen.getByTestId("password")).toBeDisabled();
      expect(screen.getByTestId("confirmPassword")).toBeDisabled();
      expect(screen.getByTestId("reset-password-button")).toBeDisabled();
    });

    it("re-enables form after submission completes", async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      mockResetPasswordAction.mockResolvedValue({
        success: false,
        error: "Reset failed",
      });

      render(<ResetPasswordForm />);

      await user.type(screen.getByTestId("password"), "NewPassword123!");
      await user.type(screen.getByTestId("confirmPassword"), "NewPassword123!");
      await user.click(screen.getByTestId("reset-password-button"));

      await waitFor(() => {
        expect(screen.getByTestId("password")).not.toBeDisabled();
        expect(screen.getByTestId("confirmPassword")).not.toBeDisabled();
        expect(screen.getByTestId("reset-password-button")).not.toBeDisabled();
      });
    });
  });

  describe("Accessibility", () => {
    it("has proper labels for form fields", () => {
      render(<ResetPasswordForm />);

      // Use getAllBy since "New Password" matches both label and the hint text pattern
      const labels = screen.getAllByText(/new password/i);
      expect(labels.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Confirm New Password")).toBeInTheDocument();
    });

    it("submit button is focusable", () => {
      render(<ResetPasswordForm />);

      const submitButton = screen.getByTestId("reset-password-button");
      submitButton.focus();
      expect(submitButton).toHaveFocus();
    });

    it("has helpful text for users", () => {
      render(<ResetPasswordForm />);

      expect(screen.getByText(/remember your password\?/i)).toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    it("has link back to login page", () => {
      render(<ResetPasswordForm />);

      const signInLink = screen.getByRole("link", { name: /sign in/i });
      expect(signInLink).toHaveAttribute("href", "/login");
    });
  });
});
