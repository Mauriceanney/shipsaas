/**
 * Email module
 * Unified email service using React Email templates and provider abstraction
 */

import { getEmailProvider } from "./client";
import { getEmailConfig, EMAIL_CONSTANTS } from "./config";
import {
  renderVerifyEmail,
  renderPasswordResetEmail,
  renderPasswordChangedEmail,
  renderWelcomeEmail,
  renderSubscriptionConfirmEmail,
  renderSubscriptionCancelledEmail,
} from "./templates";

import type { SendEmailResult } from "./types";

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Sanitize appName for use in email from header
 * Removes quotes and special characters that could cause header injection
 */
function sanitizeFromName(name: string): string {
  return name.replace(/[<>"]/g, "");
}

// ============================================
// RE-EXPORTS
// ============================================

export * from "./types";
export * from "./config";
export { getEmailProvider, resetEmailProvider } from "./client";
export * from "./templates";

// ============================================
// EMAIL SENDING FUNCTIONS
// ============================================

/**
 * Send email verification email
 * @param email - Recipient email address
 * @param token - Verification token
 * @param name - Optional recipient name
 */
export async function sendVerificationEmail(
  email: string,
  token: string,
  name?: string
): Promise<SendEmailResult> {
  const config = getEmailConfig();
  const provider = getEmailProvider();

  const verificationUrl = `${config.appUrl}/verify-email?token=${encodeURIComponent(token)}`;

  const { html, text } = await renderVerifyEmail({
    name,
    verificationUrl,
    expiresIn: EMAIL_CONSTANTS.VERIFICATION_EXPIRY,
    appName: config.appName,
    appUrl: config.appUrl,
  });

  return provider.send({
    from: `"${sanitizeFromName(config.appName)}" <${config.from}>`,
    to: email,
    subject: `Verify your email for ${config.appName}`,
    html,
    text,
  });
}

/**
 * Send password reset email
 * @param email - Recipient email address
 * @param token - Password reset token
 * @param name - Optional recipient name
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string,
  name?: string
): Promise<SendEmailResult> {
  const config = getEmailConfig();
  const provider = getEmailProvider();

  const resetUrl = `${config.appUrl}/reset-password?token=${encodeURIComponent(token)}`;

  const { html, text } = await renderPasswordResetEmail({
    name,
    resetUrl,
    expiresIn: EMAIL_CONSTANTS.PASSWORD_RESET_EXPIRY,
    appName: config.appName,
    appUrl: config.appUrl,
  });

  return provider.send({
    from: `"${sanitizeFromName(config.appName)}" <${config.from}>`,
    to: email,
    subject: `Reset your password for ${config.appName}`,
    html,
    text,
  });
}

/**
 * Send password changed notification email
 * @param email - Recipient email address
 * @param name - Optional recipient name
 */
export async function sendPasswordChangedEmail(
  email: string,
  name?: string
): Promise<SendEmailResult> {
  const config = getEmailConfig();
  const provider = getEmailProvider();

  const supportEmail = process.env["SUPPORT_EMAIL"] || config.from;

  const { html, text } = await renderPasswordChangedEmail({
    name,
    supportEmail,
    appName: config.appName,
    appUrl: config.appUrl,
  });

  return provider.send({
    from: `"${sanitizeFromName(config.appName)}" <${config.from}>`,
    to: email,
    subject: `Your password has been changed - ${config.appName}`,
    html,
    text,
  });
}

/**
 * Send welcome email after email verification
 * @param email - Recipient email address
 * @param name - Recipient name
 */
export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<SendEmailResult> {
  const config = getEmailConfig();
  const provider = getEmailProvider();

  const loginUrl = `${config.appUrl}/login`;

  const { html, text } = await renderWelcomeEmail({
    name,
    loginUrl,
    appName: config.appName,
    appUrl: config.appUrl,
  });

  return provider.send({
    from: `"${sanitizeFromName(config.appName)}" <${config.from}>`,
    to: email,
    subject: `Welcome to ${config.appName}!`,
    html,
    text,
  });
}

/**
 * Send subscription confirmation email
 * @param email - Recipient email address
 * @param subscriptionData - Subscription details
 */
export async function sendSubscriptionConfirmationEmail(
  email: string,
  subscriptionData: {
    name?: string;
    planName: string;
    amount: string;
    billingCycle: "monthly" | "yearly";
    nextBillingDate: string;
  }
): Promise<SendEmailResult> {
  const config = getEmailConfig();
  const provider = getEmailProvider();

  const manageUrl = `${config.appUrl}/settings/billing`;

  const { html, text } = await renderSubscriptionConfirmEmail({
    name: subscriptionData.name,
    planName: subscriptionData.planName,
    amount: subscriptionData.amount,
    billingCycle: subscriptionData.billingCycle,
    nextBillingDate: subscriptionData.nextBillingDate,
    manageUrl,
    appName: config.appName,
    appUrl: config.appUrl,
  });

  return provider.send({
    from: `"${sanitizeFromName(config.appName)}" <${config.from}>`,
    to: email,
    subject: `Subscription Confirmed - ${config.appName}`,
    html,
    text,
  });
}

/**
 * Send subscription cancelled email
 * @param email - Recipient email address
 * @param cancellationData - Cancellation details
 */
export async function sendSubscriptionCancelledEmail(
  email: string,
  cancellationData: {
    name?: string;
    planName: string;
    endDate: string;
  }
): Promise<SendEmailResult> {
  const config = getEmailConfig();
  const provider = getEmailProvider();

  const resubscribeUrl = `${config.appUrl}/pricing`;

  const { html, text } = await renderSubscriptionCancelledEmail({
    name: cancellationData.name,
    planName: cancellationData.planName,
    endDate: cancellationData.endDate,
    resubscribeUrl,
    appName: config.appName,
    appUrl: config.appUrl,
  });

  return provider.send({
    from: `"${sanitizeFromName(config.appName)}" <${config.from}>`,
    to: email,
    subject: `Subscription Cancelled - ${config.appName}`,
    html,
    text,
  });
}
