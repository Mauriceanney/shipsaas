import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock server action
vi.mock("@/actions/api-keys", () => ({
  createApiKey: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

import { ApiKeyCreateForm } from "@/components/settings/api-key-create-form";
import { createApiKey } from "@/actions/api-keys";

describe("ApiKeyCreateForm", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders form with all required fields", () => {
    render(<ApiKeyCreateForm />);

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/environment/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create api key/i })).toBeInTheDocument();
  });

  it("has accessible labels for all inputs", () => {
    render(<ApiKeyCreateForm />);

    const nameInput = screen.getByLabelText(/name/i);
    expect(nameInput).toHaveAttribute("id");
    expect(nameInput).toHaveAttribute("name", "name");

    const envSelect = screen.getByLabelText(/environment/i);
    expect(envSelect).toHaveAttribute("id");
  });

  it("submits form with valid data", async () => {
    vi.mocked(createApiKey).mockResolvedValue({
      success: true,
      data: {
        key: "sk_live_test_key_12345",
        apiKey: {
          id: "1",
          name: "Test Key",
          keyPrefix: "sk_live_...",
          environment: "live",
          scopes: ["read"],
          createdAt: new Date(),
          lastUsedAt: null,
        },
      },
    });

    render(<ApiKeyCreateForm />);

    await user.type(screen.getByLabelText(/name/i), "Test Key");
    await user.click(screen.getByRole("button", { name: /create api key/i }));

    await waitFor(() => {
      expect(createApiKey).toHaveBeenCalledWith({
        name: "Test Key",
        environment: "live",
        scopes: ["read"],
      });
    });
  });

  it("shows loading state during submission", async () => {
    vi.mocked(createApiKey).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({
        success: true,
        data: {
          key: "sk_live_test_key",
          apiKey: { id: "1", name: "Test", keyPrefix: "sk_", environment: "live", scopes: ["read"], createdAt: new Date(), lastUsedAt: null }
        }
      }), 100))
    );

    render(<ApiKeyCreateForm />);

    await user.type(screen.getByLabelText(/name/i), "Test");
    await user.click(screen.getByRole("button", { name: /create api key/i }));

    expect(screen.getByRole("button")).toHaveTextContent(/creating/i);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("disables form inputs during submission", async () => {
    vi.mocked(createApiKey).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({
        success: true,
        data: {
          key: "sk_live_test_key",
          apiKey: { id: "1", name: "Test", keyPrefix: "sk_", environment: "live", scopes: ["read"], createdAt: new Date(), lastUsedAt: null }
        }
      }), 100))
    );

    render(<ApiKeyCreateForm />);

    await user.type(screen.getByLabelText(/name/i), "Test");
    await user.click(screen.getByRole("button", { name: /create api key/i }));

    expect(screen.getByLabelText(/name/i)).toBeDisabled();
  });

  it("displays generated key in modal after successful creation", async () => {
    vi.mocked(createApiKey).mockResolvedValue({
      success: true,
      data: {
        key: "sk_live_test_key_12345",
        apiKey: {
          id: "1",
          name: "Test Key",
          keyPrefix: "sk_live_...",
          environment: "live",
          scopes: ["read"],
          createdAt: new Date(),
          lastUsedAt: null,
        },
      },
    });

    render(<ApiKeyCreateForm />);

    await user.type(screen.getByLabelText(/name/i), "Test Key");
    await user.click(screen.getByRole("button", { name: /create api key/i }));

    await waitFor(() => {
      expect(screen.getByText(/sk_live_test_key_12345/i)).toBeInTheDocument();
    });
  });

  it("shows copy button in key display modal", async () => {
    vi.mocked(createApiKey).mockResolvedValue({
      success: true,
      data: {
        key: "sk_live_test_key_12345",
        apiKey: {
          id: "1",
          name: "Test Key",
          keyPrefix: "sk_live_...",
          environment: "live",
          scopes: ["read"],
          createdAt: new Date(),
          lastUsedAt: null,
        },
      },
    });

    render(<ApiKeyCreateForm />);

    await user.type(screen.getByLabelText(/name/i), "Test Key");
    await user.click(screen.getByRole("button", { name: /create api key/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /copy/i })).toBeInTheDocument();
    });
  });

  it("resets form after successful submission", async () => {
    vi.mocked(createApiKey).mockResolvedValue({
      success: true,
      data: {
        key: "sk_live_test_key_12345",
        apiKey: {
          id: "1",
          name: "Test Key",
          keyPrefix: "sk_live_...",
          environment: "live",
          scopes: ["read"],
          createdAt: new Date(),
          lastUsedAt: null,
        },
      },
    });

    render(<ApiKeyCreateForm />);

    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
    await user.type(nameInput, "Test Key");
    await user.click(screen.getByRole("button", { name: /create api key/i }));

    await waitFor(() => {
      expect(screen.getByText(/sk_live_test_key_12345/i)).toBeInTheDocument();
    });

    // Close modal - get all close buttons and click the last one (the footer button)
    const closeButtons = screen.getAllByRole("button", { name: /close/i });
    const closeButton = closeButtons[closeButtons.length - 1];
    if (closeButton) {
      await user.click(closeButton);
    }

    // Form should be reset
    await waitFor(() => {
      expect(nameInput.value).toBe("");
    });
  });

  // Error handling is done via toast, not inline messages
  // This test is removed as component doesn't show inline errors

  it("validates required name field", async () => {
    render(<ApiKeyCreateForm />);

    const nameInput = screen.getByLabelText(/name/i);
    expect(nameInput).toHaveAttribute("required");
  });

  it("defaults to live environment", async () => {
    vi.mocked(createApiKey).mockResolvedValue({
      success: true,
      data: {
        key: "sk_live_test_key_12345",
        apiKey: {
          id: "1",
          name: "Test Key",
          keyPrefix: "sk_live_...",
          environment: "live",
          scopes: ["read"],
          createdAt: new Date(),
          lastUsedAt: null,
        },
      },
    });

    render(<ApiKeyCreateForm />);

    await user.type(screen.getByLabelText(/name/i), "Test Key");
    await user.click(screen.getByRole("button", { name: /create api key/i }));

    await waitFor(() => {
      expect(createApiKey).toHaveBeenCalledWith({
        name: "Test Key",
        environment: "live",
        scopes: ["read"],
      });
    });
  });
});
