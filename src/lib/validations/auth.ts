import { z } from "zod";

// Password must have:
// - Minimum 8 characters
// - At least one uppercase letter
// - At least one lowercase letter
// - At least one number
// - At least one special character
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/,
    "Password must contain at least one special character"
  );

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100, "Name is too long"),
    email: z.string().email("Please enter a valid email address"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Two-Factor Authentication schemas
export const setupTwoFactorSchema = z.object({
  code: z
    .string()
    .length(6, "Code must be 6 digits")
    .regex(/^\d+$/, "Code must only contain numbers"),
});

export const verifyTwoFactorSchema = z.object({
  code: z
    .string()
    .min(6, "Code is required")
    .max(10, "Code is too long") // Allow backup codes (8 chars + formatting)
    .transform((val) => val.replace(/[\s-]/g, "")), // Remove spaces and dashes
  userId: z.string().min(1, "User ID is required"),
  rememberDevice: z.boolean().optional().default(false),
});

export const disableTwoFactorSchema = z.object({
  code: z
    .string()
    .min(6, "Code is required")
    .max(10, "Code is too long")
    .transform((val) => val.replace(/[\s-]/g, "")),
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type SetupTwoFactorInput = z.infer<typeof setupTwoFactorSchema>;
export type VerifyTwoFactorInput = z.infer<typeof verifyTwoFactorSchema>;
export type DisableTwoFactorInput = z.infer<typeof disableTwoFactorSchema>;
