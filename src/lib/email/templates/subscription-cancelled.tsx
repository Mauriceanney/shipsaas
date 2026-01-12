/**
 * Subscription cancelled email template
 * Sent when user's subscription is cancelled
 */

import * as React from "react";
import { Section, Text, Row, Column } from "@react-email/components";
import { EmailLayout, EmailHeader, EmailFooter, EmailButton } from "./components";

export interface SubscriptionCancelledEmailProps {
  name?: string;
  planName: string;
  endDate: string;
  resubscribeUrl: string;
  appName?: string;
  appUrl?: string;
}

/**
 * Subscription cancelled email with cancellation details
 */
export function SubscriptionCancelledEmail({
  name,
  planName,
  endDate,
  resubscribeUrl,
  appName = "SaaS App",
  appUrl = "http://localhost:3000",
}: SubscriptionCancelledEmailProps) {
  const greeting = name ? `Hi ${name},` : "Hi there,";
  const previewText = `Your ${appName} subscription has been cancelled`;

  return (
    <EmailLayout preview={previewText}>
      <EmailHeader appName={appName} />
      <Section style={contentStyle}>
        <Text style={greetingStyle}>{greeting}</Text>
        <Text style={headingStyle}>Your subscription has been cancelled</Text>
        <Text style={paragraphStyle}>
          We wanted to confirm that your subscription to {planName} has been
          successfully cancelled. Here are the details:
        </Text>

        <Section style={detailsBoxStyle}>
          <Row>
            <Column style={detailLabelStyle}>Plan</Column>
            <Column style={detailValueStyle}>{planName}</Column>
          </Row>
          <Row>
            <Column style={detailLabelStyle}>Access Until</Column>
            <Column style={detailValueStyle}>{endDate}</Column>
          </Row>
        </Section>

        <Text style={paragraphStyle}>
          You will continue to have access to your {planName} features until{" "}
          {endDate}. After that, your account will be downgraded to the free
          plan.
        </Text>

        <Text style={paragraphStyle}>
          If you cancelled by mistake or would like to continue enjoying premium
          features, you can resubscribe at any time:
        </Text>

        <EmailButton href={resubscribeUrl}>Resubscribe Now</EmailButton>

        <Text style={paragraphStyle}>
          We are sorry to see you go. If there is anything we could have done
          better, please let us know. Your feedback helps us improve.
        </Text>

        <Text style={signatureStyle}>
          Thank you for being a part of {appName}!
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

export default SubscriptionCancelledEmail;
