import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";

describe("ConfirmDialog", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders trigger element", () => {
      render(
        <ConfirmDialog
          trigger={<button>Delete</button>}
          title="Confirm Delete"
          description="Are you sure?"
          onConfirm={vi.fn()}
        />
      );

      expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
    });

    it("does not show dialog initially", () => {
      render(
        <ConfirmDialog
          trigger={<button>Delete</button>}
          title="Confirm Delete"
          description="Are you sure?"
          onConfirm={vi.fn()}
        />
      );

      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });

    it("shows dialog when trigger is clicked", async () => {
      render(
        <ConfirmDialog
          trigger={<button>Delete</button>}
          title="Confirm Delete"
          description="Are you sure?"
          onConfirm={vi.fn()}
        />
      );

      await user.click(screen.getByRole("button", { name: /delete/i }));

      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });
  });

  describe("dialog content", () => {
    it("displays title", async () => {
      render(
        <ConfirmDialog
          trigger={<button>Delete</button>}
          title="Confirm Delete"
          description="Are you sure?"
          onConfirm={vi.fn()}
        />
      );

      await user.click(screen.getByRole("button", { name: /delete/i }));

      expect(screen.getByText("Confirm Delete")).toBeInTheDocument();
    });

    it("displays description", async () => {
      render(
        <ConfirmDialog
          trigger={<button>Delete</button>}
          title="Confirm Delete"
          description="This action cannot be undone."
          onConfirm={vi.fn()}
        />
      );

      await user.click(screen.getByRole("button", { name: /delete/i }));

      expect(screen.getByText("This action cannot be undone.")).toBeInTheDocument();
    });

    it("shows default confirm button text", async () => {
      render(
        <ConfirmDialog
          trigger={<button>Delete</button>}
          title="Confirm Delete"
          description="Are you sure?"
          onConfirm={vi.fn()}
        />
      );

      await user.click(screen.getByRole("button", { name: /delete/i }));

      expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
    });

    it("shows custom confirm button text", async () => {
      render(
        <ConfirmDialog
          trigger={<button>Delete</button>}
          title="Confirm Delete"
          description="Are you sure?"
          confirmText="Delete Forever"
          onConfirm={vi.fn()}
        />
      );

      await user.click(screen.getByRole("button", { name: /delete/i }));

      expect(screen.getByRole("button", { name: "Delete Forever" })).toBeInTheDocument();
    });

    it("shows default cancel button text", async () => {
      render(
        <ConfirmDialog
          trigger={<button>Delete</button>}
          title="Confirm Delete"
          description="Are you sure?"
          onConfirm={vi.fn()}
        />
      );

      await user.click(screen.getByRole("button", { name: /delete/i }));

      expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    });

    it("shows custom cancel button text", async () => {
      render(
        <ConfirmDialog
          trigger={<button>Delete</button>}
          title="Confirm Delete"
          description="Are you sure?"
          cancelText="Nevermind"
          onConfirm={vi.fn()}
        />
      );

      await user.click(screen.getByRole("button", { name: /delete/i }));

      expect(screen.getByRole("button", { name: "Nevermind" })).toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("calls onConfirm when confirm button is clicked", async () => {
      const onConfirm = vi.fn();

      render(
        <ConfirmDialog
          trigger={<button>Delete</button>}
          title="Confirm Delete"
          description="Are you sure?"
          onConfirm={onConfirm}
        />
      );

      await user.click(screen.getByRole("button", { name: /delete/i }));
      await user.click(screen.getByRole("button", { name: "Confirm" }));

      expect(onConfirm).toHaveBeenCalledOnce();
    });

    it("does not call onConfirm when cancel button is clicked", async () => {
      const onConfirm = vi.fn();

      render(
        <ConfirmDialog
          trigger={<button>Delete</button>}
          title="Confirm Delete"
          description="Are you sure?"
          onConfirm={onConfirm}
        />
      );

      await user.click(screen.getByRole("button", { name: /delete/i }));
      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(onConfirm).not.toHaveBeenCalled();
    });

    it("closes dialog when cancel is clicked", async () => {
      render(
        <ConfirmDialog
          trigger={<button>Delete</button>}
          title="Confirm Delete"
          description="Are you sure?"
          onConfirm={vi.fn()}
        />
      );

      await user.click(screen.getByRole("button", { name: /delete/i }));
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Cancel" }));

      await waitFor(() => {
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      });
    });
  });

  describe("async onConfirm", () => {
    it("shows loading state during async confirm", async () => {
      const onConfirm = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(
        <ConfirmDialog
          trigger={<button>Delete</button>}
          title="Confirm Delete"
          description="Are you sure?"
          onConfirm={onConfirm}
        />
      );

      await user.click(screen.getByRole("button", { name: /delete/i }));
      await user.click(screen.getByRole("button", { name: "Confirm" }));

      // Button should be disabled during loading
      expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
    });

    it("disables cancel button during async confirm", async () => {
      const onConfirm = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(
        <ConfirmDialog
          trigger={<button>Delete</button>}
          title="Confirm Delete"
          description="Are you sure?"
          onConfirm={onConfirm}
        />
      );

      await user.click(screen.getByRole("button", { name: /delete/i }));
      await user.click(screen.getByRole("button", { name: "Confirm" }));

      expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    });

    it("re-enables buttons after async confirm completes", async () => {
      const onConfirm = vi.fn().mockResolvedValue(undefined);

      render(
        <ConfirmDialog
          trigger={<button>Delete</button>}
          title="Confirm Delete"
          description="Are you sure?"
          onConfirm={onConfirm}
        />
      );

      await user.click(screen.getByRole("button", { name: /delete/i }));
      await user.click(screen.getByRole("button", { name: "Confirm" }));

      await waitFor(() => {
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      });
    });

    it("handles async errors gracefully", async () => {
      const onConfirm = vi.fn().mockRejectedValue(new Error("Failed"));
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

      render(
        <ConfirmDialog
          trigger={<button>Delete</button>}
          title="Confirm Delete"
          description="Are you sure?"
          onConfirm={onConfirm}
        />
      );

      await user.click(screen.getByRole("button", { name: /delete/i }));
      await user.click(screen.getByRole("button", { name: "Confirm" }));

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });
  });

  describe("button variants", () => {
    it("uses destructive variant by default", async () => {
      render(
        <ConfirmDialog
          trigger={<button>Delete</button>}
          title="Confirm Delete"
          description="Are you sure?"
          onConfirm={vi.fn()}
        />
      );

      await user.click(screen.getByRole("button", { name: /delete/i }));

      const confirmButton = screen.getByRole("button", { name: "Confirm" });
      expect(confirmButton.className).toContain("destructive");
    });

    it("uses custom variant when specified", async () => {
      render(
        <ConfirmDialog
          trigger={<button>Delete</button>}
          title="Confirm Delete"
          description="Are you sure?"
          confirmVariant="default"
          onConfirm={vi.fn()}
        />
      );

      await user.click(screen.getByRole("button", { name: /delete/i }));

      const confirmButton = screen.getByRole("button", { name: "Confirm" });
      expect(confirmButton.className).not.toContain("destructive");
    });
  });

  describe("disabled state", () => {
    it("disables trigger when disabled prop is true", () => {
      render(
        <ConfirmDialog
          trigger={<button>Delete</button>}
          title="Confirm Delete"
          description="Are you sure?"
          onConfirm={vi.fn()}
          disabled
        />
      );

      expect(screen.getByRole("button", { name: /delete/i })).toBeDisabled();
    });

    it("enables trigger when disabled prop is false", () => {
      render(
        <ConfirmDialog
          trigger={<button>Delete</button>}
          title="Confirm Delete"
          description="Are you sure?"
          onConfirm={vi.fn()}
          disabled={false}
        />
      );

      expect(screen.getByRole("button", { name: /delete/i })).not.toBeDisabled();
    });

    it("enables trigger when disabled prop is undefined", () => {
      render(
        <ConfirmDialog
          trigger={<button>Delete</button>}
          title="Confirm Delete"
          description="Are you sure?"
          onConfirm={vi.fn()}
        />
      );

      expect(screen.getByRole("button", { name: /delete/i })).not.toBeDisabled();
    });
  });

  describe("accessibility", () => {
    it("has accessible dialog role", async () => {
      render(
        <ConfirmDialog
          trigger={<button>Delete</button>}
          title="Confirm Delete"
          description="Are you sure?"
          onConfirm={vi.fn()}
        />
      );

      await user.click(screen.getByRole("button", { name: /delete/i }));

      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });

    it("has accessible title", async () => {
      render(
        <ConfirmDialog
          trigger={<button>Delete</button>}
          title="Confirm Delete"
          description="Are you sure?"
          onConfirm={vi.fn()}
        />
      );

      await user.click(screen.getByRole("button", { name: /delete/i }));

      const dialog = screen.getByRole("alertdialog");
      expect(dialog).toHaveAccessibleName("Confirm Delete");
    });

    it("has accessible description", async () => {
      render(
        <ConfirmDialog
          trigger={<button>Delete</button>}
          title="Confirm Delete"
          description="This action cannot be undone."
          onConfirm={vi.fn()}
        />
      );

      await user.click(screen.getByRole("button", { name: /delete/i }));

      const dialog = screen.getByRole("alertdialog");
      expect(dialog).toHaveAccessibleDescription("This action cannot be undone.");
    });
  });
});
