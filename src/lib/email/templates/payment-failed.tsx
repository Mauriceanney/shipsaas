/**
 * Payment Failed Email Template
 *
 * Sent when a payment fails (Day 0 of dunning flow)
 */

import * as React from "react";
import { Section, Text } from "@react-email/components";
import { EmailLayout, EmailHeader, EmailFooter, EmailButton } from "./components";

export interface PaymentFailedEmailProps {
  name?: string;
  planName: string;
  amount: string;
  updatePaymentUrl: string;
  appName?: string;
  appUrl?: string;
}

/**
 * Payment failed email - immediate notification
 */
export function PaymentFailedEmail({
  name,
  planName,
  amount,
  updatePaymentUrl,
  appName = "SaaS App",
  appUrl = "http://localhost:3000",
}: PaymentFailedEmailProps) {
  const greeting = name ? `Hi ${name},` : "Hi there,";
  const previewText = `Action required: Your ${planName} payment failed`;

  return (
    <EmailLayout preview={previewText}>
      <EmailHeader appName={appName} />
      <Section style={contentStyle}>
        <Text style={greetingStyle}>{greeting}</Text>
        <Text style={headingStyle}>Payment Failed</Text>
        <Text style={paragraphStyle}>
          We were unable to process your payment of <strong>{amount}</strong> for
          your {planName} subscription.
        </Text>

        <Section style={alertBoxStyle}>
          <Text style={alertTextStyle}>
            Your subscription is still active, but please update your payment
            method as soon as possible to avoid service interruption.
          </Text>
        </Section>

        <Text style={paragraphStyle}>
          This can happen for a few reasons:
        </Text>

        <ul style={listStyle}>
          <li style={listItemStyle}>Insufficient funds</li>
          <li style={listItemStyle}>Expired card</li>
          <li style={listItemStyle}>Card was declined by your bank</li>
        </ul>

        <Text style={paragraphStyle}>
          Please update your payment method to continue enjoying {planName}:
        </Text>

        <EmailButton href={updatePaymentUrl}>Update Payment Method</EmailButton>

        <Text style={paragraphStyle}>
          If you have any questions or need assistance, please do not hesitate to
          contact our support team.
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

const alertBoxStyle: React.CSSProperties = {
  backgroundColor: "#fef2f2",
  borderLeft: "4px solid #dc2626",
  padding: "16px 20px",
  borderRadius: "0 6px 6px 0",
  margin: "20px 0",
};

const alertTextStyle: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: 1.6,
  color: "#991b1b",
  margin: 0,
};

const listStyle: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: 1.8,
  color: "#555555",
  margin: "0 0 16px",
  paddingLeft: "24px",
};

const listItemStyle: React.CSSProperties = {
  marginBottom: "4px",
};

const signatureStyle: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: 1.6,
  color: "#555555",
  marginTop: "24px",
};

export default PaymentFailedEmail;
