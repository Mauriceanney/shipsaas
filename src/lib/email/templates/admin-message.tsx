/**
 * Admin message email template
 * Sent when admin sends a message to a user
 */

import { Section, Text } from "@react-email/components";
import * as React from "react";

import { EmailLayout, EmailHeader, EmailFooter } from "./components";

export interface AdminMessageEmailProps {
  recipientName?: string;
  subject: string;
  body: string;
  adminName: string;
  appName?: string;
  appUrl?: string;
}

/**
 * Admin message email template
 * Displays a message from admin to a user
 */
export function AdminMessageEmail({
  recipientName,
  subject,
  body,
  adminName,
  appName = "SaaS Boilerplate",
  appUrl = "http://localhost:3000",
}: AdminMessageEmailProps) {
  const greeting = recipientName ? `Hi ${recipientName},` : "Hi there,";
  const previewText = `Message from ${appName}: ${subject}`;

  // Convert line breaks to <br> elements for HTML email
  const formattedBody = body.split("\n").map((line, index, array) => (
    <React.Fragment key={index}>
      {line}
      {index < array.length - 1 && <br />}
    </React.Fragment>
  ));

  return (
    <EmailLayout preview={previewText}>
      <EmailHeader appName={appName} />
      <Section style={contentStyle}>
        <Text style={greetingStyle}>{greeting}</Text>
        <Text style={paragraphStyle}>{formattedBody}</Text>
        <Text style={signatureStyle}>
          Best regards,
          <br />
          {adminName}
          <br />
          <span style={teamStyle}>The {appName} Team</span>
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

const teamStyle: React.CSSProperties = {
  color: "#888888",
  fontSize: "14px",
};

export default AdminMessageEmail;
