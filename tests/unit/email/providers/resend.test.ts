/**
 * Resend Provider - Unit Tests
 * TDD: RED phase - Define expected Resend provider behavior
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Resend SDK
const mockResendSend = vi.fn();

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: mockResendSend,
    },
  })),
}));

import { createResendProvider } from "@/lib/email/providers/resend";

describe("Resend Provider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createResendProvider", () => {
    it("should create a provider with name 'resend'", () => {
      const provider = createResendProvider("test-api-key");

      expect(provider.name).toBe("resend");
    });

    it("should have a send method", () => {
      const provider = createResendProvider("test-api-key");

      expect(typeof provider.send).toBe("function");
    });
  });

  describe("send", () => {
    it("should send email successfully and return messageId", async () => {
      mockResendSend.mockResolvedValue({
        data: { id: "msg_123abc" },
        error: null,
      });

      const provider = createResendProvider("test-api-key");
      const result = await provider.send({
        to: "recipient@example.com",
        from: "sender@example.com",
        subject: "Test Subject",
        html: "<p>Test content</p>",
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("msg_123abc");
      expect(result.error).toBeUndefined();
    });

    it("should pass correct parameters to Resend API", async () => {
      mockResendSend.mockResolvedValue({
        data: { id: "msg_123" },
        error: null,
      });

      const provider = createResendProvider("test-api-key");
      await provider.send({
        to: "recipient@example.com",
        from: "sender@example.com",
        subject: "Test Subject",
        html: "<p>Test</p>",
        text: "Test",
        replyTo: "reply@example.com",
      });

      expect(mockResendSend).toHaveBeenCalledWith({
        from: "sender@example.com",
        to: ["recipient@example.com"],
        subject: "Test Subject",
        html: "<p>Test</p>",
        text: "Test",
        replyTo: "reply@example.com",
        cc: undefined,
        bcc: undefined,
        tags: undefined,
      });
    });

    it("should handle array of recipients", async () => {
      mockResendSend.mockResolvedValue({
        data: { id: "msg_123" },
        error: null,
      });

      const provider = createResendProvider("test-api-key");
      await provider.send({
        to: ["user1@example.com", "user2@example.com"],
        from: "sender@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(mockResendSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ["user1@example.com", "user2@example.com"],
        })
      );
    });

    it("should handle cc recipients", async () => {
      mockResendSend.mockResolvedValue({
        data: { id: "msg_123" },
        error: null,
      });

      const provider = createResendProvider("test-api-key");
      await provider.send({
        to: "recipient@example.com",
        from: "sender@example.com",
        subject: "Test",
        html: "<p>Test</p>",
        cc: "cc@example.com",
      });

      expect(mockResendSend).toHaveBeenCalledWith(
        expect.objectContaining({
          cc: ["cc@example.com"],
        })
      );
    });

    it("should handle array of cc recipients", async () => {
      mockResendSend.mockResolvedValue({
        data: { id: "msg_123" },
        error: null,
      });

      const provider = createResendProvider("test-api-key");
      await provider.send({
        to: "recipient@example.com",
        from: "sender@example.com",
        subject: "Test",
        html: "<p>Test</p>",
        cc: ["cc1@example.com", "cc2@example.com"],
      });

      expect(mockResendSend).toHaveBeenCalledWith(
        expect.objectContaining({
          cc: ["cc1@example.com", "cc2@example.com"],
        })
      );
    });

    it("should handle bcc recipients", async () => {
      mockResendSend.mockResolvedValue({
        data: { id: "msg_123" },
        error: null,
      });

      const provider = createResendProvider("test-api-key");
      await provider.send({
        to: "recipient@example.com",
        from: "sender@example.com",
        subject: "Test",
        html: "<p>Test</p>",
        bcc: ["bcc1@example.com", "bcc2@example.com"],
      });

      expect(mockResendSend).toHaveBeenCalledWith(
        expect.objectContaining({
          bcc: ["bcc1@example.com", "bcc2@example.com"],
        })
      );
    });

    it("should convert tags to Resend format", async () => {
      mockResendSend.mockResolvedValue({
        data: { id: "msg_123" },
        error: null,
      });

      const provider = createResendProvider("test-api-key");
      await provider.send({
        to: "recipient@example.com",
        from: "sender@example.com",
        subject: "Test",
        html: "<p>Test</p>",
        tags: { type: "verification", campaign: "welcome" },
      });

      expect(mockResendSend).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: [
            { name: "type", value: "verification" },
            { name: "campaign", value: "welcome" },
          ],
        })
      );
    });

    it("should handle API errors", async () => {
      mockResendSend.mockResolvedValue({
        data: null,
        error: { message: "Invalid API key" },
      });

      const provider = createResendProvider("invalid-key");
      const result = await provider.send({
        to: "recipient@example.com",
        from: "sender@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid API key");
      expect(result.messageId).toBeUndefined();
    });

    it("should handle network errors", async () => {
      mockResendSend.mockRejectedValue(new Error("Network error"));

      const provider = createResendProvider("test-key");
      const result = await provider.send({
        to: "recipient@example.com",
        from: "sender@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
    });

    it("should handle non-Error thrown objects", async () => {
      mockResendSend.mockRejectedValue("String error");

      const provider = createResendProvider("test-key");
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
