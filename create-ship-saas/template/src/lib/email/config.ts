/**
 * Email configuration
 */

import type { EmailConfig } from "./types";

// ============================================
// CONFIGURATION FUNCTION
// ============================================

/**
 * Get email configuration based on environment
 * Uses Resend in production with API key, otherwise falls back to nodemailer/SMTP
 */
export function getEmailConfig(): EmailConfig {
  const isProduction = process.env.NODE_ENV === "production";
  const resendApiKey = process.env["RESEND_API_KEY"];
  const emailFrom = process.env["EMAIL_FROM"];

  // Production environment validation
  if (isProduction) {
    if (!resendApiKey) {
      throw new Error(
        "RESEND_API_KEY is required in production. Please set the RESEND_API_KEY environment variable."
      );
    }
    if (!emailFrom || emailFrom === "noreply@localhost") {
      console.warn(
        "Warning: EMAIL_FROM is not set or using default value in production. Please set a proper EMAIL_FROM environment variable."
      );
    }
  }

  // Use Resend in production if API key is available
  const useResend = isProduction && !!resendApiKey;

  const config: EmailConfig = {
    provider: useResend ? "resend" : "nodemailer",
    from: process.env["EMAIL_FROM"] || "noreply@localhost",
    appName: process.env["NEXT_PUBLIC_APP_NAME"] || "SaaS App",
    appUrl: process.env["NEXT_PUBLIC_APP_URL"] || "http://localhost:3000",
  };

  if (useResend) {
    config.resend = {
      apiKey: resendApiKey!,
    };
  } else {
    const smtpAuth =
      process.env["SMTP_USER"] && process.env["SMTP_PASS"]
        ? {
            user: process.env["SMTP_USER"],
            pass: process.env["SMTP_PASS"],
          }
        : undefined;

    config.smtp = {
      host: process.env["SMTP_HOST"] || "localhost",
      port: parseInt(process.env["SMTP_PORT"] || "1025", 10),
      secure: process.env["SMTP_SECURE"] === "true",
      ...(smtpAuth && { auth: smtpAuth }),
    };
  }

  return config;
}

// ============================================
// EMAIL CONSTANTS
// ============================================

/**
 * Email-related constants
 */
export const EMAIL_CONSTANTS = {
  VERIFICATION_EXPIRY: "24 hours",
  PASSWORD_RESET_EXPIRY: "1 hour",
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
} as const;
