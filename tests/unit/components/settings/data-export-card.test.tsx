/**
 * TDD: DataExportCard Component Tests
 */

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { DataExportCard } from "@/components/settings/data-export-card";
import { requestDataExport } from "@/actions/gdpr";

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

// Mock the GDPR action
vi.mock("@/actions/gdpr", () => ({
  requestDataExport: vi.fn(),
}));

const mockRequestDataExport = vi.mocked(requestDataExport);

describe("DataExportCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders card with title and description", () => {
      render(<DataExportCard />);

      expect(screen.getByText("Export Your Data")).toBeInTheDocument();
      expect(
        screen.getByText(/Download a copy of your personal data in JSON format/)
      ).toBeInTheDocument();
    });

    it("renders export button", () => {
      render(<DataExportCard />);

      expect(
        screen.getByRole("button", { name: /export my data/i })
      ).toBeInTheDocument();
    });

    it("renders list of data included in export", () => {
      render(<DataExportCard />);

      expect(screen.getByText("Your export will include:")).toBeInTheDocument();
      expect(
        screen.getByText("Account information (name, email)")
      ).toBeInTheDocument();
      expect(screen.getByText("Connected accounts")).toBeInTheDocument();
      expect(screen.getByText("Subscription details")).toBeInTheDocument();
    });

    it("renders download icon in button", () => {
      const { container } = render(<DataExportCard />);

      const button = screen.getByRole("button", { name: /export my data/i });
      const icon = button.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("button is enabled initially", () => {
      render(<DataExportCard />);

      const button = screen.getByRole("button", { name: /export my data/i });
      expect(button).not.toBeDisabled();
    });

    it("does not call toast initially", () => {
      render(<DataExportCard />);

      expect(mockToast.success).not.toHaveBeenCalled();
      expect(mockToast.error).not.toHaveBeenCalled();
    });
  });

  describe("Loading State", () => {
    it("shows loading state when exporting", async () => {
      let resolvePromise: (value: { success: boolean }) => void;
      const pendingPromise = new Promise<{ success: boolean }>((resolve) => {
        resolvePromise = resolve;
      });

      mockRequestDataExport.mockReturnValueOnce(pendingPromise);

      render(<DataExportCard />);

      const button = screen.getByRole("button", { name: /export my data/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText("Preparing Export...")).toBeInTheDocument();
      });

      // Resolve and wait for state update to cleanup
      await act(async () => {
        resolvePromise!({ success: true });
      });
    });

    it("disables button while loading", async () => {
      let resolvePromise: (value: { success: boolean }) => void;
      const pendingPromise = new Promise<{ success: boolean }>((resolve) => {
        resolvePromise = resolve;
      });

      mockRequestDataExport.mockReturnValueOnce(pendingPromise);

      render(<DataExportCard />);

      const button = screen.getByRole("button", { name: /export my data/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(button).toBeDisabled();
      });

      // Resolve and wait for state update to cleanup
      await act(async () => {
        resolvePromise!({ success: true });
      });
    });

    it("shows loading spinner icon while loading", async () => {
      let resolvePromise: (value: { success: boolean }) => void;
      const pendingPromise = new Promise<{ success: boolean }>((resolve) => {
        resolvePromise = resolve;
      });

      mockRequestDataExport.mockReturnValueOnce(pendingPromise);

      render(<DataExportCard />);

      const button = screen.getByRole("button", { name: /export my data/i });
      fireEvent.click(button);

      await waitFor(() => {
        const spinner = button.querySelector("svg.animate-spin");
        expect(spinner).toBeInTheDocument();
      });

      // Resolve and wait for state update to cleanup
      await act(async () => {
        resolvePromise!({ success: true });
      });
    });
  });

  describe("Success State", () => {
    it("shows success toast on successful export", async () => {
      mockRequestDataExport.mockResolvedValueOnce({
        success: true,
        requestId: "req_123",
      });

      render(<DataExportCard />);

      const button = screen.getByRole("button", { name: /export my data/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith(
          "Your data export has been initiated. Check back in a few minutes to download."
        );
      });
    });

    it("re-enables button after successful export", async () => {
      mockRequestDataExport.mockResolvedValueOnce({
        success: true,
        requestId: "req_123",
      });

      render(<DataExportCard />);

      const button = screen.getByRole("button", { name: /export my data/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(button).not.toBeDisabled();
        expect(screen.getByText(/export my data/i)).toBeInTheDocument();
      });
    });
  });

  describe("Error State", () => {
    it("shows error toast on failed export", async () => {
      mockRequestDataExport.mockResolvedValueOnce({
        success: false,
        error: "A data export request is already in progress",
      });

      render(<DataExportCard />);

      const button = screen.getByRole("button", { name: /export my data/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          "A data export request is already in progress"
        );
      });
    });

    it("shows default error toast when no error provided", async () => {
      mockRequestDataExport.mockResolvedValueOnce({
        success: false,
      });

      render(<DataExportCard />);

      const button = screen.getByRole("button", { name: /export my data/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith("Failed to request data export");
      });
    });

    it("re-enables button after failed export", async () => {
      mockRequestDataExport.mockResolvedValueOnce({
        success: false,
        error: "Export failed",
      });

      render(<DataExportCard />);

      const button = screen.getByRole("button", { name: /export my data/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(button).not.toBeDisabled();
        expect(screen.getByText(/export my data/i)).toBeInTheDocument();
      });
    });
  });

  describe("Unexpected Errors", () => {
    it("handles unexpected errors gracefully", async () => {
      mockRequestDataExport.mockRejectedValueOnce(new Error("Network error"));

      render(<DataExportCard />);

      const button = screen.getByRole("button", { name: /export my data/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith("An unexpected error occurred");
      });
    });

    it("handles non-Error exceptions gracefully", async () => {
      mockRequestDataExport.mockRejectedValueOnce("String error");

      render(<DataExportCard />);

      const button = screen.getByRole("button", { name: /export my data/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith("An unexpected error occurred");
      });
    });

    it("re-enables button after unexpected error", async () => {
      mockRequestDataExport.mockRejectedValueOnce(new Error("Network error"));

      render(<DataExportCard />);

      const button = screen.getByRole("button", { name: /export my data/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(button).not.toBeDisabled();
        expect(screen.getByText(/export my data/i)).toBeInTheDocument();
      });
    });
  });

  describe("Multiple Exports", () => {
    it("shows toast for each export attempt", async () => {
      mockRequestDataExport.mockResolvedValueOnce({
        success: true,
        requestId: "req_123",
      });

      render(<DataExportCard />);

      const button = screen.getByRole("button", { name: /export my data/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith(
          "Your data export has been initiated. Check back in a few minutes to download."
        );
      });

      // Click again - should show new toast
      mockRequestDataExport.mockResolvedValueOnce({
        success: false,
        error: "New error",
      });

      fireEvent.click(button);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith("New error");
      });
    });
  });

  describe("Action Integration", () => {
    it("calls requestDataExport when button is clicked", async () => {
      mockRequestDataExport.mockResolvedValueOnce({
        success: true,
        requestId: "req_123",
      });

      render(<DataExportCard />);

      const button = screen.getByRole("button", { name: /export my data/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockRequestDataExport).toHaveBeenCalledTimes(1);
      });
    });

    it("calls requestDataExport each time button is clicked", async () => {
      mockRequestDataExport
        .mockResolvedValueOnce({ success: true, requestId: "req_1" })
        .mockResolvedValueOnce({ success: true, requestId: "req_2" });

      render(<DataExportCard />);

      const button = screen.getByRole("button", { name: /export my data/i });

      fireEvent.click(button);
      await waitFor(() => {
        expect(mockRequestDataExport).toHaveBeenCalledTimes(1);
      });

      fireEvent.click(button);
      await waitFor(() => {
        expect(mockRequestDataExport).toHaveBeenCalledTimes(2);
      });
    });
  });
});
