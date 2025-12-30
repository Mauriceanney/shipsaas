/**
 * Day 3 dunning reminder email template
 * Sent when a user's payment has failed and it's been 3 days
 */

import { Section, Text, Row, Column } from "@react-email/components";
import * as React from "react";

import { EmailLayout, EmailHeader, EmailFooter, EmailButton } from "./components";

export interface DunningReminderEmailProps {
  name?: string;
  planName: string;
  daysSinceFailed: number;
  updatePaymentUrl: string;
  appName?: string;
  appUrl?: string;
}

/**
 * Day 3 reminder email - Friendly reminder to update payment method
 */
export function DunningReminderEmail({
  name,
  planName,
  daysSinceFailed,
  updatePaymentUrl,
  appName = "SaaS Boilerplate",
  appUrl = "http://localhost:3000",
}: DunningReminderEmailProps) {
  const greeting = name ? `Hi ${name},` : "Hi there,";
  const previewText = `Reminder: Update your payment method for ${planName}`;

  return (
    <EmailLayout preview={previewText}>
      <EmailHeader appName={appName} />
      <Section style={contentStyle}>
        <Text style={greetingStyle}>{greeting}</Text>
        <Text style={headingStyle}>Reminder: Update Your Payment Method</Text>
        <Text style={paragraphStyle}>
          We wanted to remind you that we were unable to process your payment for
          your {planName} subscription about {daysSinceFailed} days ago.
        </Text>

        <Section style={detailsBoxStyle}>
          <Row>
            <Column style={detailLabelStyle}>Plan</Column>
            <Column style={detailValueStyle}>{planName}</Column>
          </Row>
          <Row>
            <Column style={detailLabelStyle}>Days Since Failed</Column>
            <Column style={detailValueStyle}>{`${daysSinceFailed} days ago`}</Column>
          </Row>
        </Section>

        <Text style={paragraphStyle}>
          <strong>Your account is still active</strong>, but we need you to update
          your payment method to ensure uninterrupted service.
        </Text>

        <Text style={paragraphStyle}>
          Please update your payment information as soon as possible to avoid any
          service disruption.
        </Text>

        <EmailButton href={updatePaymentUrl}>Update Payment Method</EmailButton>

        <Text style={paragraphStyle}>
          If you have any questions or need assistance, please don&apos;t hesitate
          to contact our support team. We&apos;re here to help!
        </Text>

        <Text style={signatureStyle}>
          Thank you for being a {appName} customer!
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
  fontSize: "16px",
  color: "#555555",
  margin: "0 0 8px",
};

const headingStyle: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: 600,
  color: "#f59e0b",
  margin: "0 0 20px",
};

const paragraphStyle: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: 1.6,
  color: "#555555",
  margin: "0 0 16px",
};

const detailsBoxStyle: React.CSSProperties = {
  backgroundColor: "#fef3c7",
  padding: "20px",
  borderRadius: "6px",
  margin: "20px 0",
  borderLeft: "4px solid #f59e0b",
};

const detailLabelStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#666666",
  padding: "8px 0",
  width: "160px",
};

const detailValueStyle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 600,
  color: "#333333",
  padding: "8px 0",
};

const signatureStyle: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: 1.6,
  color: "#555555",
  marginTop: "24px",
};

export default DunningReminderEmail;
