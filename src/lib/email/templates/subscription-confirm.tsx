/**
 * Subscription confirmation email template
 * Sent when user subscribes to a plan
 */

import * as React from "react";
import { Section, Text, Row, Column } from "@react-email/components";
import { EmailLayout, EmailHeader, EmailFooter, EmailButton } from "./components";

export interface SubscriptionConfirmEmailProps {
  name?: string;
  planName: string;
  amount: string;
  billingCycle: "monthly" | "yearly";
  nextBillingDate: string;
  manageUrl: string;
  appName?: string;
  appUrl?: string;
}

/**
 * Subscription confirmation email with plan details
 */
export function SubscriptionConfirmEmail({
  name,
  planName,
  amount,
  billingCycle,
  nextBillingDate,
  manageUrl,
  appName = "SaaS App",
  appUrl = "http://localhost:3000",
}: SubscriptionConfirmEmailProps) {
  const greeting = name ? `Hi ${name},` : "Hi there,";
  const previewText = `Thank you for your ${appName} subscription!`;

  return (
    <EmailLayout preview={previewText}>
      <EmailHeader appName={appName} />
      <Section style={contentStyle}>
        <Text style={greetingStyle}>{greeting}</Text>
        <Text style={headingStyle}>Thank you for subscribing!</Text>
        <Text style={paragraphStyle}>
          Your subscription to {planName} has been confirmed. Here are your
          subscription details:
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
            <Column style={detailLabelStyle}>Billing Cycle</Column>
            <Column style={detailValueStyle}>
              {billingCycle === "monthly" ? "Monthly" : "Yearly"}
            </Column>
          </Row>
          <Row>
            <Column style={detailLabelStyle}>Next Billing Date</Column>
            <Column style={detailValueStyle}>{nextBillingDate}</Column>
          </Row>
        </Section>

        <Text style={paragraphStyle}>
          You can manage your subscription, update payment methods, or view
          invoices at any time:
        </Text>

        <EmailButton href={manageUrl}>Manage Subscription</EmailButton>

        <Text style={paragraphStyle}>
          If you have any questions about your subscription, please do not
          hesitate to reach out to our support team.
        </Text>

        <Text style={signatureStyle}>
          Thank you for choosing {appName}!
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
  color: "#333333",
  margin: "0 0 20px",
};

const paragraphStyle: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: 1.6,
  color: "#555555",
  margin: "0 0 16px",
};

const detailsBoxStyle: React.CSSProperties = {
  backgroundColor: "#f8f9fa",
  padding: "20px",
  borderRadius: "6px",
  margin: "20px 0",
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

export default SubscriptionConfirmEmail;
