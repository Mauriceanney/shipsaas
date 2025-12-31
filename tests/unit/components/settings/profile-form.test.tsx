/**
 * Unit tests for ProfileForm component
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockUpdateProfile, mockRefresh } = vi.hoisted(() => ({
  mockUpdateProfile: vi.fn(),
  mockRefresh: vi.fn(),
}));

vi.mock("@/actions/settings/update-profile", () => ({
  updateProfile: mockUpdateProfile,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

import { ProfileForm } from "@/components/settings/profile-form";
import { toast } from "sonner";

describe("ProfileForm", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders form with name input", () => {
      render(<ProfileForm defaultName="John Doe" defaultEmail="john@example.com" isCredentialUser={true} />);

      const nameInput = screen.getByLabelText(/name/i);
      expect(nameInput).toBeInTheDocument();
      expect(nameInput).toHaveValue("John Doe");
    });

    it("renders email input", () => {
      render(<ProfileForm defaultName="John Doe" defaultEmail="john@example.com" isCredentialUser={true} />);

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveValue("john@example.com");
    });

    it("renders save button", () => {
      render(<ProfileForm defaultName="John Doe" defaultEmail="john@example.com" isCredentialUser={true} />);

      expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
    });
  });

  describe("credential user", () => {
    it("allows email editing for credential users", () => {
      render(<ProfileForm defaultName="John Doe" defaultEmail="john@example.com" isCredentialUser={true} />);

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).not.toBeDisabled();
    });

    it("submits form with email for credential users", async () => {
      mockUpdateProfile.mockResolvedValue({ success: true, data: { name: "John", email: "new@example.com" } });

      render(<ProfileForm defaultName="John" defaultEmail="old@example.com" isCredentialUser={true} />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.clear(emailInput);
      await user.type(emailInput, "new@example.com");
      await user.click(screen.getByRole("button", { name: /save/i }));

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith({ name: "John", email: "new@example.com" });
      });
    });

    it("shows credential user email description", () => {
      render(<ProfileForm defaultName="John Doe" defaultEmail="john@example.com" isCredentialUser={true} />);

      expect(screen.getByText(/email address for login/i)).toBeInTheDocument();
    });
  });

  describe("OAuth user", () => {
    it("disables email input for OAuth users", () => {
      render(<ProfileForm defaultName="John Doe" defaultEmail="john@example.com" isCredentialUser={false} />);

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toBeDisabled();
    });

    it("does not include email in submission for OAuth users", async () => {
      mockUpdateProfile.mockResolvedValue({ success: true, data: { name: "Jane Smith" } });

      render(<ProfileForm defaultName="John Doe" defaultEmail="john@example.com" isCredentialUser={false} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.clear(nameInput);
      await user.type(nameInput, "Jane Smith");
      await user.click(screen.getByRole("button", { name: /save/i }));

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith({ name: "Jane Smith" });
      });
    });

    it("shows OAuth email description", () => {
      render(<ProfileForm defaultName="John Doe" defaultEmail="john@example.com" isCredentialUser={false} />);

      expect(screen.getByText(/managed by your authentication provider/i)).toBeInTheDocument();
    });
  });

  describe("form submission", () => {
    it("submits form with updated name", async () => {
      mockUpdateProfile.mockResolvedValue({ success: true, data: { name: "Jane Smith" } });

      render(<ProfileForm defaultName="John Doe" defaultEmail="john@example.com" isCredentialUser={false} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.clear(nameInput);
      await user.type(nameInput, "Jane Smith");

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith({ name: "Jane Smith" });
      });
    });

    it("shows success toast on successful update", async () => {
      mockUpdateProfile.mockResolvedValue({ success: true, data: { name: "Jane Smith" } });

      render(<ProfileForm defaultName="John Doe" defaultEmail="john@example.com" isCredentialUser={false} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.clear(nameInput);
      await user.type(nameInput, "Jane Smith");
      await user.click(screen.getByRole("button", { name: /save/i }));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Profile updated successfully");
      });
    });

    it("refreshes the page on successful update", async () => {
      mockUpdateProfile.mockResolvedValue({ success: true, data: { name: "Jane Smith" } });

      render(<ProfileForm defaultName="John Doe" defaultEmail="john@example.com" isCredentialUser={false} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.clear(nameInput);
      await user.type(nameInput, "Jane Smith");
      await user.click(screen.getByRole("button", { name: /save/i }));

      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it("shows error toast on failed update", async () => {
      mockUpdateProfile.mockResolvedValue({ success: false, error: "Failed to update profile" });

      render(<ProfileForm defaultName="John Doe" defaultEmail="john@example.com" isCredentialUser={false} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.clear(nameInput);
      await user.type(nameInput, "Jane Smith");
      await user.click(screen.getByRole("button", { name: /save/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to update profile");
      });
    });

    it("does not refresh page on failed update", async () => {
      mockUpdateProfile.mockResolvedValue({ success: false, error: "Failed to update profile" });

      render(<ProfileForm defaultName="John Doe" defaultEmail="john@example.com" isCredentialUser={false} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.clear(nameInput);
      await user.type(nameInput, "Jane Smith");
      await user.click(screen.getByRole("button", { name: /save/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
      expect(mockRefresh).not.toHaveBeenCalled();
    });

    it("disables button and shows loading state during submission", async () => {
      mockUpdateProfile.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<ProfileForm defaultName="John Doe" defaultEmail="john@example.com" isCredentialUser={false} />);

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      expect(saveButton).toBeDisabled();
      expect(screen.getByText(/saving/i)).toBeInTheDocument();
    });
  });

  describe("validation", () => {
    it("validates name is not empty", async () => {
      render(<ProfileForm defaultName="John Doe" defaultEmail="john@example.com" isCredentialUser={false} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.clear(nameInput);
      await user.click(screen.getByRole("button", { name: /save/i }));

      // Form validation should prevent submission
      expect(mockUpdateProfile).not.toHaveBeenCalled();
    });

    it("trims whitespace from name", async () => {
      mockUpdateProfile.mockResolvedValue({ success: true, data: { name: "Jane Smith" } });

      render(<ProfileForm defaultName="John Doe" defaultEmail="john@example.com" isCredentialUser={false} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.clear(nameInput);
      await user.type(nameInput, "  Jane Smith  ");
      await user.click(screen.getByRole("button", { name: /save/i }));

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith({ name: "Jane Smith" });
      });
    });

    it("trims whitespace from email for credential users", async () => {
      mockUpdateProfile.mockResolvedValue({ success: true, data: { name: "John", email: "test@example.com" } });

      render(<ProfileForm defaultName="John" defaultEmail="old@example.com" isCredentialUser={true} />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.clear(emailInput);
      await user.type(emailInput, "  test@example.com  ");
      await user.click(screen.getByRole("button", { name: /save/i }));

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith({ name: "John", email: "test@example.com" });
      });
    });
  });
});
