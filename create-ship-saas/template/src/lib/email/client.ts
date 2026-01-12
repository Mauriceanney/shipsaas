/**
 * Email client factory
 * Creates the appropriate email provider based on configuration
 */

import { getEmailConfig } from "./config";
import { createResendProvider, createNodemailerProvider } from "./providers";
import type { EmailProvider } from "./types";

// Singleton instance
let emailProvider: EmailProvider | null = null;

/**
 * Get or create the email provider singleton
 * Automatically selects the appropriate provider based on configuration
 */
export function getEmailProvider(): EmailProvider {
  if (emailProvider) {
    return emailProvider;
  }

  const config = getEmailConfig();

  if (config.provider === "resend" && config.resend) {
    emailProvider = createResendProvider(config.resend.apiKey);
  } else if (config.smtp) {
    emailProvider = createNodemailerProvider(config.smtp);
  } else {
    throw new Error("No email provider configured");
  }

  console.log(`Email provider initialized: ${emailProvider.name}`);
  return emailProvider;
}

/**
 * Reset email provider singleton
 * Useful for testing to allow re-initialization with different config
 */
export function resetEmailProvider(): void {
  emailProvider = null;
}
