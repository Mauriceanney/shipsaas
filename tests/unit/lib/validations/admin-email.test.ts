import { describe, it, expect } from "vitest";

import {
  sendEmailToUserSchema,
  type SendEmailToUserInput,
} from "@/lib/validations/admin-email";

describe("sendEmailToUserSchema", () => {
  const validInput: SendEmailToUserInput = {
    userId: "user-123",
    subject: "Test Subject",
    body: "Test message body",
  };

  describe("userId validation", () => {
    it("accepts valid userId", () => {
      const result = sendEmailToUserSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("rejects empty userId", () => {
      const result = sendEmailToUserSchema.safeParse({
        ...validInput,
        userId: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toContain("required");
      }
    });
  });

  describe("subject validation", () => {
    it("accepts valid subject", () => {
      const result = sendEmailToUserSchema.safeParse({
        ...validInput,
        subject: "Hello User!",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty subject", () => {
      const result = sendEmailToUserSchema.safeParse({
        ...validInput,
        subject: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toContain("required");
      }
    });

    it("rejects subject exceeding 200 characters", () => {
      const result = sendEmailToUserSchema.safeParse({
        ...validInput,
        subject: "a".repeat(201),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toContain("200");
      }
    });

    it("accepts subject exactly 200 characters", () => {
      const result = sendEmailToUserSchema.safeParse({
        ...validInput,
        subject: "a".repeat(200),
      });
      expect(result.success).toBe(true);
    });

    it("trims whitespace from subject", () => {
      const result = sendEmailToUserSchema.safeParse({
        ...validInput,
        subject: "  Hello World  ",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.subject).toBe("Hello World");
      }
    });
  });

  describe("body validation", () => {
    it("accepts valid body", () => {
      const result = sendEmailToUserSchema.safeParse({
        ...validInput,
        body: "This is a test email body.",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty body", () => {
      const result = sendEmailToUserSchema.safeParse({
        ...validInput,
        body: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toContain("required");
      }
    });

    it("rejects body exceeding 10000 characters", () => {
      const result = sendEmailToUserSchema.safeParse({
        ...validInput,
        body: "a".repeat(10001),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toContain("10000");
      }
    });

    it("accepts body exactly 10000 characters", () => {
      const result = sendEmailToUserSchema.safeParse({
        ...validInput,
        body: "a".repeat(10000),
      });
      expect(result.success).toBe(true);
    });

    it("preserves line breaks in body", () => {
      const bodyWithLineBreaks = "Line 1\nLine 2\n\nLine 3";
      const result = sendEmailToUserSchema.safeParse({
        ...validInput,
        body: bodyWithLineBreaks,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toBe(bodyWithLineBreaks);
      }
    });
  });
});
