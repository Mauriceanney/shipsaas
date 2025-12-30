/**
 * TDD: RegisterForm Component Tests
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { RegisterForm } from "@/components/auth/register-form";

// Mock the register action
const mockRegisterAction = vi.fn();
vi.mock("@/actions/auth", () => ({
  registerAction: (input: unknown) => mockRegisterAction(input),
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

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockRegisterAction.mockResolvedValue({
      success: true,
      message: "Please check your email to verify your account",
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Helper function to fill out the form with TOS acceptance
  async function fillFormAndAcceptTos(
    user: ReturnType<typeof userEvent.setup>,
    formData: { name: string; email: string; password: string; confirmPassword: string }
  ) {
    await user.type(screen.getByTestId("name"), formData.name);
    await user.type(screen.getByTestId("email"), formData.email);
    await user.type(screen.getByTestId("password"), formData.password);
    await user.type(screen.getByTestId("confirmPassword"), formData.confirmPassword);
    // Click the TOS checkbox
    const tosCheckbox = screen.getByRole("checkbox", { name: /terms of service/i });
    await user.click(tosCheckbox);
  }

  describe("Rendering", () => {
    it("renders the registration form with all fields", () => {
      render(<RegisterForm />);

      expect(screen.getByTestId("name")).toBeInTheDocument();
      expect(screen.getByTestId("email")).toBeInTheDocument();
      expect(screen.getByTestId("password")).toBeInTheDocument();
      expect(screen.getByTestId("confirmPassword")).toBeInTheDocument();
      expect(screen.getByTestId("register-button")).toBeInTheDocument();
    });

    it("renders TOS checkbox", () => {
      render(<RegisterForm />);

      expect(screen.getByRole("checkbox", { name: /terms of service/i })).toBeInTheDocument();
    });

    it("renders submit button disabled initially when TOS not accepted", () => {
      render(<RegisterForm />);

      expect(screen.getByTestId("register-button")).toBeDisabled();
    });

    it("enables submit button when TOS is accepted", async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      render(<RegisterForm />);

      // Initially disabled
      expect(screen.getByTestId("register-button")).toBeDisabled();

      // Click TOS checkbox
      const tosCheckbox = screen.getByRole("checkbox", { name: /terms of service/i });
      await user.click(tosCheckbox);

      // Now enabled
      expect(screen.getByTestId("register-button")).not.toBeDisabled();
    });

    it("disables submit button when TOS is unchecked", async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      render(<RegisterForm />);

      const tosCheckbox = screen.getByRole("checkbox", { name: /terms of service/i });

      // Accept TOS
      await user.click(tosCheckbox);
      expect(screen.getByTestId("register-button")).not.toBeDisabled();

      // Uncheck TOS
      await user.click(tosCheckbox);
      expect(screen.getByTestId("register-button")).toBeDisabled();
    });

    it("renders name input with correct attributes", () => {
      render(<RegisterForm />);

      const nameInput = screen.getByTestId("name");
      expect(nameInput).toHaveAttribute("type", "text");
      expect(nameInput).toHaveAttribute("name", "name");
      expect(nameInput).toHaveAttribute("required");
    });

    it("renders email input with correct attributes", () => {
      render(<RegisterForm />);

      const emailInput = screen.getByTestId("email");
      expect(emailInput).toHaveAttribute("type", "email");
      expect(emailInput).toHaveAttribute("name", "email");
      expect(emailInput).toHaveAttribute("required");
    });

    it("renders password input with correct attributes", () => {
      render(<RegisterForm />);

      const passwordInput = screen.getByTestId("password");
      expect(passwordInput).toHaveAttribute("type", "password");
      expect(passwordInput).toHaveAttribute("name", "password");
      expect(passwordInput).toHaveAttribute("required");
    });

    it("renders confirm password input with correct attributes", () => {
      render(<RegisterForm />);

      const confirmPasswordInput = screen.getByTestId("confirmPassword");
      expect(confirmPasswordInput).toHaveAttribute("type", "password");
      expect(confirmPasswordInput).toHaveAttribute("name", "confirmPassword");
      expect(confirmPasswordInput).toHaveAttribute("required");
    });

    it("renders password requirements hint", () => {
      render(<RegisterForm />);

      expect(
        screen.getByText(/8\+ characters.*uppercase.*lowercase.*number.*special/i)
      ).toBeInTheDocument();
    });

    it("renders sign in link", () => {
      render(<RegisterForm />);

      const signInLink = screen.getByRole("link", { name: /sign in/i });
      expect(signInLink).toBeInTheDocument();
      expect(signInLink).toHaveAttribute("href", "/login");
    });

    it("renders social login buttons", () => {
      render(<RegisterForm />);

      expect(screen.getByRole("button", { name: /google/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /github/i })).toBeInTheDocument();
    });

    it("renders separator with 'Or continue with' text", () => {
      render(<RegisterForm />);

      expect(screen.getByText(/or continue with/i)).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("requires name field", () => {
      render(<RegisterForm />);

      const nameInput = screen.getByTestId("name");
      expect(nameInput).toBeRequired();
    });

    it("requires email field", () => {
      render(<RegisterForm />);

      const emailInput = screen.getByTestId("email");
      expect(emailInput).toBeRequired();
    });

    it("requires password field", () => {
      render(<RegisterForm />);

      const passwordInput = screen.getByTestId("password");
      expect(passwordInput).toBeRequired();
    });

    it("requires confirm password field", () => {
      render(<RegisterForm />);

      const confirmPasswordInput = screen.getByTestId("confirmPassword");
      expect(confirmPasswordInput).toBeRequired();
    });
  });

  describe("Form Submission", () => {
    it("calls registerAction with correct data on submit", async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      render(<RegisterForm />);

      await fillFormAndAcceptTos(user, {
        name: "John Doe",
        email: "john@example.com",
        password: "Password123!",
        confirmPassword: "Password123!",
      });
      await user.click(screen.getByTestId("register-button"));

      await waitFor(() => {
        expect(mockRegisterAction).toHaveBeenCalledWith({
          name: "John Doe",
          email: "john@example.com",
          password: "Password123!",
          confirmPassword: "Password123!",
          tosAccepted: true,
        });
      });
    });

    it("calls toast.success on successful registration", async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      mockRegisterAction.mockResolvedValue({
        success: true,
        message: "Please check your email to verify your account",
      });

      render(<RegisterForm />);

      await fillFormAndAcceptTos(user, {
        name: "John Doe",
        email: "john@example.com",
        password: "Password123!",
        confirmPassword: "Password123!",
      });
      await user.click(screen.getByTestId("register-button"));

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith(
          "Account created! Check your email to verify.",
          expect.objectContaining({ description: "Redirecting to login..." })
        );
      });
    });

    it("redirects to login after successful registration", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      mockRegisterAction.mockResolvedValue({
        success: true,
        message: "Account created successfully",
      });

      render(<RegisterForm />);

      await fillFormAndAcceptTos(user, {
        name: "John Doe",
        email: "john@example.com",
        password: "Password123!",
        confirmPassword: "Password123!",
      });
      await user.click(screen.getByTestId("register-button"));

      // Wait for registration to complete
      await waitFor(() => {
        expect(mockRegisterAction).toHaveBeenCalled();
      });

      // Advance timer by 2 seconds for the redirect
      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/login");
      });
    });

  });

  describe("Error Handling", () => {
    it("calls toast.error when registration fails", async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      mockRegisterAction.mockResolvedValue({
        success: false,
        error: "An account with this email already exists",
      });

      render(<RegisterForm />);

      await fillFormAndAcceptTos(user, {
        name: "John Doe",
        email: "existing@example.com",
        password: "Password123!",
        confirmPassword: "Password123!",
      });
      await user.click(screen.getByTestId("register-button"));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith("An account with this email already exists");
      });
    });

    it("does not call toast initially", () => {
      render(<RegisterForm />);

      expect(mockToast.error).not.toHaveBeenCalled();
      expect(mockToast.success).not.toHaveBeenCalled();
    });
  });

  describe("Loading State", () => {
    it("shows loading text when form is submitting", async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      mockRegisterAction.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true, message: "Success" }), 100)
          )
      );

      render(<RegisterForm />);

      await fillFormAndAcceptTos(user, {
        name: "John Doe",
        email: "john@example.com",
        password: "Password123!",
        confirmPassword: "Password123!",
      });
      await user.click(screen.getByTestId("register-button"));

      expect(screen.getByText("Creating account...")).toBeInTheDocument();
    });

    it("disables form inputs during submission", async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      mockRegisterAction.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true, message: "Success" }), 100)
          )
      );

      render(<RegisterForm />);

      await fillFormAndAcceptTos(user, {
        name: "John Doe",
        email: "john@example.com",
        password: "Password123!",
        confirmPassword: "Password123!",
      });
      await user.click(screen.getByTestId("register-button"));

      expect(screen.getByTestId("name")).toBeDisabled();
      expect(screen.getByTestId("email")).toBeDisabled();
      expect(screen.getByTestId("password")).toBeDisabled();
      expect(screen.getByTestId("confirmPassword")).toBeDisabled();
      expect(screen.getByTestId("register-button")).toBeDisabled();
    });

    it("re-enables form after submission completes", async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      mockRegisterAction.mockResolvedValue({
        success: false,
        error: "Registration failed",
      });

      render(<RegisterForm />);

      await fillFormAndAcceptTos(user, {
        name: "John Doe",
        email: "john@example.com",
        password: "Password123!",
        confirmPassword: "Password123!",
      });
      await user.click(screen.getByTestId("register-button"));

      await waitFor(() => {
        expect(screen.getByTestId("name")).not.toBeDisabled();
        expect(screen.getByTestId("email")).not.toBeDisabled();
        expect(screen.getByTestId("password")).not.toBeDisabled();
        expect(screen.getByTestId("confirmPassword")).not.toBeDisabled();
        expect(screen.getByTestId("register-button")).not.toBeDisabled();
      });
    });
  });

  describe("Accessibility", () => {
    it("has proper labels for form fields", () => {
      render(<RegisterForm />);

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      // Password has two labels, so we check by test id
      expect(screen.getByTestId("password")).toBeInTheDocument();
      expect(screen.getByTestId("confirmPassword")).toBeInTheDocument();
    });

    it("has proper placeholders", () => {
      render(<RegisterForm />);

      expect(screen.getByPlaceholderText("John Doe")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    });

    it("submit button is focusable when enabled", async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      render(<RegisterForm />);

      // Accept TOS to enable the button
      const tosCheckbox = screen.getByRole("checkbox", { name: /terms of service/i });
      await user.click(tosCheckbox);

      const submitButton = screen.getByTestId("register-button");
      submitButton.focus();
      expect(submitButton).toHaveFocus();
    });
  });
});
