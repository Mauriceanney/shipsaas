/**
 * Unit tests for ProfileForm component
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockUpdateProfile } = vi.hoisted(() => ({
  mockUpdateProfile: vi.fn(),
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

import { ProfileForm } from "@/components/settings/profile-form";
import { toast } from "sonner";

describe("ProfileForm", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders form with name input", () => {
    render(<ProfileForm defaultName="John Doe" />);

    const nameInput = screen.getByLabelText(/name/i);
    expect(nameInput).toBeInTheDocument();
    expect(nameInput).toHaveValue("John Doe");
  });

  it("renders save button", () => {
    render(<ProfileForm defaultName="John Doe" />);

    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
  });

  it("submits form with updated name", async () => {
    mockUpdateProfile.mockResolvedValue({ success: true, data: { name: "Jane Smith" } });

    render(<ProfileForm defaultName="John Doe" />);

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

    render(<ProfileForm defaultName="John Doe" />);

    const nameInput = screen.getByLabelText(/name/i);
    await user.clear(nameInput);
    await user.type(nameInput, "Jane Smith");
    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Profile updated successfully");
    });
  });

  it("shows error toast on failed update", async () => {
    mockUpdateProfile.mockResolvedValue({ success: false, error: "Failed to update profile" });

    render(<ProfileForm defaultName="John Doe" />);

    const nameInput = screen.getByLabelText(/name/i);
    await user.clear(nameInput);
    await user.type(nameInput, "Jane Smith");
    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to update profile");
    });
  });

  it("disables button and shows loading state during submission", async () => {
    mockUpdateProfile.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<ProfileForm defaultName="John Doe" />);

    const saveButton = screen.getByRole("button", { name: /save/i });
    await user.click(saveButton);

    expect(saveButton).toBeDisabled();
    expect(screen.getByText(/saving/i)).toBeInTheDocument();
  });

  it("validates name is not empty", async () => {
    render(<ProfileForm defaultName="John Doe" />);

    const nameInput = screen.getByLabelText(/name/i);
    await user.clear(nameInput);
    await user.click(screen.getByRole("button", { name: /save/i }));

    // Form validation should prevent submission
    expect(mockUpdateProfile).not.toHaveBeenCalled();
  });

  it("trims whitespace from name", async () => {
    mockUpdateProfile.mockResolvedValue({ success: true, data: { name: "Jane Smith" } });

    render(<ProfileForm defaultName="John Doe" />);

    const nameInput = screen.getByLabelText(/name/i);
    await user.clear(nameInput);
    await user.type(nameInput, "  Jane Smith  ");
    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({ name: "Jane Smith" });
    });
  });
});
