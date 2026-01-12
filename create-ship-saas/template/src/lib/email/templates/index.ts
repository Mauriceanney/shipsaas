/**
 * Email templates registry
 * Exports all templates and render functions
 */

import * as React from "react";
import { render } from "@react-email/render";
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
  SubscriptionConfirmEmail,
  type SubscriptionConfirmEmailProps,
} from "./subscription-confirm";
export {
  SubscriptionCancelledEmail,
  type SubscriptionCancelledEmailProps,
} from "./subscription-cancelled";

// GDPR Templates
export {
  DataExportReadyEmail,
  type DataExportReadyEmailProps,
} from "./data-export-ready";
export {
  AccountDeletionScheduledEmail,
  type AccountDeletionScheduledEmailProps,
} from "./account-deletion-scheduled";
export {
  AccountDeletionCanceledEmail,
  type AccountDeletionCanceledEmailProps,
} from "./account-deletion-canceled";

// Dunning Templates
export {
  PaymentFailedEmail,
  type PaymentFailedEmailProps,
} from "./payment-failed";
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

// Component exports
export * from "./components";

// Import templates for render functions
import {
  AccountDeletionCanceledEmail,
  type AccountDeletionCanceledEmailProps,
} from "./account-deletion-canceled";
import {
  AccountDeletionScheduledEmail,
  type AccountDeletionScheduledEmailProps,
} from "./account-deletion-scheduled";
import {
  DataExportReadyEmail,
  type DataExportReadyEmailProps,
} from "./data-export-ready";
import {
  DunningFinalWarningEmail,
  type DunningFinalWarningEmailProps,
} from "./dunning-final-warning";
import {
  DunningReminderEmail,
  type DunningReminderEmailProps,
} from "./dunning-reminder";
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
 * Render data export ready email to HTML and plain text
 */
export async function renderDataExportReadyEmail(
  props: DataExportReadyEmailProps
): Promise<RenderedEmail> {
  const element = React.createElement(DataExportReadyEmail, props);
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);
  return { html, text };
}

/**
 * Render account deletion scheduled email to HTML and plain text
 */
export async function renderAccountDeletionScheduledEmail(
  props: AccountDeletionScheduledEmailProps
): Promise<RenderedEmail> {
  const element = React.createElement(AccountDeletionScheduledEmail, props);
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);
  return { html, text };
}

/**
 * Render account deletion canceled email to HTML and plain text
 */
export async function renderAccountDeletionCanceledEmail(
  props: AccountDeletionCanceledEmailProps
): Promise<RenderedEmail> {
  const element = React.createElement(AccountDeletionCanceledEmail, props);
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
  "subscription-confirm": SubscriptionConfirmEmailProps;
  "subscription-cancelled": SubscriptionCancelledEmailProps;
  "data-export-ready": DataExportReadyEmailProps;
  "account-deletion-scheduled": AccountDeletionScheduledEmailProps;
  "account-deletion-canceled": AccountDeletionCanceledEmailProps;
  "payment-failed": PaymentFailedEmailProps;
  "dunning-reminder": DunningReminderEmailProps;
  "dunning-final-warning": DunningFinalWarningEmailProps;
  "payment-recovery": PaymentRecoveryEmailProps;
};

/**
 * Template name type
 */
export type EmailTemplateName = keyof EmailTemplates;
