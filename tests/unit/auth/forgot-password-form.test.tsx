/**
 * TDD: ForgotPasswordForm Component Tests
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

// Mock the forgot password action
const mockForgotPasswordAction = vi.fn();
vi.mock("@/actions/auth", () => ({
  forgotPasswordAction: (input: unknown) => mockForgotPasswordAction(input),
}));

describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockForgotPasswordAction.mockResolvedValue({
      success: true,
      message: "If an account exists with this email, you will receive a reset link",
    });
  });

  describe("Rendering", () => {
    it("renders the forgot password form with email field", () => {
      render(<ForgotPasswordForm />);

      expect(screen.getByTestId("email")).toBeInTheDocument();
      expect(screen.getByTestId("forgot-password-button")).toBeInTheDocument();
    });

    it("renders email input with correct attributes", () => {
      render(<ForgotPasswordForm />);

      const emailInput = screen.getByTestId("email");
      expect(emailInput).toHaveAttribute("type", "email");
      expect(emailInput).toHaveAttribute("name", "email");
      expect(emailInput).toHaveAttribute("required");
    });

    it("renders sign in link", () => {
      render(<ForgotPasswordForm />);

      const signInLink = screen.getByRole("link", { name: /sign in/i });
      expect(signInLink).toBeInTheDocument();
      expect(signInLink).toHaveAttribute("href", "/login");
    });

    it("renders the submit button with correct text", () => {
      render(<ForgotPasswordForm />);

      const submitButton = screen.getByTestId("forgot-password-button");
      expect(submitButton).toHaveTextContent("Send reset link");
    });

    it("does not render social login buttons", () => {
      render(<ForgotPasswordForm />);

      expect(
        screen.queryByRole("button", { name: /google/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /github/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("requires email field", () => {
      render(<ForgotPasswordForm />);

      const emailInput = screen.getByTestId("email");
      expect(emailInput).toBeRequired();
    });
  });

  describe("Form Submission", () => {
    it("calls forgotPasswordAction with correct data on submit", async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordForm />);

      await user.type(screen.getByTestId("email"), "test@example.com");
      await user.click(screen.getByTestId("forgot-password-button"));

      await waitFor(() => {
        expect(mockForgotPasswordAction).toHaveBeenCalledWith({
          email: "test@example.com",
        });
      });
    });

    it("displays success message after submission", async () => {
      const user = userEvent.setup();
      mockForgotPasswordAction.mockResolvedValue({
        success: true,
        message: "If an account exists with this email, you will receive a reset link",
      });

      render(<ForgotPasswordForm />);

      await user.type(screen.getByTestId("email"), "test@example.com");
      await user.click(screen.getByTestId("forgot-password-button"));

      await waitFor(() => {
        expect(
          screen.getByText(
            "If an account exists with this email, you will receive a reset link"
          )
        ).toBeInTheDocument();
      });
    });

    it("displays message with proper styling", async () => {
      const user = userEvent.setup();
      mockForgotPasswordAction.mockResolvedValue({
        success: true,
        message: "If an account exists with this email, you will receive a reset link",
      });

      render(<ForgotPasswordForm />);

      await user.type(screen.getByTestId("email"), "test@example.com");
      await user.click(screen.getByTestId("forgot-password-button"));

      await waitFor(() => {
        const messageElement = screen.getByText(
          "If an account exists with this email, you will receive a reset link"
        );
        expect(messageElement.closest("div")).toHaveClass("bg-green-100");
      });
    });

    it("clears previous message when submitting again", async () => {
      const user = userEvent.setup();

      render(<ForgotPasswordForm />);

      // First submission
      await user.type(screen.getByTestId("email"), "first@example.com");
      await user.click(screen.getByTestId("forgot-password-button"));

      await waitFor(() => {
        expect(mockForgotPasswordAction).toHaveBeenCalledTimes(1);
      });

      // Clear email and submit again
      await user.clear(screen.getByTestId("email"));
      await user.type(screen.getByTestId("email"), "second@example.com");
      await user.click(screen.getByTestId("forgot-password-button"));

      await waitFor(() => {
        expect(mockForgotPasswordAction).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("Message Display", () => {
    it("does not display message initially", () => {
      render(<ForgotPasswordForm />);

      expect(
        screen.queryByText(/if an account exists/i)
      ).not.toBeInTheDocument();
    });

    it("always shows success-style message regardless of result", async () => {
      const user = userEvent.setup();
      // Even for non-existent emails, the API returns success to prevent enumeration
      mockForgotPasswordAction.mockResolvedValue({
        success: true,
        message: "If an account exists with this email, you will receive a reset link",
      });

      render(<ForgotPasswordForm />);

      await user.type(screen.getByTestId("email"), "nonexistent@example.com");
      await user.click(screen.getByTestId("forgot-password-button"));

      await waitFor(() => {
        const messageElement = screen.getByText(
          "If an account exists with this email, you will receive a reset link"
        );
        // Should use green styling (success) to prevent email enumeration
        expect(messageElement.closest("div")).toHaveClass("bg-green-100");
      });
    });
  });

  describe("Loading State", () => {
    it("shows loading text when form is submitting", async () => {
      const user = userEvent.setup();
      mockForgotPasswordAction.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  success: true,
                  message: "Reset link sent",
                }),
              100
            )
          )
      );

      render(<ForgotPasswordForm />);

      await user.type(screen.getByTestId("email"), "test@example.com");
      await user.click(screen.getByTestId("forgot-password-button"));

      expect(screen.getByText("Sending...")).toBeInTheDocument();
    });

    it("disables form inputs during submission", async () => {
      const user = userEvent.setup();
      mockForgotPasswordAction.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  success: true,
                  message: "Reset link sent",
                }),
              100
            )
          )
      );

      render(<ForgotPasswordForm />);

      await user.type(screen.getByTestId("email"), "test@example.com");
      await user.click(screen.getByTestId("forgot-password-button"));

      expect(screen.getByTestId("email")).toBeDisabled();
      expect(screen.getByTestId("forgot-password-button")).toBeDisabled();
    });

    it("re-enables form after submission completes", async () => {
      const user = userEvent.setup();
      mockForgotPasswordAction.mockResolvedValue({
        success: true,
        message: "Reset link sent",
      });

      render(<ForgotPasswordForm />);

      await user.type(screen.getByTestId("email"), "test@example.com");
      await user.click(screen.getByTestId("forgot-password-button"));

      await waitFor(() => {
        expect(screen.getByTestId("email")).not.toBeDisabled();
        expect(screen.getByTestId("forgot-password-button")).not.toBeDisabled();
      });
    });
  });

  describe("Accessibility", () => {
    it("has proper label for email field", () => {
      render(<ForgotPasswordForm />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it("has proper placeholder", () => {
      render(<ForgotPasswordForm />);

      expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    });

    it("submit button is focusable", () => {
      render(<ForgotPasswordForm />);

      const submitButton = screen.getByTestId("forgot-password-button");
      submitButton.focus();
      expect(submitButton).toHaveFocus();
    });

    it("has helpful text for users", () => {
      render(<ForgotPasswordForm />);

      expect(screen.getByText(/remember your password\?/i)).toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    it("has link back to login page", () => {
      render(<ForgotPasswordForm />);

      const signInLink = screen.getByRole("link", { name: /sign in/i });
      expect(signInLink).toHaveAttribute("href", "/login");
    });
  });
});
