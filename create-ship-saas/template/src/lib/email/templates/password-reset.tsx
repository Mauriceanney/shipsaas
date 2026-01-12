/**
 * Password reset email template
 * Sent when user requests a password reset
 */

import * as React from "react";
import { Section, Text, Link } from "@react-email/components";
import { EmailLayout, EmailHeader, EmailFooter, EmailButton } from "./components";

export interface PasswordResetEmailProps {
  name?: string;
  resetUrl: string;
  expiresIn: string;
  appName?: string;
  appUrl?: string;
}

/**
 * Password reset email template with reset link
 */
export function PasswordResetEmail({
  name,
  resetUrl,
  expiresIn,
  appName = "SaaS App",
  appUrl = "http://localhost:3000",
}: PasswordResetEmailProps) {
  const greeting = name ? `Hi ${name},` : "Hi there,";
  const previewText = `Reset your password for ${appName}`;

  return (
    <EmailLayout preview={previewText}>
      <EmailHeader appName={appName} />
      <Section style={contentStyle}>
        <Text style={greetingStyle}>{greeting}</Text>
        <Text style={headingStyle}>Reset your password</Text>
        <Text style={paragraphStyle}>
          We received a request to reset your password. Click the button below
          to choose a new password:
        </Text>
        <EmailButton href={resetUrl}>Reset Password</EmailButton>
        <Text style={fallbackTextStyle}>
          Or copy and paste this link into your browser:
        </Text>
        <Text style={linkBoxStyle}>
          <Link href={resetUrl} style={linkStyle}>
            {resetUrl}
          </Link>
        </Text>
        <Text style={expiryStyle}>
          This link will expire in {expiresIn}.
        </Text>
        <Text style={securityNoteStyle}>
          If you did not request a password reset, you can safely ignore this
          email. Your password will remain unchanged.
        </Text>
      </Section>
      <EmailFooter appName={appName} appUrl={appUrl} />
    </EmailLayout>
  );
}

const contentStyle: React.CSSProperties = {
  padding: "30px 40px",
};

const greetingStyle: React.CSSProperties = {
  fontSize: "16px",
  color: "#555555",
  margin: "0 0 8px",
};

const headingStyle: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: 600,
  color: "#333333",
  margin: "0 0 20px",
};

const paragraphStyle: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: 1.6,
  color: "#555555",
  margin: "0 0 16px",
};

const fallbackTextStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#666666",
  margin: "0 0 8px",
};

const linkBoxStyle: React.CSSProperties = {
  backgroundColor: "#f5f5f5",
  padding: "12px",
  borderRadius: "4px",
  wordBreak: "break-all",
  fontSize: "12px",
  margin: "0 0 16px",
};

const linkStyle: React.CSSProperties = {
  color: "#667eea",
  textDecoration: "none",
};

const expiryStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#666666",
  margin: "0 0 16px",
};

const securityNoteStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#999999",
  marginTop: "24px",
};

export default PasswordResetEmail;
