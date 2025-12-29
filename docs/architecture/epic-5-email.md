# Epic 5: Email - Technical Architecture Document

**Version**: 1.0
**Last Updated**: 2025-12-29
**Status**: Ready for Implementation

## Table of Contents

1. [Overview](#1-overview)
2. [Current State Analysis](#2-current-state-analysis)
3. [Target Architecture](#3-target-architecture)
4. [File Structure](#4-file-structure)
5. [Dependencies](#5-dependencies)
6. [Implementation Phases](#6-implementation-phases)
7. [US-5.1: Email Infrastructure](#7-us-51-email-infrastructure)
8. [US-5.2: Email Templates](#8-us-52-email-templates)
9. [Test Strategy](#9-test-strategy)
10. [Security Considerations](#10-security-considerations)
11. [Integration Points](#11-integration-points)
12. [Environment Configuration](#12-environment-configuration)
13. [Acceptance Criteria](#13-acceptance-criteria)
14. [Implementation Checklist](#14-implementation-checklist)

---

## 1. Overview

### 1.1 Epic Description

Implement a robust transactional email system using Resend for production and local SMTP (Mailpit) for development. The system will provide React Email templates for consistent, maintainable email designs.

### 1.2 User Stories

| ID | Story | Priority |
|----|-------|----------|
| US-5.1 | Email Infrastructure | High |
| US-5.2 | Email Templates | High |

### 1.3 Technology Stack

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Email Provider (Production) | Resend | 4.x | Transactional email delivery |
| Email Provider (Development) | Mailpit | latest | Local SMTP testing |
| Email Templates | @react-email/components | 0.0.28 | Component-based email templates |
| Transport (Fallback) | nodemailer | 7.x | SMTP transport layer |
| Validation | Zod | 3.x | Email input validation |

### 1.4 Key Design Decisions

- **Dual Provider Strategy**: Use Resend API in production for reliability, nodemailer/SMTP in development for local testing
- **React Email Components**: Type-safe, reusable email components with preview capability
- **Template System**: Centralized template registry with consistent branding
- **Error Handling**: Graceful degradation with retry logic for transient failures
- **Environment Detection**: Automatic provider selection based on environment

---

## 2. Current State Analysis

### 2.1 Existing Implementation

The codebase already has a basic email module at `/src/lib/email/index.ts`:

```typescript
// Current implementation using nodemailer with inline HTML templates
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env["SMTP_HOST"] || "localhost",
  port: parseInt(process.env["SMTP_PORT"] || "1025", 10),
  secure: false,
  // ...
});

export async function sendVerificationEmail(email: string, token: string): Promise<void>
export async function sendPasswordResetEmail(email: string, token: string): Promise<void>
export async function sendPasswordChangedEmail(email: string): Promise<void>
```

### 2.2 Existing Tests

Unit tests exist at `/tests/unit/email/email.test.ts`:
- Tests for `sendVerificationEmail`
- Tests for `sendPasswordResetEmail`
- Tests for `sendPasswordChangedEmail`
- Error handling tests

### 2.3 Current Integrations

Email functions are used in:
- `/src/actions/auth/register.ts` - Email verification
- `/src/actions/auth/forgot-password.ts` - Password reset
- `/src/actions/auth/reset-password.ts` - Password changed notification (not yet integrated)

### 2.4 Existing Dependencies

From `package.json`:
- `resend: ^4.0.1` (already installed but not used)
- `@react-email/components: ^0.0.28` (already installed but not used)
- `nodemailer: ^7.0.12` (currently in use)
- `@types/nodemailer: ^7.0.4` (dev dependency)

### 2.5 Infrastructure

Docker Compose includes Mailpit for local development:
```yaml
mailpit:
  image: axllent/mailpit:latest
  ports:
    - "1025:1025"   # SMTP
    - "8025:8025"   # Web UI
```

### 2.6 Environment Variables

Already defined in `.env.example`:
```env
RESEND_API_KEY=""
EMAIL_FROM="noreply@yourdomain.com"
SMTP_HOST="localhost"
SMTP_PORT="1025"
```

---

## 3. Target Architecture

### 3.1 Architecture Overview

```
                    +------------------+
                    |  Email Service   |
                    |  (Facade Layer)  |
                    +--------+---------+
                             |
              +--------------+--------------+
              |                             |
    +---------v---------+       +-----------v-----------+
    |  Resend Provider  |       |  Nodemailer Provider  |
    |  (Production)     |       |  (Development/SMTP)   |
    +-------------------+       +-----------------------+
              |                             |
              |                             |
    +---------v---------+       +-----------v-----------+
    |    Resend API     |       |    Mailpit/SMTP       |
    +-------------------+       +-----------------------+

                    +------------------+
                    | React Email      |
                    | Templates        |
                    +------------------+
                            |
            +---------------+---------------+
            |       |       |       |       |
         Welcome  Reset  Verify  Confirm  ...
```

### 3.2 Design Principles

1. **Provider Agnostic**: Abstract email sending behind a unified interface
2. **Template Reusability**: Shared components for headers, footers, buttons
3. **Type Safety**: Full TypeScript coverage for templates and APIs
4. **Testability**: Easy mocking and testing at all levels
5. **Observability**: Logging and metrics for email delivery

---

## 4. File Structure

```
src/
├── lib/
│   └── email/
│       ├── index.ts                    # Main export (email service facade)
│       ├── client.ts                   # Email client factory (Resend/Nodemailer)
│       ├── config.ts                   # Email configuration and constants
│       ├── types.ts                    # TypeScript interfaces and types
│       ├── providers/
│       │   ├── index.ts                # Provider exports
│       │   ├── resend.ts               # Resend provider implementation
│       │   └── nodemailer.ts           # Nodemailer provider implementation
│       └── templates/
│           ├── index.ts                # Template registry and exports
│           ├── components/
│           │   ├── layout.tsx          # Base email layout
│           │   ├── header.tsx          # Email header component
│           │   ├── footer.tsx          # Email footer component
│           │   ├── button.tsx          # CTA button component
│           │   └── text.tsx            # Typography components
│           ├── welcome.tsx             # Welcome email template
│           ├── verify-email.tsx        # Email verification template
│           ├── password-reset.tsx      # Password reset template
│           ├── password-changed.tsx    # Password changed notification
│           └── subscription-confirm.tsx # Subscription confirmation template
│
├── emails/                             # React Email preview directory (optional)
│   └── ... (copies of templates for `pnpm email:dev`)
│
tests/
├── unit/
│   └── email/
│       ├── email.test.ts               # Existing tests (update)
│       ├── client.test.ts              # Email client tests
│       ├── providers/
│       │   ├── resend.test.ts          # Resend provider tests
│       │   └── nodemailer.test.ts      # Nodemailer provider tests
│       └── templates/
│           ├── welcome.test.tsx        # Welcome template tests
│           ├── verify-email.test.tsx   # Verification template tests
│           ├── password-reset.test.tsx # Reset template tests
│           └── subscription.test.tsx   # Subscription template tests
│
└── e2e/
    └── email.spec.ts                   # E2E email flow tests
```

---

## 5. Dependencies

### 5.1 Already Installed

```json
{
  "dependencies": {
    "resend": "^4.0.1",
    "@react-email/components": "^0.0.28",
    "nodemailer": "^7.0.12"
  },
  "devDependencies": {
    "@types/nodemailer": "^7.0.4"
  }
}
```

### 5.2 No New Dependencies Required

All required dependencies are already present in `package.json`. The implementation will utilize:
- `resend` - For production email delivery via Resend API
- `@react-email/components` - For building email templates
- `nodemailer` - For local SMTP delivery (Mailpit)

---

## 6. Implementation Phases

### 6.1 TDD Approach Overview

Each phase follows the RED -> GREEN -> REFACTOR cycle:

1. **RED**: Write failing tests that define expected behavior
2. **GREEN**: Write minimum code to make tests pass
3. **REFACTOR**: Improve code quality while keeping tests green

### 6.2 Phase 1: Email Infrastructure (US-5.1)

**Duration**: 1-2 days

| Step | Task | TDD Stage |
|------|------|-----------|
| 1.1 | Define types and interfaces | RED |
| 1.2 | Create email configuration | RED -> GREEN |
| 1.3 | Implement Resend provider | RED -> GREEN |
| 1.4 | Implement Nodemailer provider | RED -> GREEN |
| 1.5 | Create email client factory | RED -> GREEN |
| 1.6 | Build email service facade | RED -> GREEN |
| 1.7 | Refactor and optimize | REFACTOR |

### 6.3 Phase 2: Email Templates (US-5.2)

**Duration**: 2-3 days

| Step | Task | TDD Stage |
|------|------|-----------|
| 2.1 | Create base layout component | RED -> GREEN |
| 2.2 | Build shared components (header, footer, button) | RED -> GREEN |
| 2.3 | Implement Welcome email template | RED -> GREEN |
| 2.4 | Implement Email Verification template | RED -> GREEN |
| 2.5 | Implement Password Reset template | RED -> GREEN |
| 2.6 | Implement Password Changed template | RED -> GREEN |
| 2.7 | Implement Subscription Confirmation template | RED -> GREEN |
| 2.8 | Refactor and ensure consistency | REFACTOR |

### 6.4 Phase 3: Integration

**Duration**: 1 day

| Step | Task | TDD Stage |
|------|------|-----------|
| 3.1 | Update existing auth actions | GREEN |
| 3.2 | Add subscription email triggers | GREEN |
| 3.3 | Integration testing | GREEN |
| 3.4 | E2E testing | GREEN |

---

## 7. US-5.1: Email Infrastructure

### 7.1 Types and Interfaces (`src/lib/email/types.ts`)

```typescript
/**
 * Email system type definitions
 */

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: EmailAttachment[];
  tags?: Record<string, string>;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailProvider {
  name: string;
  send(options: SendEmailOptions): Promise<SendEmailResult>;
}

export interface EmailConfig {
  provider: "resend" | "nodemailer";
  from: string;
  appName: string;
  appUrl: string;
  resend?: {
    apiKey: string;
  };
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth?: {
      user: string;
      pass: string;
    };
  };
}

// Template-specific types
export interface VerificationEmailData {
  name?: string;
  verificationUrl: string;
  expiresIn: string;
}

export interface PasswordResetEmailData {
  name?: string;
  resetUrl: string;
  expiresIn: string;
}

export interface WelcomeEmailData {
  name: string;
  loginUrl: string;
}

export interface PasswordChangedEmailData {
  name?: string;
  supportEmail: string;
}

export interface SubscriptionConfirmationData {
  name?: string;
  planName: string;
  amount: string;
  billingCycle: "monthly" | "yearly";
  nextBillingDate: string;
  manageUrl: string;
}
```

### 7.2 Configuration (`src/lib/email/config.ts`)

```typescript
/**
 * Email configuration
 */

import type { EmailConfig } from "./types";

function getEmailConfig(): EmailConfig {
  const isProduction = process.env.NODE_ENV === "production";
  const resendApiKey = process.env["RESEND_API_KEY"];

  // Use Resend in production if API key is available
  const useResend = isProduction && !!resendApiKey;

  const config: EmailConfig = {
    provider: useResend ? "resend" : "nodemailer",
    from: process.env["EMAIL_FROM"] || "noreply@localhost",
    appName: process.env["NEXT_PUBLIC_APP_NAME"] || "SaaS Boilerplate",
    appUrl: process.env["NEXT_PUBLIC_APP_URL"] || "http://localhost:3000",
  };

  if (useResend) {
    config.resend = {
      apiKey: resendApiKey!,
    };
  } else {
    config.smtp = {
      host: process.env["SMTP_HOST"] || "localhost",
      port: parseInt(process.env["SMTP_PORT"] || "1025", 10),
      secure: false,
      auth: process.env["SMTP_USER"] && process.env["SMTP_PASS"]
        ? {
            user: process.env["SMTP_USER"],
            pass: process.env["SMTP_PASS"],
          }
        : undefined,
    };
  }

  return config;
}

export const emailConfig = getEmailConfig();

// Email constants
export const EMAIL_CONSTANTS = {
  VERIFICATION_EXPIRY: "24 hours",
  PASSWORD_RESET_EXPIRY: "1 hour",
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
} as const;
```

### 7.3 Resend Provider (`src/lib/email/providers/resend.ts`)

```typescript
/**
 * Resend email provider implementation
 */

import { Resend } from "resend";

import type { EmailProvider, SendEmailOptions, SendEmailResult } from "../types";

export function createResendProvider(apiKey: string): EmailProvider {
  const resend = new Resend(apiKey);

  return {
    name: "resend",

    async send(options: SendEmailOptions): Promise<SendEmailResult> {
      try {
        const { data, error } = await resend.emails.send({
          from: options.from!,
          to: Array.isArray(options.to) ? options.to : [options.to],
          subject: options.subject,
          html: options.html,
          text: options.text,
          replyTo: options.replyTo,
          cc: options.cc ? (Array.isArray(options.cc) ? options.cc : [options.cc]) : undefined,
          bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : undefined,
          tags: options.tags
            ? Object.entries(options.tags).map(([name, value]) => ({ name, value }))
            : undefined,
        });

        if (error) {
          console.error("Resend error:", error);
          return {
            success: false,
            error: error.message,
          };
        }

        return {
          success: true,
          messageId: data?.id,
        };
      } catch (error) {
        console.error("Resend send error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  };
}
```

### 7.4 Nodemailer Provider (`src/lib/email/providers/nodemailer.ts`)

```typescript
/**
 * Nodemailer email provider implementation
 */

import nodemailer from "nodemailer";

import type { EmailProvider, SendEmailOptions, SendEmailResult } from "../types";

interface NodemailerConfig {
  host: string;
  port: number;
  secure: boolean;
  auth?: {
    user: string;
    pass: string;
  };
}

export function createNodemailerProvider(config: NodemailerConfig): EmailProvider {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });

  return {
    name: "nodemailer",

    async send(options: SendEmailOptions): Promise<SendEmailResult> {
      try {
        const info = await transporter.sendMail({
          from: options.from,
          to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
          replyTo: options.replyTo,
          cc: options.cc,
          bcc: options.bcc,
          attachments: options.attachments?.map((att) => ({
            filename: att.filename,
            content: att.content,
            contentType: att.contentType,
          })),
        });

        return {
          success: true,
          messageId: info.messageId,
        };
      } catch (error) {
        console.error("Nodemailer send error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  };
}
```

### 7.5 Email Client Factory (`src/lib/email/client.ts`)

```typescript
/**
 * Email client factory
 * Creates the appropriate email provider based on configuration
 */

import { emailConfig } from "./config";
import { createResendProvider } from "./providers/resend";
import { createNodemailerProvider } from "./providers/nodemailer";

import type { EmailProvider } from "./types";

let emailProvider: EmailProvider | null = null;

/**
 * Get or create the email provider singleton
 */
export function getEmailProvider(): EmailProvider {
  if (emailProvider) {
    return emailProvider;
  }

  if (emailConfig.provider === "resend" && emailConfig.resend) {
    emailProvider = createResendProvider(emailConfig.resend.apiKey);
  } else if (emailConfig.smtp) {
    emailProvider = createNodemailerProvider(emailConfig.smtp);
  } else {
    throw new Error("No email provider configured");
  }

  console.log(`Email provider initialized: ${emailProvider.name}`);
  return emailProvider;
}

/**
 * Reset email provider (useful for testing)
 */
export function resetEmailProvider(): void {
  emailProvider = null;
}
```

### 7.6 Email Service Facade (`src/lib/email/index.ts`)

```typescript
/**
 * Email service - Main export
 * Provides high-level email sending functions
 */

import { getEmailProvider } from "./client";
import { emailConfig, EMAIL_CONSTANTS } from "./config";
import {
  renderVerificationEmail,
  renderPasswordResetEmail,
  renderPasswordChangedEmail,
  renderWelcomeEmail,
  renderSubscriptionConfirmationEmail,
} from "./templates";

import type { SendEmailResult } from "./types";

// Re-export types
export * from "./types";
export { emailConfig, EMAIL_CONSTANTS } from "./config";

/**
 * Send email with retry logic
 */
async function sendWithRetry(
  sendFn: () => Promise<SendEmailResult>,
  retries = EMAIL_CONSTANTS.MAX_RETRIES
): Promise<SendEmailResult> {
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const result = await sendFn();

    if (result.success) {
      return result;
    }

    lastError = result.error;
    console.warn(`Email send attempt ${attempt} failed: ${result.error}`);

    if (attempt < retries) {
      await new Promise((resolve) =>
        setTimeout(resolve, EMAIL_CONSTANTS.RETRY_DELAY_MS * attempt)
      );
    }
  }

  return {
    success: false,
    error: lastError || "Max retries exceeded",
  };
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(
  email: string,
  token: string,
  name?: string
): Promise<void> {
  const provider = getEmailProvider();
  const verificationUrl = `${emailConfig.appUrl}/verify-email?token=${token}`;

  const { html, text } = renderVerificationEmail({
    name,
    verificationUrl,
    expiresIn: EMAIL_CONSTANTS.VERIFICATION_EXPIRY,
  });

  const result = await sendWithRetry(() =>
    provider.send({
      to: email,
      from: `"${emailConfig.appName}" <${emailConfig.from}>`,
      subject: `Verify your email for ${emailConfig.appName}`,
      html,
      text,
      tags: { type: "verification" },
    })
  );

  if (!result.success) {
    throw new Error(`Failed to send verification email: ${result.error}`);
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string,
  name?: string
): Promise<void> {
  const provider = getEmailProvider();
  const resetUrl = `${emailConfig.appUrl}/reset-password?token=${token}`;

  const { html, text } = renderPasswordResetEmail({
    name,
    resetUrl,
    expiresIn: EMAIL_CONSTANTS.PASSWORD_RESET_EXPIRY,
  });

  const result = await sendWithRetry(() =>
    provider.send({
      to: email,
      from: `"${emailConfig.appName}" <${emailConfig.from}>`,
      subject: `Reset your password for ${emailConfig.appName}`,
      html,
      text,
      tags: { type: "password-reset" },
    })
  );

  if (!result.success) {
    throw new Error(`Failed to send password reset email: ${result.error}`);
  }
}

/**
 * Send password changed notification email
 */
export async function sendPasswordChangedEmail(
  email: string,
  name?: string
): Promise<void> {
  const provider = getEmailProvider();
  const supportEmail = emailConfig.from;

  const { html, text } = renderPasswordChangedEmail({
    name,
    supportEmail,
  });

  const result = await sendWithRetry(() =>
    provider.send({
      to: email,
      from: `"${emailConfig.appName}" <${emailConfig.from}>`,
      subject: `Your password has been changed - ${emailConfig.appName}`,
      html,
      text,
      tags: { type: "password-changed" },
    })
  );

  if (!result.success) {
    throw new Error(`Failed to send password changed email: ${result.error}`);
  }
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<void> {
  const provider = getEmailProvider();
  const loginUrl = `${emailConfig.appUrl}/login`;

  const { html, text } = renderWelcomeEmail({
    name,
    loginUrl,
  });

  const result = await sendWithRetry(() =>
    provider.send({
      to: email,
      from: `"${emailConfig.appName}" <${emailConfig.from}>`,
      subject: `Welcome to ${emailConfig.appName}!`,
      html,
      text,
      tags: { type: "welcome" },
    })
  );

  if (!result.success) {
    throw new Error(`Failed to send welcome email: ${result.error}`);
  }
}

/**
 * Send subscription confirmation email
 */
export async function sendSubscriptionConfirmationEmail(
  email: string,
  data: {
    name?: string;
    planName: string;
    amount: string;
    billingCycle: "monthly" | "yearly";
    nextBillingDate: string;
  }
): Promise<void> {
  const provider = getEmailProvider();
  const manageUrl = `${emailConfig.appUrl}/settings/billing`;

  const { html, text } = renderSubscriptionConfirmationEmail({
    ...data,
    manageUrl,
  });

  const result = await sendWithRetry(() =>
    provider.send({
      to: email,
      from: `"${emailConfig.appName}" <${emailConfig.from}>`,
      subject: `Subscription confirmed - ${emailConfig.appName}`,
      html,
      text,
      tags: { type: "subscription-confirmation" },
    })
  );

  if (!result.success) {
    throw new Error(`Failed to send subscription confirmation email: ${result.error}`);
  }
}
```

---

## 8. US-5.2: Email Templates

### 8.1 Base Layout Component (`src/lib/email/templates/components/layout.tsx`)

```tsx
/**
 * Base email layout component
 * Provides consistent structure for all email templates
 */

import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Tailwind,
} from "@react-email/components";
import * as React from "react";

import { EmailHeader } from "./header";
import { EmailFooter } from "./footer";

interface EmailLayoutProps {
  preview: string;
  children: React.ReactNode;
}

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans">
          <Container className="mx-auto my-10 max-w-[600px]">
            <EmailHeader />
            <Section className="bg-white px-8 py-10 rounded-b-lg border border-t-0 border-gray-200">
              {children}
            </Section>
            <EmailFooter />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
```

### 8.2 Header Component (`src/lib/email/templates/components/header.tsx`)

```tsx
/**
 * Email header component
 */

import { Section, Text } from "@react-email/components";
import * as React from "react";

const appName = process.env["NEXT_PUBLIC_APP_NAME"] || "SaaS Boilerplate";

export function EmailHeader() {
  return (
    <Section className="bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-6 rounded-t-lg">
      <Text className="text-white text-2xl font-bold m-0">{appName}</Text>
    </Section>
  );
}
```

### 8.3 Footer Component (`src/lib/email/templates/components/footer.tsx`)

```tsx
/**
 * Email footer component
 */

import { Section, Text, Link } from "@react-email/components";
import * as React from "react";

const appName = process.env["NEXT_PUBLIC_APP_NAME"] || "SaaS Boilerplate";
const appUrl = process.env["NEXT_PUBLIC_APP_URL"] || "http://localhost:3000";

export function EmailFooter() {
  return (
    <Section className="mt-6 text-center">
      <Text className="text-gray-500 text-sm m-0">
        &copy; {new Date().getFullYear()} {appName}. All rights reserved.
      </Text>
      <Text className="text-gray-400 text-xs mt-2">
        <Link href={appUrl} className="text-gray-400 underline">
          Visit our website
        </Link>
        {" | "}
        <Link href={`${appUrl}/privacy`} className="text-gray-400 underline">
          Privacy Policy
        </Link>
        {" | "}
        <Link href={`${appUrl}/terms`} className="text-gray-400 underline">
          Terms of Service
        </Link>
      </Text>
    </Section>
  );
}
```

### 8.4 Button Component (`src/lib/email/templates/components/button.tsx`)

```tsx
/**
 * Email CTA button component
 */

import { Button as ReactEmailButton } from "@react-email/components";
import * as React from "react";

interface EmailButtonProps {
  href: string;
  children: React.ReactNode;
}

export function EmailButton({ href, children }: EmailButtonProps) {
  return (
    <ReactEmailButton
      href={href}
      className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold px-6 py-3 rounded-md no-underline inline-block"
    >
      {children}
    </ReactEmailButton>
  );
}
```

### 8.5 Welcome Email Template (`src/lib/email/templates/welcome.tsx`)

```tsx
/**
 * Welcome email template
 */

import { Heading, Text, Section } from "@react-email/components";
import * as React from "react";

import { EmailLayout } from "./components/layout";
import { EmailButton } from "./components/button";

import type { WelcomeEmailData } from "../types";

const appName = process.env["NEXT_PUBLIC_APP_NAME"] || "SaaS Boilerplate";

interface WelcomeEmailProps extends WelcomeEmailData {}

export function WelcomeEmail({ name, loginUrl }: WelcomeEmailProps) {
  return (
    <EmailLayout preview={`Welcome to ${appName}!`}>
      <Heading className="text-2xl font-bold text-gray-900 m-0 mb-4">
        Welcome to {appName}!
      </Heading>

      <Text className="text-gray-700 text-base leading-6 mb-4">
        Hi {name},
      </Text>

      <Text className="text-gray-700 text-base leading-6 mb-4">
        Thank you for joining {appName}! We're excited to have you on board.
      </Text>

      <Text className="text-gray-700 text-base leading-6 mb-6">
        Your account has been verified and you're all set to get started.
        Click the button below to log in and explore:
      </Text>

      <Section className="text-center mb-6">
        <EmailButton href={loginUrl}>Get Started</EmailButton>
      </Section>

      <Text className="text-gray-700 text-base leading-6 mb-4">
        Here's what you can do next:
      </Text>

      <ul className="text-gray-700 text-base leading-6 mb-6 pl-4">
        <li>Complete your profile</li>
        <li>Explore our features</li>
        <li>Check out our documentation</li>
      </ul>

      <Text className="text-gray-700 text-base leading-6">
        If you have any questions, feel free to reach out to our support team.
      </Text>

      <Text className="text-gray-700 text-base leading-6 mt-6">
        Best regards,
        <br />
        The {appName} Team
      </Text>
    </EmailLayout>
  );
}

export function renderWelcomeEmail(data: WelcomeEmailData): { html: string; text: string } {
  const { render } = require("@react-email/render");

  const html = render(<WelcomeEmail {...data} />);
  const text = `
Welcome to ${appName}!

Hi ${data.name},

Thank you for joining ${appName}! We're excited to have you on board.

Your account has been verified and you're all set to get started.

Log in here: ${data.loginUrl}

Here's what you can do next:
- Complete your profile
- Explore our features
- Check out our documentation

If you have any questions, feel free to reach out to our support team.

Best regards,
The ${appName} Team
  `.trim();

  return { html, text };
}
```

### 8.6 Email Verification Template (`src/lib/email/templates/verify-email.tsx`)

```tsx
/**
 * Email verification template
 */

import { Heading, Text, Section, Link } from "@react-email/components";
import * as React from "react";

import { EmailLayout } from "./components/layout";
import { EmailButton } from "./components/button";

import type { VerificationEmailData } from "../types";

const appName = process.env["NEXT_PUBLIC_APP_NAME"] || "SaaS Boilerplate";

interface VerifyEmailProps extends VerificationEmailData {}

export function VerifyEmail({ name, verificationUrl, expiresIn }: VerifyEmailProps) {
  const greeting = name ? `Hi ${name},` : "Hi,";

  return (
    <EmailLayout preview="Verify your email address">
      <Heading className="text-2xl font-bold text-gray-900 m-0 mb-4">
        Verify your email address
      </Heading>

      <Text className="text-gray-700 text-base leading-6 mb-4">
        {greeting}
      </Text>

      <Text className="text-gray-700 text-base leading-6 mb-4">
        Thanks for signing up for {appName}! Please verify your email address
        by clicking the button below:
      </Text>

      <Section className="text-center mb-6">
        <EmailButton href={verificationUrl}>Verify Email</EmailButton>
      </Section>

      <Text className="text-gray-500 text-sm leading-6 mb-4">
        Or copy and paste this link into your browser:
      </Text>

      <Text className="bg-gray-100 p-3 rounded text-xs break-all text-gray-600 mb-4">
        {verificationUrl}
      </Text>

      <Text className="text-gray-500 text-sm leading-6 mb-4">
        This link will expire in {expiresIn}.
      </Text>

      <Section className="border-t border-gray-200 pt-4 mt-6">
        <Text className="text-gray-400 text-sm leading-6 m-0">
          If you didn't create an account with {appName}, you can safely ignore this email.
        </Text>
      </Section>
    </EmailLayout>
  );
}

export function renderVerificationEmail(data: VerificationEmailData): { html: string; text: string } {
  const { render } = require("@react-email/render");

  const html = render(<VerifyEmail {...data} />);
  const greeting = data.name ? `Hi ${data.name},` : "Hi,";
  const text = `
Verify your email for ${appName}

${greeting}

Thanks for signing up! Please verify your email address by clicking the link below:

${data.verificationUrl}

This link will expire in ${data.expiresIn}.

If you didn't create an account, you can safely ignore this email.
  `.trim();

  return { html, text };
}
```

### 8.7 Password Reset Template (`src/lib/email/templates/password-reset.tsx`)

```tsx
/**
 * Password reset email template
 */

import { Heading, Text, Section } from "@react-email/components";
import * as React from "react";

import { EmailLayout } from "./components/layout";
import { EmailButton } from "./components/button";

import type { PasswordResetEmailData } from "../types";

const appName = process.env["NEXT_PUBLIC_APP_NAME"] || "SaaS Boilerplate";

interface PasswordResetEmailProps extends PasswordResetEmailData {}

export function PasswordResetEmail({ name, resetUrl, expiresIn }: PasswordResetEmailProps) {
  const greeting = name ? `Hi ${name},` : "Hi,";

  return (
    <EmailLayout preview="Reset your password">
      <Heading className="text-2xl font-bold text-gray-900 m-0 mb-4">
        Reset your password
      </Heading>

      <Text className="text-gray-700 text-base leading-6 mb-4">
        {greeting}
      </Text>

      <Text className="text-gray-700 text-base leading-6 mb-4">
        We received a request to reset your password for your {appName} account.
        Click the button below to choose a new password:
      </Text>

      <Section className="text-center mb-6">
        <EmailButton href={resetUrl}>Reset Password</EmailButton>
      </Section>

      <Text className="text-gray-500 text-sm leading-6 mb-4">
        Or copy and paste this link into your browser:
      </Text>

      <Text className="bg-gray-100 p-3 rounded text-xs break-all text-gray-600 mb-4">
        {resetUrl}
      </Text>

      <Text className="text-gray-500 text-sm leading-6 mb-4">
        This link will expire in {expiresIn}.
      </Text>

      <Section className="border-t border-gray-200 pt-4 mt-6">
        <Text className="text-gray-400 text-sm leading-6 m-0">
          If you didn't request a password reset, you can safely ignore this email.
          Your password will remain unchanged.
        </Text>
      </Section>
    </EmailLayout>
  );
}

export function renderPasswordResetEmail(data: PasswordResetEmailData): { html: string; text: string } {
  const { render } = require("@react-email/render");

  const html = render(<PasswordResetEmail {...data} />);
  const greeting = data.name ? `Hi ${data.name},` : "Hi,";
  const text = `
Reset your password for ${appName}

${greeting}

We received a request to reset your password. Click the link below to choose a new password:

${data.resetUrl}

This link will expire in ${data.expiresIn}.

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
  `.trim();

  return { html, text };
}
```

### 8.8 Password Changed Template (`src/lib/email/templates/password-changed.tsx`)

```tsx
/**
 * Password changed notification email template
 */

import { Heading, Text, Section, Link } from "@react-email/components";
import * as React from "react";

import { EmailLayout } from "./components/layout";

import type { PasswordChangedEmailData } from "../types";

const appName = process.env["NEXT_PUBLIC_APP_NAME"] || "SaaS Boilerplate";

interface PasswordChangedEmailProps extends PasswordChangedEmailData {}

export function PasswordChangedEmail({ name, supportEmail }: PasswordChangedEmailProps) {
  const greeting = name ? `Hi ${name},` : "Hi,";

  return (
    <EmailLayout preview="Your password has been changed">
      <Heading className="text-2xl font-bold text-gray-900 m-0 mb-4">
        Password Changed
      </Heading>

      <Text className="text-gray-700 text-base leading-6 mb-4">
        {greeting}
      </Text>

      <Text className="text-gray-700 text-base leading-6 mb-4">
        Your password for {appName} has been successfully changed.
      </Text>

      <Section className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <Text className="text-yellow-800 text-sm leading-6 m-0">
          <strong>Security Notice:</strong> If you did not make this change,
          please contact our support team immediately at{" "}
          <Link href={`mailto:${supportEmail}`} className="text-yellow-800 underline">
            {supportEmail}
          </Link>{" "}
          to secure your account.
        </Text>
      </Section>

      <Text className="text-gray-500 text-sm leading-6">
        This is an automated security notification from {appName}.
      </Text>
    </EmailLayout>
  );
}

export function renderPasswordChangedEmail(data: PasswordChangedEmailData): { html: string; text: string } {
  const { render } = require("@react-email/render");

  const html = render(<PasswordChangedEmail {...data} />);
  const greeting = data.name ? `Hi ${data.name},` : "Hi,";
  const text = `
Password Changed - ${appName}

${greeting}

Your password has been successfully changed.

SECURITY NOTICE: If you did not make this change, please contact support immediately at ${data.supportEmail} to secure your account.

This is an automated security notification from ${appName}.
  `.trim();

  return { html, text };
}
```

### 8.9 Subscription Confirmation Template (`src/lib/email/templates/subscription-confirm.tsx`)

```tsx
/**
 * Subscription confirmation email template
 */

import { Heading, Text, Section } from "@react-email/components";
import * as React from "react";

import { EmailLayout } from "./components/layout";
import { EmailButton } from "./components/button";

import type { SubscriptionConfirmationData } from "../types";

const appName = process.env["NEXT_PUBLIC_APP_NAME"] || "SaaS Boilerplate";

interface SubscriptionConfirmationEmailProps extends SubscriptionConfirmationData {}

export function SubscriptionConfirmationEmail({
  name,
  planName,
  amount,
  billingCycle,
  nextBillingDate,
  manageUrl,
}: SubscriptionConfirmationEmailProps) {
  const greeting = name ? `Hi ${name},` : "Hi,";

  return (
    <EmailLayout preview={`Your ${planName} subscription is confirmed`}>
      <Heading className="text-2xl font-bold text-gray-900 m-0 mb-4">
        Subscription Confirmed!
      </Heading>

      <Text className="text-gray-700 text-base leading-6 mb-4">
        {greeting}
      </Text>

      <Text className="text-gray-700 text-base leading-6 mb-4">
        Thank you for subscribing to {appName}! Your subscription is now active.
      </Text>

      <Section className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
        <Text className="text-gray-900 font-semibold text-lg m-0 mb-4">
          Subscription Details
        </Text>

        <table className="w-full">
          <tbody>
            <tr>
              <td className="text-gray-500 text-sm py-1">Plan:</td>
              <td className="text-gray-900 text-sm py-1 text-right font-medium">
                {planName}
              </td>
            </tr>
            <tr>
              <td className="text-gray-500 text-sm py-1">Amount:</td>
              <td className="text-gray-900 text-sm py-1 text-right font-medium">
                {amount} / {billingCycle === "monthly" ? "month" : "year"}
              </td>
            </tr>
            <tr>
              <td className="text-gray-500 text-sm py-1">Next billing date:</td>
              <td className="text-gray-900 text-sm py-1 text-right font-medium">
                {nextBillingDate}
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Text className="text-gray-700 text-base leading-6 mb-4">
        You can manage your subscription, update payment methods, or cancel
        anytime from your account settings:
      </Text>

      <Section className="text-center mb-6">
        <EmailButton href={manageUrl}>Manage Subscription</EmailButton>
      </Section>

      <Text className="text-gray-700 text-base leading-6">
        Thank you for your support!
      </Text>

      <Text className="text-gray-700 text-base leading-6 mt-4">
        Best regards,
        <br />
        The {appName} Team
      </Text>
    </EmailLayout>
  );
}

export function renderSubscriptionConfirmationEmail(
  data: SubscriptionConfirmationData
): { html: string; text: string } {
  const { render } = require("@react-email/render");

  const html = render(<SubscriptionConfirmationEmail {...data} />);
  const greeting = data.name ? `Hi ${data.name},` : "Hi,";
  const billingPeriod = data.billingCycle === "monthly" ? "month" : "year";
  const text = `
Subscription Confirmed - ${appName}

${greeting}

Thank you for subscribing to ${appName}! Your subscription is now active.

SUBSCRIPTION DETAILS
-------------------
Plan: ${data.planName}
Amount: ${data.amount} / ${billingPeriod}
Next billing date: ${data.nextBillingDate}

You can manage your subscription here: ${data.manageUrl}

Thank you for your support!

Best regards,
The ${appName} Team
  `.trim();

  return { html, text };
}
```

### 8.10 Template Registry (`src/lib/email/templates/index.ts`)

```typescript
/**
 * Email template registry
 * Central export for all email templates
 */

// Component exports
export { EmailLayout } from "./components/layout";
export { EmailHeader } from "./components/header";
export { EmailFooter } from "./components/footer";
export { EmailButton } from "./components/button";

// Template exports
export { WelcomeEmail, renderWelcomeEmail } from "./welcome";
export { VerifyEmail, renderVerificationEmail } from "./verify-email";
export { PasswordResetEmail, renderPasswordResetEmail } from "./password-reset";
export { PasswordChangedEmail, renderPasswordChangedEmail } from "./password-changed";
export {
  SubscriptionConfirmationEmail,
  renderSubscriptionConfirmationEmail,
} from "./subscription-confirm";
```

---

## 9. Test Strategy

### 9.1 Unit Test Structure

#### Provider Tests (`tests/unit/email/providers/resend.test.ts`)

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

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

  describe("send", () => {
    it("should send email successfully", async () => {
      mockResendSend.mockResolvedValue({
        data: { id: "msg_123" },
        error: null,
      });

      const provider = createResendProvider("test-api-key");
      const result = await provider.send({
        to: "test@example.com",
        from: "sender@example.com",
        subject: "Test Subject",
        html: "<p>Test content</p>",
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("msg_123");
    });

    it("should handle API errors", async () => {
      mockResendSend.mockResolvedValue({
        data: null,
        error: { message: "Invalid API key" },
      });

      const provider = createResendProvider("invalid-key");
      const result = await provider.send({
        to: "test@example.com",
        from: "sender@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid API key");
    });

    it("should handle network errors", async () => {
      mockResendSend.mockRejectedValue(new Error("Network error"));

      const provider = createResendProvider("test-key");
      const result = await provider.send({
        to: "test@example.com",
        from: "sender@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
    });
  });
});
```

#### Template Tests (`tests/unit/email/templates/verify-email.test.tsx`)

```typescript
import { describe, it, expect } from "vitest";
import { renderVerificationEmail } from "@/lib/email/templates";

describe("Verification Email Template", () => {
  const baseData = {
    verificationUrl: "https://example.com/verify?token=abc123",
    expiresIn: "24 hours",
  };

  describe("renderVerificationEmail", () => {
    it("should render HTML with verification URL", () => {
      const { html } = renderVerificationEmail(baseData);

      expect(html).toContain(baseData.verificationUrl);
      expect(html).toContain("Verify your email");
    });

    it("should include expiry information", () => {
      const { html, text } = renderVerificationEmail(baseData);

      expect(html).toContain("24 hours");
      expect(text).toContain("24 hours");
    });

    it("should personalize with name when provided", () => {
      const { html, text } = renderVerificationEmail({
        ...baseData,
        name: "John",
      });

      expect(html).toContain("Hi John");
      expect(text).toContain("Hi John");
    });

    it("should use generic greeting without name", () => {
      const { html, text } = renderVerificationEmail(baseData);

      expect(html).toContain("Hi,");
      expect(text).toContain("Hi,");
    });

    it("should generate plain text version", () => {
      const { text } = renderVerificationEmail(baseData);

      expect(text).toContain(baseData.verificationUrl);
      expect(text).not.toContain("<");  // No HTML tags
    });
  });
});
```

#### Email Service Tests (`tests/unit/email/email.test.ts`)

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the email provider
const mockSend = vi.fn();
vi.mock("@/lib/email/client", () => ({
  getEmailProvider: () => ({
    name: "mock",
    send: mockSend,
  }),
}));

import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendWelcomeEmail,
  sendSubscriptionConfirmationEmail,
} from "@/lib/email";

describe("Email Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockResolvedValue({ success: true, messageId: "test-id" });
  });

  describe("sendVerificationEmail", () => {
    it("should send email with correct parameters", async () => {
      await sendVerificationEmail("user@example.com", "token123", "John");

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "user@example.com",
          subject: expect.stringContaining("Verify"),
        })
      );
    });

    it("should include verification URL with token", async () => {
      await sendVerificationEmail("user@example.com", "token123");

      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.html).toContain("token123");
    });

    it("should throw on send failure", async () => {
      mockSend.mockResolvedValue({ success: false, error: "SMTP error" });

      await expect(
        sendVerificationEmail("user@example.com", "token")
      ).rejects.toThrow("Failed to send verification email");
    });

    it("should retry on failure", async () => {
      mockSend
        .mockResolvedValueOnce({ success: false, error: "Temp error" })
        .mockResolvedValueOnce({ success: true, messageId: "id" });

      await sendVerificationEmail("user@example.com", "token");

      expect(mockSend).toHaveBeenCalledTimes(2);
    });
  });

  describe("sendPasswordResetEmail", () => {
    it("should send email with reset URL", async () => {
      await sendPasswordResetEmail("user@example.com", "reset-token");

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "user@example.com",
          subject: expect.stringContaining("Reset"),
        })
      );
    });
  });

  describe("sendPasswordChangedEmail", () => {
    it("should send security notification", async () => {
      await sendPasswordChangedEmail("user@example.com", "John");

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "user@example.com",
          subject: expect.stringContaining("changed"),
        })
      );
    });
  });

  describe("sendWelcomeEmail", () => {
    it("should send welcome email with login URL", async () => {
      await sendWelcomeEmail("user@example.com", "John");

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "user@example.com",
          subject: expect.stringContaining("Welcome"),
        })
      );
    });
  });

  describe("sendSubscriptionConfirmationEmail", () => {
    it("should send confirmation with subscription details", async () => {
      await sendSubscriptionConfirmationEmail("user@example.com", {
        name: "John",
        planName: "Pro",
        amount: "$19",
        billingCycle: "monthly",
        nextBillingDate: "Jan 1, 2026",
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "user@example.com",
          subject: expect.stringContaining("Subscription"),
        })
      );
    });
  });
});
```

### 9.2 Integration Tests

```typescript
// tests/integration/email.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";

describe("Email Integration", () => {
  // These tests run against actual Mailpit in CI/CD
  const MAILPIT_API = "http://localhost:8025/api/v1";

  beforeAll(async () => {
    // Clear mailbox before tests
    await fetch(`${MAILPIT_API}/messages`, { method: "DELETE" });
  });

  it.skip("should deliver email to Mailpit", async () => {
    // This test requires Mailpit to be running
    // Enable in CI/CD with proper setup
  });
});
```

### 9.3 E2E Tests

```typescript
// tests/e2e/email.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Email Flows", () => {
  test("registration sends verification email", async ({ page }) => {
    // Navigate to registration
    await page.goto("/register");

    // Fill form
    await page.fill('[name="name"]', "Test User");
    await page.fill('[name="email"]', `test-${Date.now()}@example.com`);
    await page.fill('[name="password"]', "TestPassword123!");
    await page.fill('[name="confirmPassword"]', "TestPassword123!");

    // Submit
    await page.click('button[type="submit"]');

    // Verify success message
    await expect(page.getByText(/check your email/i)).toBeVisible();

    // In a full E2E setup, we would check Mailpit API for the email
  });

  test("forgot password sends reset email", async ({ page }) => {
    await page.goto("/forgot-password");

    await page.fill('[name="email"]', "existing@example.com");
    await page.click('button[type="submit"]');

    await expect(page.getByText(/if an account exists/i)).toBeVisible();
  });
});
```

---

## 10. Security Considerations

### 10.1 Email Security

| Concern | Mitigation |
|---------|------------|
| Email Injection | Validate all email addresses with Zod |
| Token Exposure | Use cryptographically secure random tokens |
| Rate Limiting | Limit email sends per user/IP |
| Phishing Prevention | Consistent branding, clear sender info |
| Data Leakage | Don't expose user existence in error messages |

### 10.2 Token Security

```typescript
// Token generation best practices (already implemented in auth)
import crypto from "crypto";

// Use 32 bytes (256 bits) of entropy
const token = crypto.randomBytes(32).toString("hex");

// Short expiration for sensitive operations
const VERIFICATION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const PASSWORD_RESET_EXPIRY = 60 * 60 * 1000;    // 1 hour
```

### 10.3 Environment Security

```env
# Never commit these values
RESEND_API_KEY=re_xxxx...  # Store in secrets manager
EMAIL_FROM=noreply@yourdomain.com
```

### 10.4 Content Security

- Escape all user-provided content in templates
- Use text-only alternatives for accessibility
- Include unsubscribe links where applicable (for marketing emails)

---

## 11. Integration Points

### 11.1 Auth Flow Integration

Update existing auth actions to use new email service:

```typescript
// src/actions/auth/register.ts
import { sendVerificationEmail } from "@/lib/email";

// After user creation:
await sendVerificationEmail(user.email, verificationToken, user.name);
```

```typescript
// src/actions/auth/forgot-password.ts
import { sendPasswordResetEmail } from "@/lib/email";

// After token creation:
await sendPasswordResetEmail(email, resetToken);
```

```typescript
// src/actions/auth/reset-password.ts
import { sendPasswordChangedEmail } from "@/lib/email";

// After password update:
await sendPasswordChangedEmail(email);
```

### 11.2 Subscription Flow Integration

Add email triggers to Stripe webhook handlers:

```typescript
// src/lib/stripe/webhooks.ts
import { sendSubscriptionConfirmationEmail } from "@/lib/email";

export async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // ... existing logic ...

  // Send confirmation email
  const user = await db.user.findUnique({ where: { id: metadata.userId } });
  if (user?.email) {
    await sendSubscriptionConfirmationEmail(user.email, {
      name: user.name ?? undefined,
      planName: plan,
      amount: formatAmount(stripeSubscription.items.data[0]?.price?.unit_amount),
      billingCycle: stripeSubscription.items.data[0]?.price?.recurring?.interval === "year"
        ? "yearly"
        : "monthly",
      nextBillingDate: formatDate(stripeSubscription.current_period_end),
    });
  }
}
```

### 11.3 Welcome Email Integration

Send welcome email after email verification:

```typescript
// src/actions/auth/verify-email.ts
import { sendWelcomeEmail } from "@/lib/email";

// After successful verification:
const user = await db.user.findUnique({ where: { email: tokenRecord.identifier } });
if (user) {
  await sendWelcomeEmail(user.email, user.name || "there");
}
```

---

## 12. Environment Configuration

### 12.1 Development Environment

```env
# .env (development)
NODE_ENV=development

# Email - Uses Mailpit
SMTP_HOST=localhost
SMTP_PORT=1025
EMAIL_FROM=noreply@localhost

# Resend API key not required in development
# RESEND_API_KEY=
```

### 12.2 Production Environment

```env
# .env.production
NODE_ENV=production

# Email - Uses Resend
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com

# SMTP settings not required with Resend
# SMTP_HOST=
# SMTP_PORT=
```

### 12.3 Testing Environment

```env
# .env.test
NODE_ENV=test

# Use Mailpit for integration tests
SMTP_HOST=localhost
SMTP_PORT=1025
EMAIL_FROM=test@localhost
```

### 12.4 Docker Compose (already configured)

```yaml
# docker-compose.yml
mailpit:
  image: axllent/mailpit:latest
  ports:
    - "1025:1025"   # SMTP
    - "8025:8025"   # Web UI
```

---

## 13. Acceptance Criteria

### 13.1 US-5.1: Email Infrastructure

| # | Criterion | Test Type |
|---|-----------|-----------|
| AC-5.1.1 | Resend client correctly configured and can send emails in production | Integration |
| AC-5.1.2 | Nodemailer client works with Mailpit in development | Integration |
| AC-5.1.3 | Email provider automatically selected based on environment | Unit |
| AC-5.1.4 | Retry logic handles transient failures | Unit |
| AC-5.1.5 | Error handling provides meaningful error messages | Unit |
| AC-5.1.6 | Email sending functions have proper TypeScript types | Compile |
| AC-5.1.7 | All existing email tests pass after refactoring | Unit |

### 13.2 US-5.2: Email Templates

| # | Criterion | Test Type |
|---|-----------|-----------|
| AC-5.2.1 | Welcome email renders correctly with user name | Unit |
| AC-5.2.2 | Email verification template includes token URL | Unit |
| AC-5.2.3 | Password reset template includes expiry warning | Unit |
| AC-5.2.4 | Password changed template includes security notice | Unit |
| AC-5.2.5 | Subscription confirmation shows plan details | Unit |
| AC-5.2.6 | All templates have plain text alternatives | Unit |
| AC-5.2.7 | Templates use consistent branding (colors, fonts) | Visual |
| AC-5.2.8 | Templates are mobile responsive | Visual |
| AC-5.2.9 | React Email preview works (`pnpm email:dev`) | Manual |

---

## 14. Implementation Checklist

### Phase 1: Infrastructure (US-5.1)

- [ ] **1.1 Types and Interfaces**
  - [ ] Create `src/lib/email/types.ts`
  - [ ] Define `EmailProvider` interface
  - [ ] Define `SendEmailOptions` and `SendEmailResult`
  - [ ] Define template data types

- [ ] **1.2 Configuration**
  - [ ] Create `src/lib/email/config.ts`
  - [ ] Implement environment-based provider selection
  - [ ] Define email constants (expiry times, retry config)

- [ ] **1.3 Resend Provider**
  - [ ] Create `src/lib/email/providers/resend.ts`
  - [ ] Implement `EmailProvider` interface
  - [ ] Handle API responses and errors
  - [ ] Write unit tests

- [ ] **1.4 Nodemailer Provider**
  - [ ] Create `src/lib/email/providers/nodemailer.ts`
  - [ ] Implement `EmailProvider` interface
  - [ ] Configure for Mailpit compatibility
  - [ ] Write unit tests

- [ ] **1.5 Email Client Factory**
  - [ ] Create `src/lib/email/client.ts`
  - [ ] Implement provider singleton pattern
  - [ ] Write unit tests

- [ ] **1.6 Email Service Facade**
  - [ ] Update `src/lib/email/index.ts`
  - [ ] Implement retry logic
  - [ ] Maintain backward compatibility with existing API
  - [ ] Update existing tests

### Phase 2: Templates (US-5.2)

- [ ] **2.1 Base Components**
  - [ ] Create `src/lib/email/templates/components/layout.tsx`
  - [ ] Create `src/lib/email/templates/components/header.tsx`
  - [ ] Create `src/lib/email/templates/components/footer.tsx`
  - [ ] Create `src/lib/email/templates/components/button.tsx`

- [ ] **2.2 Email Templates**
  - [ ] Create `src/lib/email/templates/welcome.tsx`
  - [ ] Create `src/lib/email/templates/verify-email.tsx`
  - [ ] Create `src/lib/email/templates/password-reset.tsx`
  - [ ] Create `src/lib/email/templates/password-changed.tsx`
  - [ ] Create `src/lib/email/templates/subscription-confirm.tsx`

- [ ] **2.3 Template Registry**
  - [ ] Create `src/lib/email/templates/index.ts`
  - [ ] Export all templates and render functions

- [ ] **2.4 Template Tests**
  - [ ] Write tests for each template
  - [ ] Test HTML and text rendering
  - [ ] Test personalization

### Phase 3: Integration

- [ ] **3.1 Auth Integration**
  - [ ] Update `src/actions/auth/register.ts`
  - [ ] Update `src/actions/auth/forgot-password.ts`
  - [ ] Update `src/actions/auth/reset-password.ts`
  - [ ] Add welcome email to `src/actions/auth/verify-email.ts`

- [ ] **3.2 Subscription Integration**
  - [ ] Update `src/lib/stripe/webhooks.ts`
  - [ ] Send confirmation on `checkout.session.completed`

- [ ] **3.3 Testing**
  - [ ] Run all unit tests
  - [ ] Run integration tests (with Mailpit)
  - [ ] Run E2E tests
  - [ ] Manual testing in development

### Phase 4: Documentation and Cleanup

- [ ] **4.1 Documentation**
  - [ ] Update CLAUDE.md if needed
  - [ ] Add inline code documentation

- [ ] **4.2 Cleanup**
  - [ ] Remove unused code
  - [ ] Ensure consistent code style
  - [ ] Final review and refactor

---

## Appendix A: Email Preview Setup

To enable React Email preview during development:

```bash
# Start the preview server
pnpm email:dev
```

The script is already configured in `package.json`:
```json
{
  "scripts": {
    "email:dev": "email dev"
  }
}
```

This will start a local server at `http://localhost:3001` where you can preview all email templates.

---

## Appendix B: Mailpit Usage

### Accessing Mailpit UI

When running Docker Compose:
```bash
docker compose up -d mailpit
```

Access the web UI at: `http://localhost:8025`

### Mailpit API

Check received emails programmatically:
```bash
# Get all messages
curl http://localhost:8025/api/v1/messages

# Delete all messages
curl -X DELETE http://localhost:8025/api/v1/messages
```

---

## Appendix C: Resend Dashboard

For production email monitoring:

1. Log in to [Resend Dashboard](https://resend.com/dashboard)
2. View sent emails, bounces, and deliverability metrics
3. Configure domain verification for better deliverability
4. Set up webhooks for delivery status updates (optional)

---

**Document End**

This technical architecture document provides a complete blueprint for implementing Epic 5 Email. Development agents should use this as a definitive reference for TDD implementation.
