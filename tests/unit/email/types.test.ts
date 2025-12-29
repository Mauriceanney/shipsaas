/**
 * Email Types - Unit Tests
 * TDD: RED phase - Define expected type behavior
 */

import { describe, it, expect } from "vitest";

import type {
  EmailAddress,
  EmailAttachment,
  SendEmailOptions,
  SendEmailResult,
  EmailProvider,
  EmailConfig,
  VerificationEmailData,
  PasswordResetEmailData,
  WelcomeEmailData,
  PasswordChangedEmailData,
  SubscriptionConfirmationData,
} from "@/lib/email/types";

describe("Email Types", () => {
  describe("EmailAddress", () => {
    it("should allow email with optional name", () => {
      const address: EmailAddress = {
        email: "user@example.com",
      };
      expect(address.email).toBe("user@example.com");
      expect(address.name).toBeUndefined();
    });

    it("should allow email with name", () => {
      const address: EmailAddress = {
        email: "user@example.com",
        name: "John Doe",
      };
      expect(address.email).toBe("user@example.com");
      expect(address.name).toBe("John Doe");
    });
  });

  describe("EmailAttachment", () => {
    it("should have required filename and content", () => {
      const attachment: EmailAttachment = {
        filename: "document.pdf",
        content: Buffer.from("test"),
      };
      expect(attachment.filename).toBe("document.pdf");
      expect(attachment.content).toBeInstanceOf(Buffer);
    });

    it("should allow string content", () => {
      const attachment: EmailAttachment = {
        filename: "test.txt",
        content: "Hello, World!",
      };
      expect(attachment.content).toBe("Hello, World!");
    });

    it("should allow optional contentType", () => {
      const attachment: EmailAttachment = {
        filename: "image.png",
        content: Buffer.from("test"),
        contentType: "image/png",
      };
      expect(attachment.contentType).toBe("image/png");
    });
  });

  describe("SendEmailOptions", () => {
    it("should have required fields: to, subject, html", () => {
      const options: SendEmailOptions = {
        to: "user@example.com",
        subject: "Test Subject",
        html: "<p>Hello</p>",
      };
      expect(options.to).toBe("user@example.com");
      expect(options.subject).toBe("Test Subject");
      expect(options.html).toBe("<p>Hello</p>");
    });

    it("should allow array of recipients", () => {
      const options: SendEmailOptions = {
        to: ["user1@example.com", "user2@example.com"],
        subject: "Test",
        html: "<p>Hello</p>",
      };
      expect(Array.isArray(options.to)).toBe(true);
      expect((options.to as string[]).length).toBe(2);
    });

    it("should have optional fields", () => {
      const options: SendEmailOptions = {
        to: "user@example.com",
        subject: "Test",
        html: "<p>Hello</p>",
        text: "Hello",
        from: "sender@example.com",
        replyTo: "reply@example.com",
        cc: "cc@example.com",
        bcc: ["bcc1@example.com", "bcc2@example.com"],
        attachments: [],
        tags: { type: "test" },
      };
      expect(options.text).toBe("Hello");
      expect(options.from).toBe("sender@example.com");
      expect(options.replyTo).toBe("reply@example.com");
      expect(options.cc).toBe("cc@example.com");
      expect(options.bcc).toHaveLength(2);
      expect(options.tags).toEqual({ type: "test" });
    });
  });

  describe("SendEmailResult", () => {
    it("should have success boolean", () => {
      const result: SendEmailResult = {
        success: true,
        messageId: "msg_123",
      };
      expect(result.success).toBe(true);
      expect(result.messageId).toBe("msg_123");
    });

    it("should have error on failure", () => {
      const result: SendEmailResult = {
        success: false,
        error: "SMTP connection failed",
      };
      expect(result.success).toBe(false);
      expect(result.error).toBe("SMTP connection failed");
    });
  });

  describe("EmailProvider", () => {
    it("should have name and send method", () => {
      const provider: EmailProvider = {
        name: "test-provider",
        send: async () => ({ success: true, messageId: "test" }),
      };
      expect(provider.name).toBe("test-provider");
      expect(typeof provider.send).toBe("function");
    });

    it("send method should accept SendEmailOptions and return SendEmailResult", async () => {
      const provider: EmailProvider = {
        name: "test",
        send: async (options: SendEmailOptions): Promise<SendEmailResult> => ({
          success: true,
          messageId: `sent-to-${options.to}`,
        }),
      };

      const result = await provider.send({
        to: "test@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("sent-to-test@example.com");
    });
  });

  describe("EmailConfig", () => {
    it("should have provider type", () => {
      const config: EmailConfig = {
        provider: "resend",
        from: "noreply@example.com",
        appName: "Test App",
        appUrl: "https://example.com",
      };
      expect(config.provider).toBe("resend");
    });

    it("should support nodemailer provider", () => {
      const config: EmailConfig = {
        provider: "nodemailer",
        from: "noreply@localhost",
        appName: "Test App",
        appUrl: "http://localhost:3000",
        smtp: {
          host: "localhost",
          port: 1025,
          secure: false,
        },
      };
      expect(config.provider).toBe("nodemailer");
      expect(config.smtp).toBeDefined();
      expect(config.smtp?.port).toBe(1025);
    });

    it("should support resend config", () => {
      const config: EmailConfig = {
        provider: "resend",
        from: "noreply@example.com",
        appName: "Test App",
        appUrl: "https://example.com",
        resend: {
          apiKey: "re_test_key",
        },
      };
      expect(config.resend?.apiKey).toBe("re_test_key");
    });

    it("should support smtp auth", () => {
      const config: EmailConfig = {
        provider: "nodemailer",
        from: "noreply@example.com",
        appName: "Test App",
        appUrl: "https://example.com",
        smtp: {
          host: "smtp.example.com",
          port: 587,
          secure: true,
          auth: {
            user: "smtp_user",
            pass: "smtp_pass",
          },
        },
      };
      expect(config.smtp?.auth?.user).toBe("smtp_user");
      expect(config.smtp?.auth?.pass).toBe("smtp_pass");
    });
  });

  describe("Template Data Types", () => {
    describe("VerificationEmailData", () => {
      it("should have required verificationUrl and expiresIn", () => {
        const data: VerificationEmailData = {
          verificationUrl: "https://example.com/verify?token=abc",
          expiresIn: "24 hours",
        };
        expect(data.verificationUrl).toContain("token=");
        expect(data.expiresIn).toBe("24 hours");
      });

      it("should have optional name", () => {
        const data: VerificationEmailData = {
          name: "John",
          verificationUrl: "https://example.com/verify?token=abc",
          expiresIn: "24 hours",
        };
        expect(data.name).toBe("John");
      });
    });

    describe("PasswordResetEmailData", () => {
      it("should have required resetUrl and expiresIn", () => {
        const data: PasswordResetEmailData = {
          resetUrl: "https://example.com/reset?token=xyz",
          expiresIn: "1 hour",
        };
        expect(data.resetUrl).toContain("token=");
        expect(data.expiresIn).toBe("1 hour");
      });

      it("should have optional name", () => {
        const data: PasswordResetEmailData = {
          name: "Jane",
          resetUrl: "https://example.com/reset?token=xyz",
          expiresIn: "1 hour",
        };
        expect(data.name).toBe("Jane");
      });
    });

    describe("WelcomeEmailData", () => {
      it("should have required name and loginUrl", () => {
        const data: WelcomeEmailData = {
          name: "John",
          loginUrl: "https://example.com/login",
        };
        expect(data.name).toBe("John");
        expect(data.loginUrl).toBe("https://example.com/login");
      });
    });

    describe("PasswordChangedEmailData", () => {
      it("should have required supportEmail", () => {
        const data: PasswordChangedEmailData = {
          supportEmail: "support@example.com",
        };
        expect(data.supportEmail).toBe("support@example.com");
      });

      it("should have optional name", () => {
        const data: PasswordChangedEmailData = {
          name: "John",
          supportEmail: "support@example.com",
        };
        expect(data.name).toBe("John");
      });
    });

    describe("SubscriptionConfirmationData", () => {
      it("should have all required fields", () => {
        const data: SubscriptionConfirmationData = {
          planName: "Pro",
          amount: "$19.00",
          billingCycle: "monthly",
          nextBillingDate: "January 15, 2026",
          manageUrl: "https://example.com/settings/billing",
        };
        expect(data.planName).toBe("Pro");
        expect(data.amount).toBe("$19.00");
        expect(data.billingCycle).toBe("monthly");
        expect(data.nextBillingDate).toBe("January 15, 2026");
        expect(data.manageUrl).toContain("/billing");
      });

      it("should support yearly billing cycle", () => {
        const data: SubscriptionConfirmationData = {
          planName: "Enterprise",
          amount: "$990.00",
          billingCycle: "yearly",
          nextBillingDate: "December 15, 2026",
          manageUrl: "https://example.com/settings/billing",
        };
        expect(data.billingCycle).toBe("yearly");
      });

      it("should have optional name", () => {
        const data: SubscriptionConfirmationData = {
          name: "John",
          planName: "Pro",
          amount: "$19.00",
          billingCycle: "monthly",
          nextBillingDate: "January 15, 2026",
          manageUrl: "https://example.com/settings/billing",
        };
        expect(data.name).toBe("John");
      });
    });
  });
});
