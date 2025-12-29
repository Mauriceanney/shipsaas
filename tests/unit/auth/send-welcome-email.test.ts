import { describe, expect, it, vi, beforeEach } from "vitest";

// Use vi.hoisted to properly hoist the mock functions
const { mockAuth, mockFindUnique, mockUpdate, mockSendWelcomeEmail } =
  vi.hoisted(() => ({
    mockAuth: vi.fn(),
    mockFindUnique: vi.fn(),
    mockUpdate: vi.fn(),
    mockSendWelcomeEmail: vi.fn(),
  }));

// Mock the auth module
vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

// Mock the db module
vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
  },
}));

// Mock the email module
vi.mock("@/lib/email", () => ({
  sendWelcomeEmail: mockSendWelcomeEmail,
}));

// Import after mocking
import { checkAndSendWelcomeEmail } from "@/actions/auth/send-welcome-email";

describe("checkAndSendWelcomeEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendWelcomeEmail.mockResolvedValue({
      success: true,
      messageId: "test-message-id",
    });
  });

  it("sends welcome email for OAuth user who hasn't received one", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-123" },
    });

    mockFindUnique.mockResolvedValue({
      id: "user-123",
      email: "oauth@example.com",
      name: "OAuth User",
      welcomeEmailSent: false,
    });

    await checkAndSendWelcomeEmail();

    expect(mockSendWelcomeEmail).toHaveBeenCalledTimes(1);
    expect(mockSendWelcomeEmail).toHaveBeenCalledWith(
      "oauth@example.com",
      "OAuth User"
    );
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "user-123" },
      data: { welcomeEmailSent: true },
    });
  });

  it("uses fallback name when user has no name", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-456" },
    });

    mockFindUnique.mockResolvedValue({
      id: "user-456",
      email: "noname@example.com",
      name: null,
      welcomeEmailSent: false,
    });

    await checkAndSendWelcomeEmail();

    expect(mockSendWelcomeEmail).toHaveBeenCalledWith(
      "noname@example.com",
      "there"
    );
  });

  it("does not send email if user already received welcome email", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-789" },
    });

    mockFindUnique.mockResolvedValue({
      id: "user-789",
      email: "existing@example.com",
      name: "Existing User",
      welcomeEmailSent: true, // Already sent
    });

    await checkAndSendWelcomeEmail();

    expect(mockSendWelcomeEmail).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("does not send email if user is not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    await checkAndSendWelcomeEmail();

    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockSendWelcomeEmail).not.toHaveBeenCalled();
  });

  it("does not send email if user has no email", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-no-email" },
    });

    mockFindUnique.mockResolvedValue({
      id: "user-no-email",
      email: null,
      name: "No Email User",
      welcomeEmailSent: false,
    });

    await checkAndSendWelcomeEmail();

    expect(mockSendWelcomeEmail).not.toHaveBeenCalled();
  });

  it("handles email sending failure gracefully", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-fail" },
    });

    mockFindUnique.mockResolvedValue({
      id: "user-fail",
      email: "fail@example.com",
      name: "Fail User",
      welcomeEmailSent: false,
    });

    mockSendWelcomeEmail.mockRejectedValue(new Error("SMTP connection failed"));

    // Should not throw
    await expect(checkAndSendWelcomeEmail()).resolves.not.toThrow();
  });

  it("does not throw when user not found in database", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-not-found" },
    });

    mockFindUnique.mockResolvedValue(null);

    // Should not throw
    await expect(checkAndSendWelcomeEmail()).resolves.not.toThrow();
    expect(mockSendWelcomeEmail).not.toHaveBeenCalled();
  });
});
