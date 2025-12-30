/**
 * TDD: LoginForm Component Tests
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { LoginForm } from "@/components/auth/login-form";

// Mock the login action
const mockLoginAction = vi.fn();
vi.mock("@/actions/auth", () => ({
  loginAction: (input: unknown) => mockLoginAction(input),
}));

// Mock next-auth/react for social login buttons
vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}));

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

// Mock next/navigation with proper search params
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoginAction.mockResolvedValue({ success: true });
  });

  describe("Rendering", () => {
    it("renders the login form with email and password fields", () => {
      render(<LoginForm />);

      expect(screen.getByTestId("email")).toBeInTheDocument();
      expect(screen.getByTestId("password")).toBeInTheDocument();
      expect(screen.getByTestId("login-button")).toBeInTheDocument();
    });

    it("renders email input with correct attributes", () => {
      render(<LoginForm />);

      const emailInput = screen.getByTestId("email");
      expect(emailInput).toHaveAttribute("type", "email");
      expect(emailInput).toHaveAttribute("name", "email");
      expect(emailInput).toHaveAttribute("required");
    });

    it("renders password input with correct attributes", () => {
      render(<LoginForm />);

      const passwordInput = screen.getByTestId("password");
      expect(passwordInput).toHaveAttribute("type", "password");
      expect(passwordInput).toHaveAttribute("name", "password");
      expect(passwordInput).toHaveAttribute("required");
    });

    it("renders forgot password link", () => {
      render(<LoginForm />);

      const forgotPasswordLink = screen.getByRole("link", {
        name: /forgot password/i,
      });
      expect(forgotPasswordLink).toBeInTheDocument();
      expect(forgotPasswordLink).toHaveAttribute("href", "/forgot-password");
    });

    it("renders sign up link", () => {
      render(<LoginForm />);

      const signUpLink = screen.getByRole("link", { name: /sign up/i });
      expect(signUpLink).toBeInTheDocument();
      expect(signUpLink).toHaveAttribute("href", "/signup");
    });

    it("renders social login buttons", () => {
      render(<LoginForm />);

      expect(screen.getByRole("button", { name: /google/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /github/i })).toBeInTheDocument();
    });

    it("renders separator with 'Or continue with' text", () => {
      render(<LoginForm />);

      expect(screen.getByText(/or continue with/i)).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("requires email field", () => {
      render(<LoginForm />);

      const emailInput = screen.getByTestId("email");
      expect(emailInput).toBeRequired();
    });

    it("requires password field", () => {
      render(<LoginForm />);

      const passwordInput = screen.getByTestId("password");
      expect(passwordInput).toBeRequired();
    });
  });

  describe("Form Submission", () => {
    it("calls loginAction with correct data on submit", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByTestId("email");
      const passwordInput = screen.getByTestId("password");
      const submitButton = screen.getByTestId("login-button");

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLoginAction).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "password123",
        });
      });
    });

    it("redirects to dashboard on successful login", async () => {
      const user = userEvent.setup();
      mockLoginAction.mockResolvedValue({ success: true });

      render(<LoginForm />);

      await user.type(screen.getByTestId("email"), "test@example.com");
      await user.type(screen.getByTestId("password"), "password123");
      await user.click(screen.getByTestId("login-button"));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/dashboard");
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it("calls toast.success on successful login", async () => {
      const user = userEvent.setup();
      mockLoginAction.mockResolvedValue({ success: true });

      render(<LoginForm />);

      await user.type(screen.getByTestId("email"), "test@example.com");
      await user.type(screen.getByTestId("password"), "password123");
      await user.click(screen.getByTestId("login-button"));

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith("Welcome back!");
      });
    });
  });

  describe("Error Handling", () => {
    it("calls toast.error when login fails", async () => {
      const user = userEvent.setup();
      mockLoginAction.mockResolvedValue({
        success: false,
        error: "Invalid email or password",
      });

      render(<LoginForm />);

      await user.type(screen.getByTestId("email"), "test@example.com");
      await user.type(screen.getByTestId("password"), "wrongpassword");
      await user.click(screen.getByTestId("login-button"));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith("Invalid email or password");
      });
    });

    it("does not call toast.error initially", () => {
      render(<LoginForm />);

      expect(mockToast.error).not.toHaveBeenCalled();
    });
  });

  describe("Loading State", () => {
    it("shows loading text when form is submitting", async () => {
      const user = userEvent.setup();
      // Make the action take longer
      mockLoginAction.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      );

      render(<LoginForm />);

      await user.type(screen.getByTestId("email"), "test@example.com");
      await user.type(screen.getByTestId("password"), "password123");
      await user.click(screen.getByTestId("login-button"));

      // Check for loading state
      expect(screen.getByText("Signing in...")).toBeInTheDocument();
    });

    it("disables form inputs during submission", async () => {
      const user = userEvent.setup();
      mockLoginAction.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      );

      render(<LoginForm />);

      await user.type(screen.getByTestId("email"), "test@example.com");
      await user.type(screen.getByTestId("password"), "password123");
      await user.click(screen.getByTestId("login-button"));

      expect(screen.getByTestId("email")).toBeDisabled();
      expect(screen.getByTestId("password")).toBeDisabled();
      expect(screen.getByTestId("login-button")).toBeDisabled();
    });

    it("re-enables form after submission completes", async () => {
      const user = userEvent.setup();
      mockLoginAction.mockResolvedValue({
        success: false,
        error: "Invalid credentials",
      });

      render(<LoginForm />);

      await user.type(screen.getByTestId("email"), "test@example.com");
      await user.type(screen.getByTestId("password"), "password123");
      await user.click(screen.getByTestId("login-button"));

      await waitFor(() => {
        expect(screen.getByTestId("email")).not.toBeDisabled();
        expect(screen.getByTestId("password")).not.toBeDisabled();
        expect(screen.getByTestId("login-button")).not.toBeDisabled();
      });
    });
  });

  describe("Callback URL", () => {
    it("uses default dashboard callback URL when no search params", async () => {
      const user = userEvent.setup();
      mockLoginAction.mockResolvedValue({ success: true });

      render(<LoginForm />);

      await user.type(screen.getByTestId("email"), "test@example.com");
      await user.type(screen.getByTestId("password"), "password123");
      await user.click(screen.getByTestId("login-button"));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/dashboard");
      });
    });
  });

  describe("Accessibility", () => {
    it("has proper labels for form fields", () => {
      render(<LoginForm />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it("email input has proper placeholder", () => {
      render(<LoginForm />);

      expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    });

    it("submit button is focusable", () => {
      render(<LoginForm />);

      const submitButton = screen.getByTestId("login-button");
      submitButton.focus();
      expect(submitButton).toHaveFocus();
    });
  });
});
