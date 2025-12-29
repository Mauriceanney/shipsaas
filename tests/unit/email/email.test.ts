import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted to properly hoist the mock function
const { mockSend, mockResetProvider } = vi.hoisted(() => ({
  mockSend: vi.fn(),
  mockResetProvider: vi.fn(),
}));

// Mock the email client module
vi.mock("@/lib/email/client", () => ({
  getEmailProvider: () => ({
    name: "mock",
    send: mockSend,
  }),
  resetEmailProvider: mockResetProvider,
}));

// Import after mocking
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendWelcomeEmail,
  sendSubscriptionConfirmationEmail,
} from "@/lib/email";

describe("Email Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockResolvedValue({ success: true, messageId: "test-message-id" });
  });

  afterEach(() => {
    mockResetProvider();
  });

  describe("sendVerificationEmail", () => {
    it("sends email with correct recipient", async () => {
      await sendVerificationEmail("user@example.com", "test-token");

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "user@example.com",
        })
      );
    });

    it("includes verification token in URL", async () => {
      await sendVerificationEmail("user@example.com", "my-verification-token");

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("my-verification-token"),
          text: expect.stringContaining("my-verification-token"),
        })
      );
    });

    it("includes verify-email path in URL", async () => {
      await sendVerificationEmail("user@example.com", "test-token");

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("/verify-email?token="),
        })
      );
    });

    it("sets correct subject line", async () => {
      await sendVerificationEmail("user@example.com", "test-token");

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining("Verify your email"),
        })
      );
    });

    it("includes from address", async () => {
      await sendVerificationEmail("user@example.com", "test-token");

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: expect.stringContaining("noreply"),
        })
      );
    });

    it("returns success result", async () => {
      const result = await sendVerificationEmail(
        "user@example.com",
        "test-token"
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("test-message-id");
    });
  });

  describe("sendPasswordResetEmail", () => {
    it("sends email with correct recipient", async () => {
      await sendPasswordResetEmail("user@example.com", "reset-token");

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "user@example.com",
        })
      );
    });

    it("includes reset token in URL", async () => {
      await sendPasswordResetEmail("user@example.com", "my-reset-token");

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("my-reset-token"),
          text: expect.stringContaining("my-reset-token"),
        })
      );
    });

    it("includes reset-password path in URL", async () => {
      await sendPasswordResetEmail("user@example.com", "test-token");

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("/reset-password?token="),
        })
      );
    });

    it("sets correct subject line", async () => {
      await sendPasswordResetEmail("user@example.com", "test-token");

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining("Reset your password"),
        })
      );
    });

    it("mentions 1 hour expiry in email", async () => {
      await sendPasswordResetEmail("user@example.com", "test-token");

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("1 hour"),
          text: expect.stringContaining("1 hour"),
        })
      );
    });
  });

  describe("sendPasswordChangedEmail", () => {
    it("sends email with correct recipient", async () => {
      await sendPasswordChangedEmail("user@example.com");

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "user@example.com",
        })
      );
    });

    it("sets correct subject line", async () => {
      await sendPasswordChangedEmail("user@example.com");

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining("password has been changed"),
        })
      );
    });

    it("includes security warning", async () => {
      await sendPasswordChangedEmail("user@example.com");

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("did not make this change"),
          text: expect.stringContaining("did not make this change"),
        })
      );
    });
  });

  describe("sendWelcomeEmail", () => {
    it("sends email with correct recipient", async () => {
      await sendWelcomeEmail("user@example.com", "John Doe");

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "user@example.com",
        })
      );
    });

    it("includes user name in email", async () => {
      await sendWelcomeEmail("user@example.com", "John Doe");

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("John Doe"),
          text: expect.stringContaining("John Doe"),
        })
      );
    });

    it("sets correct subject line", async () => {
      await sendWelcomeEmail("user@example.com", "John Doe");

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining("Welcome"),
        })
      );
    });

    it("includes login URL", async () => {
      await sendWelcomeEmail("user@example.com", "John Doe");

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("/login"),
        })
      );
    });
  });

  describe("sendSubscriptionConfirmationEmail", () => {
    const subscriptionData = {
      name: "Jane Doe",
      planName: "Pro Plan",
      amount: "$29.00",
      billingCycle: "monthly" as const,
      nextBillingDate: "January 29, 2025",
    };

    it("sends email with correct recipient", async () => {
      await sendSubscriptionConfirmationEmail(
        "user@example.com",
        subscriptionData
      );

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "user@example.com",
        })
      );
    });

    it("includes plan name in email", async () => {
      await sendSubscriptionConfirmationEmail(
        "user@example.com",
        subscriptionData
      );

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("Pro Plan"),
        })
      );
    });

    it("includes amount in email", async () => {
      await sendSubscriptionConfirmationEmail(
        "user@example.com",
        subscriptionData
      );

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("$29.00"),
        })
      );
    });

    it("sets correct subject line", async () => {
      await sendSubscriptionConfirmationEmail(
        "user@example.com",
        subscriptionData
      );

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining("Subscription Confirmed"),
        })
      );
    });

    it("includes manage subscription URL", async () => {
      await sendSubscriptionConfirmationEmail(
        "user@example.com",
        subscriptionData
      );

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("/settings/billing"),
        })
      );
    });
  });

  describe("error handling", () => {
    it("returns error result on send failure", async () => {
      mockSend.mockResolvedValue({
        success: false,
        error: "SMTP connection failed",
      });

      const result = await sendVerificationEmail("user@example.com", "token");

      expect(result.success).toBe(false);
      expect(result.error).toBe("SMTP connection failed");
    });

    it("propagates send errors for verification email", async () => {
      const error = new Error("SMTP connection failed");
      mockSend.mockRejectedValue(error);

      await expect(
        sendVerificationEmail("user@example.com", "token")
      ).rejects.toThrow("SMTP connection failed");
    });

    it("propagates send errors for password reset email", async () => {
      const error = new Error("SMTP connection failed");
      mockSend.mockRejectedValue(error);

      await expect(
        sendPasswordResetEmail("user@example.com", "token")
      ).rejects.toThrow("SMTP connection failed");
    });

    it("propagates send errors for password changed email", async () => {
      const error = new Error("SMTP connection failed");
      mockSend.mockRejectedValue(error);

      await expect(sendPasswordChangedEmail("user@example.com")).rejects.toThrow(
        "SMTP connection failed"
      );
    });
  });
});
