import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock actions
const mockSetupAction = vi.fn();
const mockEnableAction = vi.fn();
const mockDisableAction = vi.fn();

vi.mock("@/actions/auth/two-factor", () => ({
  setupTwoFactorAction: () => mockSetupAction(),
  enableTwoFactorAction: (input: unknown) => mockEnableAction(input),
  disableTwoFactorAction: (input: unknown) => mockDisableAction(input),
}));

import { TwoFactorSettings } from "@/components/settings/two-factor-settings";

describe("TwoFactorSettings", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when 2FA is disabled", () => {
    it("shows enable button", () => {
      render(<TwoFactorSettings isEnabled={false} />);

      expect(screen.getByRole("button", { name: /enable 2fa/i })).toBeInTheDocument();
      expect(screen.getByText("Add an extra layer of security to your account")).toBeInTheDocument();
    });

    it("shows Two-Factor Authentication title", () => {
      render(<TwoFactorSettings isEnabled={false} />);

      expect(screen.getByText("Two-Factor Authentication")).toBeInTheDocument();
    });
  });

  describe("when 2FA is enabled", () => {
    it("shows disable button", () => {
      render(<TwoFactorSettings isEnabled={true} />);

      expect(screen.getByRole("button", { name: /disable 2fa/i })).toBeInTheDocument();
      expect(screen.getByText("Your account is protected with 2FA")).toBeInTheDocument();
    });
  });

  describe("setup flow", () => {
    it("calls setup action when enable button is clicked", async () => {
      mockSetupAction.mockResolvedValue({
        success: true,
        secret: "TESTSECRET123",
        qrCode: "data:image/png;base64,QRCode",
      });

      render(<TwoFactorSettings isEnabled={false} />);

      await user.click(screen.getByRole("button", { name: /enable 2fa/i }));

      await waitFor(() => {
        expect(mockSetupAction).toHaveBeenCalled();
      });
    });

    it("shows error if setup fails", async () => {
      mockSetupAction.mockResolvedValue({
        success: false,
        error: "Setup failed",
      });

      render(<TwoFactorSettings isEnabled={false} />);

      await user.click(screen.getByRole("button", { name: /enable 2fa/i }));

      await waitFor(() => {
        expect(screen.getByText("Setup failed")).toBeInTheDocument();
      });
    });

    it("opens setup dialog with QR code on enable click", async () => {
      mockSetupAction.mockResolvedValue({
        success: true,
        secret: "TESTSECRET123",
        qrCode: "data:image/png;base64,QRCode",
      });

      render(<TwoFactorSettings isEnabled={false} />);

      await user.click(screen.getByRole("button", { name: /enable 2fa/i }));

      await waitFor(() => {
        expect(screen.getByText("Scan QR Code")).toBeInTheDocument();
        expect(screen.getByAltText("2FA QR Code")).toBeInTheDocument();
        expect(screen.getByText("TESTSECRET123")).toBeInTheDocument();
      });
    });

    it("advances to verify step when Continue is clicked", async () => {
      mockSetupAction.mockResolvedValue({
        success: true,
        secret: "TESTSECRET123",
        qrCode: "data:image/png;base64,QRCode",
      });

      render(<TwoFactorSettings isEnabled={false} />);

      await user.click(screen.getByRole("button", { name: /enable 2fa/i }));

      await waitFor(() => {
        expect(screen.getByText("Scan QR Code")).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /continue/i }));

      expect(screen.getByText("Verify Setup")).toBeInTheDocument();
      expect(screen.getByLabelText("Verification Code")).toBeInTheDocument();
    });

    it("enables 2FA with valid code and shows backup codes", async () => {
      mockSetupAction.mockResolvedValue({
        success: true,
        secret: "TESTSECRET123",
        qrCode: "data:image/png;base64,QRCode",
      });
      mockEnableAction.mockResolvedValue({
        success: true,
        backupCodes: ["ABCD-1234", "EFGH-5678"],
      });

      render(<TwoFactorSettings isEnabled={false} />);

      await user.click(screen.getByRole("button", { name: /enable 2fa/i }));

      await waitFor(() => {
        expect(screen.getByText("Scan QR Code")).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /continue/i }));
      await user.type(screen.getByLabelText("Verification Code"), "123456");
      await user.click(screen.getByRole("button", { name: /verify & enable/i }));

      await waitFor(() => {
        expect(screen.getByText("Save Backup Codes")).toBeInTheDocument();
        expect(screen.getByText("ABCD-1234")).toBeInTheDocument();
        expect(screen.getByText("EFGH-5678")).toBeInTheDocument();
      });

      expect(mockEnableAction).toHaveBeenCalledWith({ code: "123456" });
    });

    it("calls enable action and handles error response", async () => {
      mockSetupAction.mockResolvedValue({
        success: true,
        secret: "TESTSECRET123",
        qrCode: "data:image/png;base64,QRCode",
      });
      mockEnableAction.mockResolvedValue({
        success: false,
        error: "Invalid verification code",
      });

      render(<TwoFactorSettings isEnabled={false} />);

      await user.click(screen.getByRole("button", { name: /enable 2fa/i }));

      await waitFor(() => {
        expect(screen.getByText("Scan QR Code")).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /continue/i }));
      await user.type(screen.getByLabelText("Verification Code"), "000000");
      await user.click(screen.getByRole("button", { name: /verify & enable/i }));

      await waitFor(() => {
        expect(mockEnableAction).toHaveBeenCalledWith({ code: "000000" });
      });
    });

    it("filters non-digit input in verification code", async () => {
      mockSetupAction.mockResolvedValue({
        success: true,
        secret: "TESTSECRET123",
        qrCode: "data:image/png;base64,QRCode",
      });

      render(<TwoFactorSettings isEnabled={false} />);

      await user.click(screen.getByRole("button", { name: /enable 2fa/i }));

      await waitFor(() => {
        expect(screen.getByText("Scan QR Code")).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /continue/i }));
      const input = screen.getByLabelText("Verification Code");
      await user.type(input, "12ab34");

      expect(input).toHaveValue("1234");
    });
  });

  describe("disable flow", () => {
    it("opens disable dialog when disable button is clicked", async () => {
      render(<TwoFactorSettings isEnabled={true} />);

      await user.click(screen.getByRole("button", { name: /disable 2fa/i }));

      await waitFor(() => {
        expect(screen.getByText("Disable Two-Factor Authentication")).toBeInTheDocument();
      });
    });

    it("shows verification code input in disable dialog", async () => {
      render(<TwoFactorSettings isEnabled={true} />);

      await user.click(screen.getByRole("button", { name: /disable 2fa/i }));

      await waitFor(() => {
        expect(screen.getByLabelText("Verification Code")).toBeInTheDocument();
      });
    });

    it("shows cancel button in disable dialog", async () => {
      render(<TwoFactorSettings isEnabled={true} />);

      await user.click(screen.getByRole("button", { name: /disable 2fa/i }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
      });
    });
  });
});
