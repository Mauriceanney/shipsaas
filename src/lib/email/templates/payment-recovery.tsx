/**
 * Payment recovery email template
 * Sent when a subscription recovers from PAST_DUE to ACTIVE after successful payment
 */

import { Section, Text, Row, Column } from "@react-email/components";
import * as React from "react";

import { EmailLayout, EmailHeader, EmailFooter, EmailButton } from "./components";

export interface PaymentRecoveryEmailProps {
  name?: string;
  planName: string;
  amountPaid: string;
  nextBillingDate: string;
  appName?: string;
  appUrl?: string;
}

/**
 * Payment recovery email with payment confirmation and next billing date
 */
export function PaymentRecoveryEmail({
  name,
  planName,
  amountPaid,
  nextBillingDate,
  appName = "SaaS Boilerplate",
  appUrl = "http://localhost:3000",
}: PaymentRecoveryEmailProps) {
  const greeting = name ? `Hi ${name},` : "Hi there,";
  const previewText = `Great news! Your payment of ${amountPaid} has been received and your subscription is active.`;

  return (
    <EmailLayout preview={previewText}>
      <EmailHeader appName={appName} />
      <Section style={contentStyle}>
        <Text style={greetingStyle}>{greeting}</Text>
        <Text style={headingStyle}>Payment Successful</Text>
        <Text style={paragraphStyle}>
          Great news! Your payment has been received and your subscription is now active.
          Thank you for updating your payment method.
        </Text>

        <Section style={detailsBoxStyle}>
          <Row>
            <Column style={detailLabelStyle}>Plan</Column>
            <Column style={detailValueStyle}>{planName}</Column>
          </Row>
          <Row>
            <Column style={detailLabelStyle}>Amount Paid</Column>
            <Column style={detailValueStyle}>{amountPaid}</Column>
          </Row>
          <Row>
            <Column style={detailLabelStyle}>Next Billing Date</Column>
            <Column style={detailValueStyle}>{nextBillingDate}</Column>
          </Row>
        </Section>

        <Text style={paragraphStyle}>
          Your subscription has been reactivated and you now have full access
          to all {planName} features. Your next payment will be processed on{" "}
          {nextBillingDate}.
        </Text>

        <EmailButton href={`${appUrl}/settings/billing`}>
          View Billing
        </EmailButton>

        <Text style={paragraphStyle}>
          If you have any questions or need assistance, please don&apos;t
          hesitate to contact our support team.
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
  color: "#16a34a",
  margin: "0 0 20px",
};

const paragraphStyle: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: 1.6,
  color: "#555555",
  margin: "0 0 16px",
};

const detailsBoxStyle: React.CSSProperties = {
  backgroundColor: "#f0fdf4",
  padding: "20px",
  borderRadius: "6px",
  margin: "20px 0",
  borderLeft: "4px solid #16a34a",
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

export default PaymentRecoveryEmail;
