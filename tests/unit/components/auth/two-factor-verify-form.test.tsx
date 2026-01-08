import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/navigation with custom implementation
const mockPush = vi.fn();
const mockRefresh = vi.fn();
let mockSearchParamsData: Map<string, string> = new Map();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: (key: string) => mockSearchParamsData.get(key) ?? null,
  }),
  usePathname: () => "/",
  redirect: vi.fn(),
}));

// Mock the action
const mockVerifyAction = vi.fn();
vi.mock("@/actions/auth/two-factor", () => ({
  verifyTwoFactorAction: (input: unknown) => mockVerifyAction(input),
}));

import { TwoFactorVerifyForm } from "@/components/auth/two-factor-verify-form";

describe("TwoFactorVerifyForm", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParamsData = new Map();
  });

  describe("when userId is missing", () => {
    it("shows invalid request error", () => {
      render(<TwoFactorVerifyForm />);

      expect(screen.getByText("Invalid verification request.")).toBeInTheDocument();
      expect(screen.getByText("Return to login")).toBeInTheDocument();
    });
  });

  describe("when userId is present", () => {
    beforeEach(() => {
      mockSearchParamsData.set("userId", "user-1");
    });

    it("renders the verification form", () => {
      render(<TwoFactorVerifyForm />);

      expect(screen.getByLabelText("Authentication Code")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /verify/i })).toBeInTheDocument();
      expect(screen.getByText("Use a backup code")).toBeInTheDocument();
    });

    it("filters non-digit characters for TOTP code", async () => {
      render(<TwoFactorVerifyForm />);

      const input = screen.getByLabelText("Authentication Code");
      await user.type(input, "12ab34cd56");

      expect(input).toHaveValue("123456");
    });

    it("toggles to backup code mode", async () => {
      render(<TwoFactorVerifyForm />);

      await user.click(screen.getByText("Use a backup code"));

      expect(screen.getByLabelText("Backup Code")).toBeInTheDocument();
      expect(screen.getByText("Use authenticator app instead")).toBeInTheDocument();
    });

    it("allows alphanumeric and hyphens for backup code", async () => {
      render(<TwoFactorVerifyForm />);

      await user.click(screen.getByText("Use a backup code"));
      const input = screen.getByLabelText("Backup Code");
      await user.type(input, "abcd-1234");

      expect(input).toHaveValue("ABCD-1234");
    });

    it("clears code when switching modes", async () => {
      render(<TwoFactorVerifyForm />);

      const input = screen.getByLabelText("Authentication Code");
      await user.type(input, "123456");
      expect(input).toHaveValue("123456");

      await user.click(screen.getByText("Use a backup code"));

      const backupInput = screen.getByLabelText("Backup Code");
      expect(backupInput).toHaveValue("");
    });

    it("shows remember device checkbox", () => {
      render(<TwoFactorVerifyForm />);

      expect(screen.getByText(/remember this device/i)).toBeInTheDocument();
    });

    it("submits form with correct data", async () => {
      mockVerifyAction.mockResolvedValue({ success: true });

      render(<TwoFactorVerifyForm />);

      const input = screen.getByLabelText("Authentication Code");
      await user.type(input, "123456");
      await user.click(screen.getByRole("button", { name: /verify/i }));

      await waitFor(() => {
        expect(mockVerifyAction).toHaveBeenCalledWith({
          code: "123456",
          userId: "user-1",
          rememberDevice: false,
        });
      });
    });

    it("redirects on successful verification", async () => {
      mockVerifyAction.mockResolvedValue({ success: true });

      render(<TwoFactorVerifyForm />);

      await user.type(screen.getByLabelText("Authentication Code"), "123456");
      await user.click(screen.getByRole("button", { name: /verify/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/dashboard");
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it("uses custom callbackUrl when provided", async () => {
      mockSearchParamsData.set("callbackUrl", "/settings");
      mockVerifyAction.mockResolvedValue({ success: true });

      render(<TwoFactorVerifyForm />);

      await user.type(screen.getByLabelText("Authentication Code"), "123456");
      await user.click(screen.getByRole("button", { name: /verify/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/settings");
      });
    });


    it("has link to return to login", () => {
      render(<TwoFactorVerifyForm />);

      const link = screen.getByText("Cancel and return to login");
      expect(link).toHaveAttribute("href", "/login");
    });
  });
});
