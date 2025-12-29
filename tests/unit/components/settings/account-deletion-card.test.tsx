/**
 * TDD: AccountDeletionCard Component Tests
 */

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { AccountDeletionCard } from "@/components/settings/account-deletion-card";

// Mock the requestAccountDeletion action
const mockRequestAccountDeletion = vi.fn();
vi.mock("@/actions/gdpr", () => ({
  requestAccountDeletion: (input: unknown) => mockRequestAccountDeletion(input),
}));

describe("AccountDeletionCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequestAccountDeletion.mockResolvedValue({
      success: true,
      scheduledFor: new Date("2024-02-15"),
    });
  });

  describe("Rendering", () => {
    it("renders card with title and warning", () => {
      render(<AccountDeletionCard />);

      expect(screen.getByText("Delete Account")).toBeInTheDocument();
      expect(screen.getByText("Warning")).toBeInTheDocument();
      expect(
        screen.getByText(/This will permanently delete your account, including:/i)
      ).toBeInTheDocument();
    });

    it("renders delete button", () => {
      render(<AccountDeletionCard />);

      expect(
        screen.getByRole("button", { name: /delete my account/i })
      ).toBeInTheDocument();
    });

    it("renders warning list items", () => {
      render(<AccountDeletionCard />);

      expect(
        screen.getByText(/your profile and account settings/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/all connected accounts/i)).toBeInTheDocument();
      expect(
        screen.getByText(/your subscription \(will be cancelled\)/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/all your data/i)).toBeInTheDocument();
    });
  });

  describe("Dialog Interaction", () => {
    it("opens dialog when button clicked", async () => {
      const user = userEvent.setup();
      render(<AccountDeletionCard />);

      const deleteButton = screen.getByRole("button", {
        name: /delete my account/i,
      });
      await user.click(deleteButton);

      // Dialog should be open with confirmation inputs
      expect(screen.getByLabelText(/reason for leaving/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText("DELETE")).toBeInTheDocument();
      expect(
        screen.getByText(/this action cannot be undone after the 30-day grace period/i)
      ).toBeInTheDocument();
    });

    it("disables action button until DELETE is typed", async () => {
      const user = userEvent.setup();
      render(<AccountDeletionCard />);

      // Open dialog
      await user.click(
        screen.getByRole("button", { name: /delete my account/i })
      );

      // Find the dialog action button (Delete Account in dialog)
      const dialogButtons = screen.getAllByRole("button", {
        name: /delete account/i,
      });
      // The dialog action button is the second one (first is the trigger)
      const confirmButton = dialogButtons[dialogButtons.length - 1];

      expect(confirmButton).toBeDisabled();
    });

    it("enables action button when DELETE is typed correctly", async () => {
      const user = userEvent.setup();
      render(<AccountDeletionCard />);

      // Open dialog
      await user.click(
        screen.getByRole("button", { name: /delete my account/i })
      );

      // Type DELETE in confirmation input
      const confirmInput = screen.getByPlaceholderText("DELETE");
      await user.type(confirmInput, "DELETE");

      // Find the dialog action button
      const dialogButtons = screen.getAllByRole("button", {
        name: /delete account/i,
      });
      const confirmButton = dialogButtons[dialogButtons.length - 1];

      expect(confirmButton).not.toBeDisabled();
    });

    it("keeps action button disabled with incorrect confirmation text", async () => {
      const user = userEvent.setup();
      render(<AccountDeletionCard />);

      // Open dialog
      await user.click(
        screen.getByRole("button", { name: /delete my account/i })
      );

      // Type incorrect text
      const confirmInput = screen.getByPlaceholderText("DELETE");
      await user.type(confirmInput, "delete"); // lowercase

      // Find the dialog action button
      const dialogButtons = screen.getAllByRole("button", {
        name: /delete account/i,
      });
      const confirmButton = dialogButtons[dialogButtons.length - 1];

      expect(confirmButton).toBeDisabled();
    });

    it("allows entering optional reason", async () => {
      const user = userEvent.setup();
      render(<AccountDeletionCard />);

      // Open dialog
      await user.click(
        screen.getByRole("button", { name: /delete my account/i })
      );

      // Find and type in reason textarea
      const reasonTextarea = screen.getByLabelText(/reason for leaving/i);
      await user.type(reasonTextarea, "Moving to a different service");

      expect(reasonTextarea).toHaveValue("Moving to a different service");
    });

    it("clears inputs when cancel is clicked", async () => {
      const user = userEvent.setup();
      render(<AccountDeletionCard />);

      // Open dialog
      await user.click(
        screen.getByRole("button", { name: /delete my account/i })
      );

      // Fill in inputs
      await user.type(screen.getByPlaceholderText("DELETE"), "DELETE");
      await user.type(
        screen.getByLabelText(/reason for leaving/i),
        "Test reason"
      );

      // Click cancel
      await user.click(screen.getByRole("button", { name: /cancel/i }));

      // Re-open dialog
      await user.click(
        screen.getByRole("button", { name: /delete my account/i })
      );

      // Inputs should be cleared
      expect(screen.getByPlaceholderText("DELETE")).toHaveValue("");
      expect(screen.getByLabelText(/reason for leaving/i)).toHaveValue("");
    });
  });

  describe("Loading State", () => {
    it("shows loading state when deleting", async () => {
      const user = userEvent.setup();

      let resolvePromise: (value: unknown) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockRequestAccountDeletion.mockReturnValueOnce(pendingPromise);

      render(<AccountDeletionCard />);

      // Open dialog
      await user.click(
        screen.getByRole("button", { name: /delete my account/i })
      );

      // Type DELETE to enable button
      await user.type(screen.getByPlaceholderText("DELETE"), "DELETE");

      // Click delete - use fireEvent to avoid userEvent async batching issues
      const dialogButtons = screen.getAllByRole("button", {
        name: /delete account/i,
      });
      const confirmButton = dialogButtons[dialogButtons.length - 1];
      fireEvent.click(confirmButton);

      // Should show loading state - the button should be disabled
      await waitFor(() => {
        expect(confirmButton).toBeDisabled();
      });

      // Cleanup - wrap in act to avoid warnings
      await act(async () => {
        resolvePromise!({ success: true, scheduledFor: new Date() });
      });
    });

    it("disables confirm button during loading", async () => {
      const user = userEvent.setup();

      let resolvePromise: (value: unknown) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockRequestAccountDeletion.mockReturnValueOnce(pendingPromise);

      render(<AccountDeletionCard />);

      // Open dialog and type DELETE
      await user.click(
        screen.getByRole("button", { name: /delete my account/i })
      );
      await user.type(screen.getByPlaceholderText("DELETE"), "DELETE");

      // Click delete
      const dialogButtons = screen.getAllByRole("button", {
        name: /delete account/i,
      });
      const confirmButton = dialogButtons[dialogButtons.length - 1];
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(confirmButton).toBeDisabled();
      });

      // Cleanup - wrap in act to avoid warnings
      await act(async () => {
        resolvePromise!({ success: true, scheduledFor: new Date() });
      });
    });
  });

  describe("Success Handling", () => {
    it("shows success message on successful deletion", async () => {
      const user = userEvent.setup();
      const scheduledDate = new Date("2024-02-15");
      mockRequestAccountDeletion.mockResolvedValue({
        success: true,
        scheduledFor: scheduledDate,
      });

      render(<AccountDeletionCard />);

      // Open dialog and delete
      await user.click(
        screen.getByRole("button", { name: /delete my account/i })
      );
      await user.type(screen.getByPlaceholderText("DELETE"), "DELETE");

      const dialogButtons = screen.getAllByRole("button", {
        name: /delete account/i,
      });
      const confirmButton = dialogButtons[dialogButtons.length - 1];
      await user.click(confirmButton);

      // Wait for success message
      await waitFor(() => {
        expect(
          screen.getByText(/your account is scheduled for deletion/i)
        ).toBeInTheDocument();
      });
    });

    it("closes dialog after successful deletion", async () => {
      const user = userEvent.setup();
      mockRequestAccountDeletion.mockResolvedValue({
        success: true,
        scheduledFor: new Date(),
      });

      render(<AccountDeletionCard />);

      // Open dialog and delete
      await user.click(
        screen.getByRole("button", { name: /delete my account/i })
      );
      await user.type(screen.getByPlaceholderText("DELETE"), "DELETE");

      const dialogButtons = screen.getAllByRole("button", {
        name: /delete account/i,
      });
      const confirmButton = dialogButtons[dialogButtons.length - 1];
      await user.click(confirmButton);

      // Wait for dialog to close (confirmation input should not be visible)
      await waitFor(() => {
        expect(screen.queryByPlaceholderText("DELETE")).not.toBeInTheDocument();
      });
    });

    it("calls requestAccountDeletion with correct parameters", async () => {
      const user = userEvent.setup();
      render(<AccountDeletionCard />);

      // Open dialog
      await user.click(
        screen.getByRole("button", { name: /delete my account/i })
      );

      // Fill in reason and confirmation
      await user.type(
        screen.getByLabelText(/reason for leaving/i),
        "Test reason"
      );
      await user.type(screen.getByPlaceholderText("DELETE"), "DELETE");

      // Click delete
      const dialogButtons = screen.getAllByRole("button", {
        name: /delete account/i,
      });
      const confirmButton = dialogButtons[dialogButtons.length - 1];
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockRequestAccountDeletion).toHaveBeenCalledWith({
          confirmation: "DELETE",
          reason: "Test reason",
        });
      });
    });

    it("sends undefined reason when not provided", async () => {
      const user = userEvent.setup();
      render(<AccountDeletionCard />);

      // Open dialog
      await user.click(
        screen.getByRole("button", { name: /delete my account/i })
      );

      // Only type DELETE, no reason
      await user.type(screen.getByPlaceholderText("DELETE"), "DELETE");

      // Click delete
      const dialogButtons = screen.getAllByRole("button", {
        name: /delete account/i,
      });
      const confirmButton = dialogButtons[dialogButtons.length - 1];
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockRequestAccountDeletion).toHaveBeenCalledWith({
          confirmation: "DELETE",
          reason: undefined,
        });
      });
    });
  });

  describe("Error Handling", () => {
    it("shows error message on failed deletion", async () => {
      const user = userEvent.setup();
      mockRequestAccountDeletion.mockResolvedValue({
        success: false,
        error: "Account deletion already scheduled",
      });

      render(<AccountDeletionCard />);

      // Open dialog and delete
      await user.click(
        screen.getByRole("button", { name: /delete my account/i })
      );
      await user.type(screen.getByPlaceholderText("DELETE"), "DELETE");

      const dialogButtons = screen.getAllByRole("button", {
        name: /delete account/i,
      });
      const confirmButton = dialogButtons[dialogButtons.length - 1];
      await user.click(confirmButton);

      // Wait for error message
      await waitFor(() => {
        expect(
          screen.getByText("Account deletion already scheduled")
        ).toBeInTheDocument();
      });
    });

    it("shows default error message when no error provided", async () => {
      const user = userEvent.setup();
      mockRequestAccountDeletion.mockResolvedValue({
        success: false,
      });

      render(<AccountDeletionCard />);

      // Open dialog and delete
      await user.click(
        screen.getByRole("button", { name: /delete my account/i })
      );
      await user.type(screen.getByPlaceholderText("DELETE"), "DELETE");

      const dialogButtons = screen.getAllByRole("button", {
        name: /delete account/i,
      });
      const confirmButton = dialogButtons[dialogButtons.length - 1];
      await user.click(confirmButton);

      await waitFor(() => {
        expect(
          screen.getByText("Failed to request account deletion")
        ).toBeInTheDocument();
      });
    });

    it("shows error message on unexpected error", async () => {
      const user = userEvent.setup();
      mockRequestAccountDeletion.mockRejectedValue(new Error("Network error"));

      render(<AccountDeletionCard />);

      // Open dialog and delete
      await user.click(
        screen.getByRole("button", { name: /delete my account/i })
      );
      await user.type(screen.getByPlaceholderText("DELETE"), "DELETE");

      const dialogButtons = screen.getAllByRole("button", {
        name: /delete account/i,
      });
      const confirmButton = dialogButtons[dialogButtons.length - 1];
      await user.click(confirmButton);

      await waitFor(() => {
        expect(
          screen.getByText("An unexpected error occurred")
        ).toBeInTheDocument();
      });
    });

    it("applies error styling to error message", async () => {
      const user = userEvent.setup();
      mockRequestAccountDeletion.mockResolvedValue({
        success: false,
        error: "Test error",
      });

      render(<AccountDeletionCard />);

      // Open dialog and delete
      await user.click(
        screen.getByRole("button", { name: /delete my account/i })
      );
      await user.type(screen.getByPlaceholderText("DELETE"), "DELETE");

      const dialogButtons = screen.getAllByRole("button", {
        name: /delete account/i,
      });
      const confirmButton = dialogButtons[dialogButtons.length - 1];
      await user.click(confirmButton);

      await waitFor(() => {
        const errorMessage = screen.getByText("Test error");
        expect(errorMessage.closest("div")).toHaveClass("bg-red-50");
      });
    });
  });

  describe("Message Styling", () => {
    it("applies success styling to success message", async () => {
      const user = userEvent.setup();
      mockRequestAccountDeletion.mockResolvedValue({
        success: true,
        scheduledFor: new Date(),
      });

      render(<AccountDeletionCard />);

      // Open dialog and delete
      await user.click(
        screen.getByRole("button", { name: /delete my account/i })
      );
      await user.type(screen.getByPlaceholderText("DELETE"), "DELETE");

      const dialogButtons = screen.getAllByRole("button", {
        name: /delete account/i,
      });
      const confirmButton = dialogButtons[dialogButtons.length - 1];
      await user.click(confirmButton);

      await waitFor(() => {
        const successMessage = screen.getByText(
          /your account is scheduled for deletion/i
        );
        expect(successMessage.closest("div")).toHaveClass("bg-green-50");
      });
    });
  });
});
