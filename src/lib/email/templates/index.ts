/**
 * Email templates registry
 * Exports all templates and render functions
 */

import { render } from "@react-email/render";
import * as React from "react";

// Template components
export { WelcomeEmail, type WelcomeEmailProps } from "./welcome";
export {
  VerifyEmailTemplate,
  type VerifyEmailTemplateProps,
} from "./verify-email";
export {
  PasswordResetEmail,
  type PasswordResetEmailProps,
} from "./password-reset";
export {
  PasswordChangedEmail,
  type PasswordChangedEmailProps,
} from "./password-changed";
export {
  SubscriptionConfirmEmail,
  type SubscriptionConfirmEmailProps,
} from "./subscription-confirm";
export {
  SubscriptionCancelledEmail,
  type SubscriptionCancelledEmailProps,
} from "./subscription-cancelled";
export {
  PaymentFailedEmail,
  type PaymentFailedEmailProps,
} from "./payment-failed";

// Component exports
export * from "./components";

// Import templates for render functions
import {
  PasswordChangedEmail,
  type PasswordChangedEmailProps,
} from "./password-changed";
import {
  PasswordResetEmail,
  type PasswordResetEmailProps,
} from "./password-reset";
import {
  PaymentFailedEmail,
  type PaymentFailedEmailProps,
} from "./payment-failed";
import {
  SubscriptionCancelledEmail,
  type SubscriptionCancelledEmailProps,
} from "./subscription-cancelled";
import {
  SubscriptionConfirmEmail,
  type SubscriptionConfirmEmailProps,
} from "./subscription-confirm";
import {
  VerifyEmailTemplate,
  type VerifyEmailTemplateProps,
} from "./verify-email";
import { WelcomeEmail, type WelcomeEmailProps } from "./welcome";

// ============================================
// RENDER FUNCTIONS
// ============================================

interface RenderedEmail {
  html: string;
  text: string;
}

/**
 * Render welcome email to HTML and plain text
 */
export async function renderWelcomeEmail(
  props: WelcomeEmailProps
): Promise<RenderedEmail> {
  const element = React.createElement(WelcomeEmail, props);
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);
  return { html, text };
}

/**
 * Render email verification email to HTML and plain text
 */
export async function renderVerifyEmail(
  props: VerifyEmailTemplateProps
): Promise<RenderedEmail> {
  const element = React.createElement(VerifyEmailTemplate, props);
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);
  return { html, text };
}

/**
 * Render password reset email to HTML and plain text
 */
export async function renderPasswordResetEmail(
  props: PasswordResetEmailProps
): Promise<RenderedEmail> {
  const element = React.createElement(PasswordResetEmail, props);
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);
  return { html, text };
}

/**
 * Render password changed email to HTML and plain text
 */
export async function renderPasswordChangedEmail(
  props: PasswordChangedEmailProps
): Promise<RenderedEmail> {
  const element = React.createElement(PasswordChangedEmail, props);
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);
  return { html, text };
}

/**
 * Render subscription confirmation email to HTML and plain text
 */
export async function renderSubscriptionConfirmEmail(
  props: SubscriptionConfirmEmailProps
): Promise<RenderedEmail> {
  const element = React.createElement(SubscriptionConfirmEmail, props);
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);
  return { html, text };
}

/**
 * Render subscription cancelled email to HTML and plain text
 */
export async function renderSubscriptionCancelledEmail(
  props: SubscriptionCancelledEmailProps
): Promise<RenderedEmail> {
  const element = React.createElement(SubscriptionCancelledEmail, props);
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);
  return { html, text };
}

/**
 * Render payment failed email to HTML and plain text
 */
export async function renderPaymentFailedEmail(
  props: PaymentFailedEmailProps
): Promise<RenderedEmail> {
  const element = React.createElement(PaymentFailedEmail, props);
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);
  return { html, text };
}

// ============================================
// TEMPLATE TYPES MAP
// ============================================

/**
 * Map of template names to their props types
 * Useful for type-safe template rendering
 */
export type EmailTemplates = {
  welcome: WelcomeEmailProps;
  "verify-email": VerifyEmailTemplateProps;
  "password-reset": PasswordResetEmailProps;
  "password-changed": PasswordChangedEmailProps;
  "subscription-confirm": SubscriptionConfirmEmailProps;
  "subscription-cancelled": SubscriptionCancelledEmailProps;
  "payment-failed": PaymentFailedEmailProps;
};

/**
 * Template name type
 */
export type EmailTemplateName = keyof EmailTemplates;
