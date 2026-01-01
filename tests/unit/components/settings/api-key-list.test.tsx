import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock server action
vi.mock("@/actions/api-keys", () => ({
  revokeApiKey: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

import { ApiKeyList } from "@/components/settings/api-key-list";
import { revokeApiKey } from "@/actions/api-keys";

describe("ApiKeyList", () => {
  const user = userEvent.setup();

  const mockApiKeys = [
    {
      id: "1",
      name: "Production Key",
      keyPrefix: "sk_live_abc",
      environment: "live" as const,
      createdAt: new Date("2024-01-01"),
      lastUsedAt: new Date("2024-01-15"),
      usageCount: 42,
      revokedAt: null,
    },
    {
      id: "2",
      name: "Test Key",
      keyPrefix: "sk_test_xyz",
      environment: "test" as const,
      createdAt: new Date("2024-01-10"),
      lastUsedAt: null,
      usageCount: 0,
      revokedAt: null,
    },
    {
      id: "3",
      name: "Revoked Key",
      keyPrefix: "sk_live_old",
      environment: "live" as const,
      createdAt: new Date("2024-01-05"),
      lastUsedAt: new Date("2024-01-08"),
      usageCount: 10,
      revokedAt: new Date("2024-01-20"),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty state when no API keys", () => {
    render(<ApiKeyList apiKeys={[]} />);

    expect(screen.getByText(/no api keys yet/i)).toBeInTheDocument();
  });

  it("renders table with all API keys", () => {
    render(<ApiKeyList apiKeys={mockApiKeys} />);

    expect(screen.getByText("Production Key")).toBeInTheDocument();
    expect(screen.getByText("Test Key")).toBeInTheDocument();
    expect(screen.getByText("Revoked Key")).toBeInTheDocument();
  });

  it("displays key prefix for each key", () => {
    render(<ApiKeyList apiKeys={mockApiKeys} />);

    expect(screen.getByText(/sk_live_abc/i)).toBeInTheDocument();
    expect(screen.getByText(/sk_test_xyz/i)).toBeInTheDocument();
  });

  it("displays environment badge for each key", () => {
    render(<ApiKeyList apiKeys={mockApiKeys} />);

    // Should show environment badges - use getAllByText since "live" appears twice
    const liveBadges = screen.getAllByText("live");
    expect(liveBadges.length).toBeGreaterThan(0);

    const testBadges = screen.getAllByText("test");
    expect(testBadges.length).toBeGreaterThan(0);
  });

  it("displays created date for each key", () => {
    render(<ApiKeyList apiKeys={mockApiKeys} />);

    // Dates should be formatted and displayed (formatDate uses full month names)
    expect(screen.getByText("January 1, 2024")).toBeInTheDocument();
    expect(screen.getByText("January 10, 2024")).toBeInTheDocument();
  });

  it("displays last used date when available", () => {
    render(<ApiKeyList apiKeys={mockApiKeys} />);

    expect(screen.getByText("January 15, 2024")).toBeInTheDocument();
  });

  it("displays never used when lastUsedAt is null", () => {
    render(<ApiKeyList apiKeys={mockApiKeys} />);

    expect(screen.getByText(/never/i)).toBeInTheDocument();
  });

  it("shows revoke button for active keys", () => {
    render(<ApiKeyList apiKeys={mockApiKeys} />);

    const revokeButtons = screen.getAllByRole("button", { name: /revoke/i });
    // Should have 2 revoke buttons (for the 2 active keys)
    expect(revokeButtons).toHaveLength(2);
  });

  it("shows revoked badge instead of revoke button for revoked keys", () => {
    render(<ApiKeyList apiKeys={mockApiKeys} />);

    // Check for the "Revoked" badge (appears in the table for revoked keys)
    const revokedBadges = screen.getAllByText("Revoked");
    expect(revokedBadges.length).toBeGreaterThan(0);
  });

  it("opens confirmation dialog when revoke is clicked", async () => {
    render(<ApiKeyList apiKeys={mockApiKeys} />);

    const revokeButtons = screen.getAllByRole("button", { name: /revoke/i });
    const revokeButton = revokeButtons[0];
    if (!revokeButton) throw new Error("Revoke button not found");
    await user.click(revokeButton);

    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });
  });

  it("calls revokeApiKey when confirmation is accepted", async () => {
    vi.mocked(revokeApiKey).mockResolvedValue({ success: true });

    render(<ApiKeyList apiKeys={mockApiKeys} />);

    const revokeButtons = screen.getAllByRole("button", { name: /revoke/i });
    const revokeButton = revokeButtons[0];
    if (!revokeButton) throw new Error("Revoke button not found");
    await user.click(revokeButton);

    // Find and click the confirm button in the dialog
    const confirmButton = await screen.findByRole("button", { name: /confirm|continue|yes/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(revokeApiKey).toHaveBeenCalledWith({ id: "1" });
    });
  });

  it("does not call revokeApiKey when confirmation is cancelled", async () => {
    render(<ApiKeyList apiKeys={mockApiKeys} />);

    const revokeButtons = screen.getAllByRole("button", { name: /revoke/i });
    const revokeButton = revokeButtons[0];
    if (!revokeButton) throw new Error("Revoke button not found");
    await user.click(revokeButton);

    // Find and click the cancel button in the dialog
    const cancelButton = await screen.findByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(revokeApiKey).not.toHaveBeenCalled();
  });

  it("closes dialog after successful revocation", async () => {
    vi.mocked(revokeApiKey).mockResolvedValue({ success: true });

    render(<ApiKeyList apiKeys={mockApiKeys} />);

    const revokeButtons = screen.getAllByRole("button", { name: /revoke/i });
    const revokeButton = revokeButtons[0];
    if (!revokeButton) throw new Error("Revoke button not found");
    await user.click(revokeButton);

    const confirmButton = await screen.findByRole("button", { name: /confirm|continue|yes/i });
    await user.click(confirmButton);

    await waitFor(() => {
      // Dialog should close after successful revocation
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
  });

  it("closes dialog after failed revocation", async () => {
    vi.mocked(revokeApiKey).mockResolvedValue({
      success: false,
      error: "Failed to revoke API key",
    });

    render(<ApiKeyList apiKeys={mockApiKeys} />);

    const revokeButtons = screen.getAllByRole("button", { name: /revoke/i });
    const revokeButton = revokeButtons[0];
    if (!revokeButton) throw new Error("Revoke button not found");
    await user.click(revokeButton);

    const confirmButton = await screen.findByRole("button", { name: /confirm|continue|yes/i });
    await user.click(confirmButton);

    await waitFor(() => {
      // Dialog should close even after error
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
  });

  it("renders accessible table structure", () => {
    render(<ApiKeyList apiKeys={mockApiKeys} />);

    const table = screen.getByRole("table");
    expect(table).toBeInTheDocument();

    // Check for table headers
    expect(screen.getByRole("columnheader", { name: /name/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /key/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /environment/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /created/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /last used/i })).toBeInTheDocument();
  });

  it("has accessible revoke buttons with aria-label", () => {
    render(<ApiKeyList apiKeys={mockApiKeys} />);

    const revokeButtons = screen.getAllByRole("button", { name: /revoke/i });
    revokeButtons.forEach((button) => {
      expect(button).toHaveAccessibleName();
    });
  });
});
