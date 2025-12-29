/**
 * Nodemailer Provider - Unit Tests
 * TDD: RED phase - Define expected Nodemailer provider behavior
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted to properly hoist the mock function
const { mockSendMail } = vi.hoisted(() => ({
  mockSendMail: vi.fn(),
}));

// Mock nodemailer
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn().mockImplementation(() => ({
      sendMail: mockSendMail,
    })),
  },
}));

import { createNodemailerProvider } from "@/lib/email/providers/nodemailer";

describe("Nodemailer Provider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createNodemailerProvider", () => {
    it("should create a provider with name 'nodemailer'", () => {
      const provider = createNodemailerProvider({
        host: "localhost",
        port: 1025,
        secure: false,
      });

      expect(provider.name).toBe("nodemailer");
    });

    it("should have a send method", () => {
      const provider = createNodemailerProvider({
        host: "localhost",
        port: 1025,
        secure: false,
      });

      expect(typeof provider.send).toBe("function");
    });
  });

  describe("send", () => {
    it("should send email successfully and return messageId", async () => {
      mockSendMail.mockResolvedValue({
        messageId: "<unique-id@localhost>",
      });

      const provider = createNodemailerProvider({
        host: "localhost",
        port: 1025,
        secure: false,
      });

      const result = await provider.send({
        to: "recipient@example.com",
        from: "sender@example.com",
        subject: "Test Subject",
        html: "<p>Test content</p>",
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("<unique-id@localhost>");
      expect(result.error).toBeUndefined();
    });

    it("should pass correct parameters to sendMail", async () => {
      mockSendMail.mockResolvedValue({ messageId: "test-id" });

      const provider = createNodemailerProvider({
        host: "localhost",
        port: 1025,
        secure: false,
      });

      await provider.send({
        to: "recipient@example.com",
        from: "sender@example.com",
        subject: "Test Subject",
        html: "<p>Test</p>",
        text: "Test",
        replyTo: "reply@example.com",
      });

      expect(mockSendMail).toHaveBeenCalledWith({
        from: "sender@example.com",
        to: "recipient@example.com",
        subject: "Test Subject",
        html: "<p>Test</p>",
        text: "Test",
        replyTo: "reply@example.com",
        cc: undefined,
        bcc: undefined,
        attachments: undefined,
      });
    });

    it("should join array of recipients with comma", async () => {
      mockSendMail.mockResolvedValue({ messageId: "test-id" });

      const provider = createNodemailerProvider({
        host: "localhost",
        port: 1025,
        secure: false,
      });

      await provider.send({
        to: ["user1@example.com", "user2@example.com"],
        from: "sender@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "user1@example.com, user2@example.com",
        })
      );
    });

    it("should pass cc and bcc recipients", async () => {
      mockSendMail.mockResolvedValue({ messageId: "test-id" });

      const provider = createNodemailerProvider({
        host: "localhost",
        port: 1025,
        secure: false,
      });

      await provider.send({
        to: "recipient@example.com",
        from: "sender@example.com",
        subject: "Test",
        html: "<p>Test</p>",
        cc: "cc@example.com",
        bcc: ["bcc1@example.com", "bcc2@example.com"],
      });

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          cc: "cc@example.com",
          bcc: ["bcc1@example.com", "bcc2@example.com"],
        })
      );
    });

    it("should convert attachments to nodemailer format", async () => {
      mockSendMail.mockResolvedValue({ messageId: "test-id" });

      const provider = createNodemailerProvider({
        host: "localhost",
        port: 1025,
        secure: false,
      });

      await provider.send({
        to: "recipient@example.com",
        from: "sender@example.com",
        subject: "Test",
        html: "<p>Test</p>",
        attachments: [
          {
            filename: "test.pdf",
            content: Buffer.from("test"),
            contentType: "application/pdf",
          },
        ],
      });

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          attachments: [
            {
              filename: "test.pdf",
              content: Buffer.from("test"),
              contentType: "application/pdf",
            },
          ],
        })
      );
    });

    it("should handle SMTP errors", async () => {
      mockSendMail.mockRejectedValue(new Error("SMTP connection failed"));

      const provider = createNodemailerProvider({
        host: "localhost",
        port: 1025,
        secure: false,
      });

      const result = await provider.send({
        to: "recipient@example.com",
        from: "sender@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("SMTP connection failed");
    });

    it("should handle non-Error thrown objects", async () => {
      mockSendMail.mockRejectedValue("String error");

      const provider = createNodemailerProvider({
        host: "localhost",
        port: 1025,
        secure: false,
      });

      const result = await provider.send({
        to: "recipient@example.com",
        from: "sender@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unknown error");
    });
  });
});
