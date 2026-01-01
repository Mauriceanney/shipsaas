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
export {
  InvoiceReceiptEmail,
  type InvoiceReceiptEmailProps,
} from "./invoice-receipt";
export {
  DunningReminderEmail,
  type DunningReminderEmailProps,
} from "./dunning-reminder";
export {
  DunningFinalWarningEmail,
  type DunningFinalWarningEmailProps,
} from "./dunning-final-warning";
export {
  PaymentRecoveryEmail,
  type PaymentRecoveryEmailProps,
} from "./payment-recovery";
export {
  SubscriptionSuspendedEmail,
  type SubscriptionSuspendedEmailProps,
} from "./subscription-suspended";
export {
  AdminMessageEmail,
  type AdminMessageEmailProps,
} from "./admin-message";

// Component exports
export * from "./components";

// Import templates for render functions
import {
  AdminMessageEmail,
  type AdminMessageEmailProps,
} from "./admin-message";
import {
  DunningFinalWarningEmail,
  type DunningFinalWarningEmailProps,
} from "./dunning-final-warning";
import {
  DunningReminderEmail,
  type DunningReminderEmailProps,
} from "./dunning-reminder";
import {
  InvoiceReceiptEmail,
  type InvoiceReceiptEmailProps,
} from "./invoice-receipt";
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
  PaymentRecoveryEmail,
  type PaymentRecoveryEmailProps,
} from "./payment-recovery";
import {
  SubscriptionCancelledEmail,
  type SubscriptionCancelledEmailProps,
} from "./subscription-cancelled";
import {
  SubscriptionConfirmEmail,
  type SubscriptionConfirmEmailProps,
} from "./subscription-confirm";
import {
  SubscriptionSuspendedEmail,
  type SubscriptionSuspendedEmailProps,
} from "./subscription-suspended";
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

/**
 * Render invoice receipt email to HTML and plain text
 */
export async function renderInvoiceReceiptEmail(
  props: InvoiceReceiptEmailProps
): Promise<RenderedEmail> {
  const element = React.createElement(InvoiceReceiptEmail, props);
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);
  return { html, text };
}

/**
 * Render dunning reminder email to HTML and plain text
 */
export async function renderDunningReminderEmail(
  props: DunningReminderEmailProps
): Promise<RenderedEmail> {
  const element = React.createElement(DunningReminderEmail, props);
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);
  return { html, text };
}

/**
 * Render dunning final warning email to HTML and plain text
 */
export async function renderDunningFinalWarningEmail(
  props: DunningFinalWarningEmailProps
): Promise<RenderedEmail> {
  const element = React.createElement(DunningFinalWarningEmail, props);
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);
  return { html, text };
}

/**
 * Render payment recovery email to HTML and plain text
 */
export async function renderPaymentRecoveryEmail(
  props: PaymentRecoveryEmailProps
): Promise<RenderedEmail> {
  const element = React.createElement(PaymentRecoveryEmail, props);
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);
  return { html, text };
}

/**
 * Render subscription suspended email to HTML and plain text
 */
export async function renderSubscriptionSuspendedEmail(
  props: SubscriptionSuspendedEmailProps
): Promise<RenderedEmail> {
  const element = React.createElement(SubscriptionSuspendedEmail, props);
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);
  return { html, text };
}

/**
 * Render admin message email to HTML and plain text
 */
export async function renderAdminMessageEmail(
  props: AdminMessageEmailProps
): Promise<RenderedEmail> {
  const element = React.createElement(AdminMessageEmail, props);
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
  "invoice-receipt": InvoiceReceiptEmailProps;
  "dunning-reminder": DunningReminderEmailProps;
  "dunning-final-warning": DunningFinalWarningEmailProps;
  "payment-recovery": PaymentRecoveryEmailProps;
  "subscription-suspended": SubscriptionSuspendedEmailProps;
  "admin-message": AdminMessageEmailProps;
};

/**
 * Template name type
 */
export type EmailTemplateName = keyof EmailTemplates;

// Refund confirmation template
export {
  RefundConfirmationEmail,
  type RefundConfirmationEmailProps,
} from "./refund-confirmation";

import {
  RefundConfirmationEmail,
  type RefundConfirmationEmailProps,
} from "./refund-confirmation";

export async function renderRefundConfirmationEmail(
  props: RefundConfirmationEmailProps
): Promise<RenderedEmail> {
  const element = React.createElement(RefundConfirmationEmail, props);
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);
  return { html, text };
}
