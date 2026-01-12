/**
 * Welcome email template
 * Sent after user completes email verification
 */

import * as React from "react";
import { Section, Text } from "@react-email/components";
import { EmailLayout, EmailHeader, EmailFooter, EmailButton } from "./components";

export interface WelcomeEmailProps {
  name?: string;
  loginUrl: string;
  appName?: string;
  appUrl?: string;
}

/**
 * Welcome email sent after successful email verification
 */
export function WelcomeEmail({
  name,
  loginUrl,
  appName = "SaaS App",
  appUrl = "http://localhost:3000",
}: WelcomeEmailProps) {
  const greeting = name ? `Hi ${name},` : "Hi there,";
  const previewText = `Welcome to ${appName}! Your account is ready.`;

  return (
    <EmailLayout preview={previewText}>
      <EmailHeader appName={appName} />
      <Section style={contentStyle}>
        <Text style={greetingStyle}>{greeting}</Text>
        <Text style={paragraphStyle}>
          Welcome to {appName}! Your email has been verified and your account is
          now ready to use.
        </Text>
        <Text style={paragraphStyle}>
          We are excited to have you on board. Click the button below to log in
          and start exploring all the features available to you.
        </Text>
        <EmailButton href={loginUrl}>Get Started</EmailButton>
        <Text style={paragraphStyle}>
          If you have any questions, do not hesitate to reach out to our support
          team. We are here to help!
        </Text>
        <Text style={signatureStyle}>
          Best regards,
          <br />
          The {appName} Team
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
  fontSize: "18px",
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

const signatureStyle: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: 1.6,
  color: "#555555",
  marginTop: "24px",
};

export default WelcomeEmail;
