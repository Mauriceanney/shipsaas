import { describe, expect, it, vi, beforeEach } from "vitest";

// Use vi.hoisted to properly hoist the mock function
const { mockSendMail } = vi.hoisted(() => ({
  mockSendMail: vi.fn(),
}));

// Mock nodemailer
vi.mock("nodemailer", () => {
  return {
    default: {
      createTransport: () => ({
        sendMail: mockSendMail,
      }),
    },
  };
});

// Import after mocking
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
} from "@/lib/email";

describe("Email Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendMail.mockResolvedValue({ messageId: "test-message-id" });
  });

  describe("sendVerificationEmail", () => {
    it("sends email with correct recipient", async () => {
      await sendVerificationEmail("user@example.com", "test-token");

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "user@example.com",
        })
      );
    });

    it("includes verification token in URL", async () => {
      await sendVerificationEmail("user@example.com", "my-verification-token");

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("my-verification-token"),
          text: expect.stringContaining("my-verification-token"),
        })
      );
    });

    it("includes verify-email path in URL", async () => {
      await sendVerificationEmail("user@example.com", "test-token");

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("/verify-email?token="),
        })
      );
    });

    it("sets correct subject line", async () => {
      await sendVerificationEmail("user@example.com", "test-token");

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining("Verify your email"),
        })
      );
    });

    it("includes from address", async () => {
      await sendVerificationEmail("user@example.com", "test-token");

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: expect.stringContaining("noreply"),
        })
      );
    });
  });

  describe("sendPasswordResetEmail", () => {
    it("sends email with correct recipient", async () => {
      await sendPasswordResetEmail("user@example.com", "reset-token");

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "user@example.com",
        })
      );
    });

    it("includes reset token in URL", async () => {
      await sendPasswordResetEmail("user@example.com", "my-reset-token");

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("my-reset-token"),
          text: expect.stringContaining("my-reset-token"),
        })
      );
    });

    it("includes reset-password path in URL", async () => {
      await sendPasswordResetEmail("user@example.com", "test-token");

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("/reset-password?token="),
        })
      );
    });

    it("sets correct subject line", async () => {
      await sendPasswordResetEmail("user@example.com", "test-token");

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining("Reset your password"),
        })
      );
    });

    it("mentions 1 hour expiry in email", async () => {
      await sendPasswordResetEmail("user@example.com", "test-token");

      expect(mockSendMail).toHaveBeenCalledWith(
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

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "user@example.com",
        })
      );
    });

    it("sets correct subject line", async () => {
      await sendPasswordChangedEmail("user@example.com");

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining("password has been changed"),
        })
      );
    });

    it("includes security warning", async () => {
      await sendPasswordChangedEmail("user@example.com");

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("did not make this change"),
          text: expect.stringContaining("did not make this change"),
        })
      );
    });
  });

  describe("error handling", () => {
    it("propagates sendMail errors for verification email", async () => {
      const error = new Error("SMTP connection failed");
      mockSendMail.mockRejectedValue(error);

      await expect(
        sendVerificationEmail("user@example.com", "token")
      ).rejects.toThrow("SMTP connection failed");
    });

    it("propagates sendMail errors for password reset email", async () => {
      const error = new Error("SMTP connection failed");
      mockSendMail.mockRejectedValue(error);

      await expect(
        sendPasswordResetEmail("user@example.com", "token")
      ).rejects.toThrow("SMTP connection failed");
    });

    it("propagates sendMail errors for password changed email", async () => {
      const error = new Error("SMTP connection failed");
      mockSendMail.mockRejectedValue(error);

      await expect(
        sendPasswordChangedEmail("user@example.com")
      ).rejects.toThrow("SMTP connection failed");
    });
  });
});
