/**
 * Email system type definitions
 */

// ============================================
// EMAIL ADDRESS TYPES
// ============================================

/**
 * Email address with optional display name
 */
export interface EmailAddress {
  email: string;
  name?: string;
}

/**
 * Email attachment
 */
export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

// ============================================
// SEND EMAIL TYPES
// ============================================

/**
 * Options for sending an email
 */
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

/**
 * Result of sending an email
 */
export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ============================================
// PROVIDER TYPES
// ============================================

/**
 * Email provider interface
 * Implementations: Resend, Nodemailer
 */
export interface EmailProvider {
  name: string;
  send(options: SendEmailOptions): Promise<SendEmailResult>;
}

// ============================================
// CONFIGURATION TYPES
// ============================================

/**
 * Email configuration
 */
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

// ============================================
// TEMPLATE DATA TYPES
// ============================================

/**
 * Data for email verification template
 */
export interface VerificationEmailData {
  name?: string;
  verificationUrl: string;
  expiresIn: string;
}

/**
 * Data for password reset template
 */
export interface PasswordResetEmailData {
  name?: string;
  resetUrl: string;
  expiresIn: string;
}

/**
 * Data for welcome email template
 */
export interface WelcomeEmailData {
  name: string;
  loginUrl: string;
}

/**
 * Data for password changed notification template
 */
export interface PasswordChangedEmailData {
  name?: string;
  supportEmail: string;
}

/**
 * Data for subscription confirmation template
 */
export interface SubscriptionConfirmationData {
  name?: string;
  planName: string;
  amount: string;
  billingCycle: "monthly" | "yearly";
  nextBillingDate: string;
  manageUrl: string;
}
