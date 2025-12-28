import { describe, expect, it } from "vitest";

import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";

describe("Auth Validation Schemas", () => {
  describe("loginSchema", () => {
    it("accepts valid email and password", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "password123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email", () => {
      const result = loginSchema.safeParse({
        email: "not-an-email",
        password: "password123",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty password", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing fields", () => {
      const result = loginSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("registerSchema", () => {
    it("accepts valid registration data", () => {
      const result = registerSchema.safeParse({
        name: "John Doe",
        email: "john@example.com",
        password: "SecurePass123!",
        confirmPassword: "SecurePass123!",
      });
      expect(result.success).toBe(true);
    });

    it("rejects weak password", () => {
      const result = registerSchema.safeParse({
        name: "John Doe",
        email: "john@example.com",
        password: "weak",
        confirmPassword: "weak",
      });
      expect(result.success).toBe(false);
    });

    it("rejects mismatched passwords", () => {
      const result = registerSchema.safeParse({
        name: "John Doe",
        email: "john@example.com",
        password: "SecurePass123!",
        confirmPassword: "DifferentPass123!",
      });
      expect(result.success).toBe(false);
    });

    it("rejects password without uppercase", () => {
      const result = registerSchema.safeParse({
        name: "John Doe",
        email: "john@example.com",
        password: "securepass123!",
        confirmPassword: "securepass123!",
      });
      expect(result.success).toBe(false);
    });

    it("rejects password without number", () => {
      const result = registerSchema.safeParse({
        name: "John Doe",
        email: "john@example.com",
        password: "SecurePass!",
        confirmPassword: "SecurePass!",
      });
      expect(result.success).toBe(false);
    });

    it("rejects password without special character", () => {
      const result = registerSchema.safeParse({
        name: "John Doe",
        email: "john@example.com",
        password: "SecurePass123",
        confirmPassword: "SecurePass123",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty name", () => {
      const result = registerSchema.safeParse({
        name: "",
        email: "john@example.com",
        password: "SecurePass123!",
        confirmPassword: "SecurePass123!",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("forgotPasswordSchema", () => {
    it("accepts valid email", () => {
      const result = forgotPasswordSchema.safeParse({
        email: "user@example.com",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email", () => {
      const result = forgotPasswordSchema.safeParse({
        email: "not-an-email",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("resetPasswordSchema", () => {
    it("accepts valid reset data", () => {
      const result = resetPasswordSchema.safeParse({
        token: "valid-token-123",
        password: "NewSecurePass123!",
        confirmPassword: "NewSecurePass123!",
      });
      expect(result.success).toBe(true);
    });

    it("rejects mismatched passwords", () => {
      const result = resetPasswordSchema.safeParse({
        token: "valid-token-123",
        password: "NewSecurePass123!",
        confirmPassword: "DifferentPass123!",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty token", () => {
      const result = resetPasswordSchema.safeParse({
        token: "",
        password: "NewSecurePass123!",
        confirmPassword: "NewSecurePass123!",
      });
      expect(result.success).toBe(false);
    });
  });
});
