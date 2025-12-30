/**
 * Day 7 final warning email template
 * Sent when a user's payment has failed and it's been 7 days
 */

import { Section, Text, Row, Column } from "@react-email/components";
import * as React from "react";

import { EmailLayout, EmailHeader, EmailFooter, EmailButton } from "./components";

export interface DunningFinalWarningEmailProps {
  name?: string;
  planName: string;
  daysSinceFailed: number;
  suspensionDate: string;
  updatePaymentUrl: string;
  appName?: string;
  appUrl?: string;
}

/**
 * Day 7 final warning email - Urgent warning about service suspension
 */
export function DunningFinalWarningEmail({
  name,
  planName,
  daysSinceFailed,
  suspensionDate,
  updatePaymentUrl,
  appName = "SaaS Boilerplate",
  appUrl = "http://localhost:3000",
}: DunningFinalWarningEmailProps) {
  const greeting = name ? `Hi ${name},` : "Hi there,";
  const previewText = `URGENT: Update payment to avoid service suspension - ${planName}`;

  return (
    <EmailLayout preview={previewText}>
      <EmailHeader appName={appName} />
      <Section style={contentStyle}>
        <Text style={greetingStyle}>{greeting}</Text>
        <Text style={headingStyle}>URGENT: Update Payment to Avoid Service Suspension</Text>
        <Text style={paragraphStyle}>
          <strong>This is a final warning.</strong> We have been unable to process
          your payment for your {planName} subscription for {daysSinceFailed} days.
        </Text>

        <Section style={warningBoxStyle}>
          <Text style={warningHeadingStyle}>Service Suspension Notice</Text>
          <Text style={warningTextStyle}>
            If we do not receive payment by <strong>{suspensionDate}</strong>, your
            subscription will be suspended and you will lose access to all {planName} features.
          </Text>
        </Section>

        <Section style={detailsBoxStyle}>
          <Row>
            <Column style={detailLabelStyle}>Plan</Column>
            <Column style={detailValueStyle}>{planName}</Column>
          </Row>
          <Row>
            <Column style={detailLabelStyle}>Days Since Failed</Column>
            <Column style={detailValueStyle}>{`${daysSinceFailed} days ago`}</Column>
          </Row>
          <Row>
            <Column style={detailLabelStyle}>Suspension Date</Column>
            <Column style={detailValueStyle}>{suspensionDate}</Column>
          </Row>
        </Section>

        <Text style={paragraphStyle}>
          <strong>Action Required Now:</strong>
        </Text>
        <Text style={paragraphStyle}>
          Please update your payment method immediately to maintain uninterrupted
          access to your account. This only takes a minute and will restore your
          subscription instantly.
        </Text>

        <EmailButton href={updatePaymentUrl}>Update Payment Method Now</EmailButton>

        <Text style={paragraphStyle}>
          If you&apos;re experiencing issues with your payment method or need help,
          please contact our support team immediately. We want to help you maintain
          your access.
        </Text>

        <Text style={signatureStyle}>
          We value your business and hope to resolve this quickly.
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
  color: "#dc2626",
  margin: "0 0 20px",
};

const paragraphStyle: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: 1.6,
  color: "#555555",
  margin: "0 0 16px",
};

const warningBoxStyle: React.CSSProperties = {
  backgroundColor: "#fef2f2",
  padding: "24px",
  borderRadius: "6px",
  margin: "20px 0",
  border: "2px solid #dc2626",
};

const warningHeadingStyle: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 700,
  color: "#dc2626",
  margin: "0 0 12px",
  textTransform: "uppercase",
};

const warningTextStyle: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: 1.6,
  color: "#991b1b",
  margin: "0",
};

const detailsBoxStyle: React.CSSProperties = {
  backgroundColor: "#fef2f2",
  padding: "20px",
  borderRadius: "6px",
  margin: "20px 0",
  borderLeft: "4px solid #dc2626",
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

export default DunningFinalWarningEmail;
