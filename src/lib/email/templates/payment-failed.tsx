/**
 * Payment failed email template
 * Sent when a user's subscription payment fails
 */

import { Section, Text, Row, Column } from "@react-email/components";
import * as React from "react";

import { EmailLayout, EmailHeader, EmailFooter, EmailButton } from "./components";

export interface PaymentFailedEmailProps {
  name?: string;
  planName: string;
  amount: string;
  failedDate: string;
  nextRetryDate?: string;
  updatePaymentUrl: string;
  appName?: string;
  appUrl?: string;
}

/**
 * Payment failed email with payment details and recovery instructions
 */
export function PaymentFailedEmail({
  name,
  planName,
  amount,
  failedDate,
  nextRetryDate,
  updatePaymentUrl,
  appName = "SaaS Boilerplate",
  appUrl = "http://localhost:3000",
}: PaymentFailedEmailProps) {
  const greeting = name ? `Hi ${name},` : "Hi there,";
  const previewText = `We couldn't process your payment for ${planName}. Please update your payment method.`;

  const retryMessage = nextRetryDate
    ? `We'll automatically retry your payment on ${nextRetryDate}.`
    : "We'll automatically retry your payment within the next few days.";

  return (
    <EmailLayout preview={previewText}>
      <EmailHeader appName={appName} />
      <Section style={contentStyle}>
        <Text style={greetingStyle}>{greeting}</Text>
        <Text style={headingStyle}>Payment Failed - Action Required</Text>
        <Text style={paragraphStyle}>
          We couldn&apos;t process your payment for your {planName} subscription.
          Don&apos;t worry - your access is still active, but we need you to
          update your payment method to avoid any interruption.
        </Text>

        <Section style={detailsBoxStyle}>
          <Row>
            <Column style={detailLabelStyle}>Plan</Column>
            <Column style={detailValueStyle}>{planName}</Column>
          </Row>
          <Row>
            <Column style={detailLabelStyle}>Amount</Column>
            <Column style={detailValueStyle}>{amount}</Column>
          </Row>
          <Row>
            <Column style={detailLabelStyle}>Failed Date</Column>
            <Column style={detailValueStyle}>{failedDate}</Column>
          </Row>
        </Section>

        <Text style={paragraphStyle}>
          <strong>What happens next?</strong>
        </Text>
        <Text style={paragraphStyle}>
          {retryMessage} If the payment continues to fail, your subscription may
          be suspended. To avoid this, please update your payment method now.
        </Text>

        <EmailButton href={updatePaymentUrl}>Update Payment Method</EmailButton>

        <Text style={paragraphStyle}>
          If you believe this is a mistake or need help, please contact our
          support team. We&apos;re here to help you resolve this quickly.
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
  color: "#dc2626",
  margin: "0 0 20px",
};

const paragraphStyle: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: 1.6,
  color: "#555555",
  margin: "0 0 16px",
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
  width: "140px",
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

export default PaymentFailedEmail;
