/**
 * Password changed notification email template
 * Sent when user's password has been successfully changed
 */

import { Section, Text, Link } from "@react-email/components";
import * as React from "react";

import { EmailLayout, EmailHeader, EmailFooter } from "./components";

export interface PasswordChangedEmailProps {
  name?: string;
  supportEmail: string;
  appName?: string;
  appUrl?: string;
}

/**
 * Password changed notification email
 */
export function PasswordChangedEmail({
  name,
  supportEmail,
  appName = "SaaS Boilerplate",
  appUrl = "http://localhost:3000",
}: PasswordChangedEmailProps) {
  const greeting = name ? `Hi ${name},` : "Hi there,";
  const previewText = `Your ${appName} password has been changed`;

  return (
    <EmailLayout preview={previewText}>
      <EmailHeader appName={appName} />
      <Section style={contentStyle}>
        <Text style={greetingStyle}>{greeting}</Text>
        <Text style={headingStyle}>Password Changed</Text>
        <Text style={paragraphStyle}>
          Your password has been successfully changed.
        </Text>
        <Text style={paragraphStyle}>
          If you did not make this change, please contact our support team
          immediately at{" "}
          <Link href={`mailto:${supportEmail}`} style={linkStyle}>
            {supportEmail}
          </Link>{" "}
          and secure your account.
        </Text>
        <Section style={securityBoxStyle}>
          <Text style={securityBoxTitleStyle}>Security Tips</Text>
          <Text style={securityBoxTextStyle}>
            - Use a strong, unique password for each account
            <br />
            - Enable two-factor authentication when available
            <br />
            - Never share your password with anyone
          </Text>
        </Section>
        <Text style={signatureStyle}>
          Best regards,
          <br />
          The {appName} Security Team
        </Text>
      </Section>
      <EmailFooter appName={appName} appUrl={appUrl} supportEmail={supportEmail} />
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

const linkStyle: React.CSSProperties = {
  color: "#667eea",
  textDecoration: "none",
  fontWeight: 600,
};

const securityBoxStyle: React.CSSProperties = {
  backgroundColor: "#f8f9fa",
  padding: "20px",
  borderRadius: "6px",
  margin: "20px 0",
  borderLeft: "4px solid #667eea",
};

const securityBoxTitleStyle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 600,
  color: "#333333",
  margin: "0 0 12px",
};

const securityBoxTextStyle: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: 1.8,
  color: "#555555",
  margin: 0,
};

const signatureStyle: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: 1.6,
  color: "#555555",
  marginTop: "24px",
};

export default PasswordChangedEmail;
