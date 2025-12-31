/**
 * Day 10 subscription suspended email template
 * Sent when a user's subscription has been suspended due to non-payment
 */

import { Section, Text, Row, Column } from "@react-email/components";
import * as React from "react";

import { EmailLayout, EmailHeader, EmailFooter, EmailButton } from "./components";

export interface SubscriptionSuspendedEmailProps {
  name?: string;
  planName: string;
  daysOverdue: number;
  reactivateUrl: string;
  appName?: string;
  appUrl?: string;
}

/**
 * Day 10 subscription suspended email - Service has been suspended
 */
export function SubscriptionSuspendedEmail({
  name,
  planName,
  daysOverdue,
  reactivateUrl,
  appName = "SaaS Boilerplate",
  appUrl = "http://localhost:3000",
}: SubscriptionSuspendedEmailProps) {
  const greeting = name ? `Hi ${name},` : "Hi there,";
  const previewText = `Your ${planName} subscription has been suspended - Reactivate now`;

  return (
    <EmailLayout preview={previewText}>
      <EmailHeader appName={appName} />
      <Section style={contentStyle}>
        <Text style={greetingStyle}>{greeting}</Text>
        <Text style={headingStyle}>Your Subscription Has Been Suspended</Text>
        <Text style={paragraphStyle}>
          We&apos;re sorry to inform you that your {planName} subscription has been
          suspended due to non-payment.
        </Text>

        <Section style={suspensionBoxStyle}>
          <Text style={suspensionHeadingStyle}>Subscription Suspended</Text>
          <Text style={suspensionTextStyle}>
            We have been unable to process your payment for <strong>{daysOverdue} days</strong>.
            As a result, your subscription has been suspended and you no longer have
            access to {planName} features.
          </Text>
        </Section>

        <Section style={detailsBoxStyle}>
          <Row>
            <Column style={detailLabelStyle}>Plan</Column>
            <Column style={detailValueStyle}>{planName}</Column>
          </Row>
          <Row>
            <Column style={detailLabelStyle}>Days Overdue</Column>
            <Column style={detailValueStyle}>{`${daysOverdue} days`}</Column>
          </Row>
          <Row>
            <Column style={detailLabelStyle}>Status</Column>
            <Column style={detailValueStyle}>Suspended</Column>
          </Row>
        </Section>

        <Text style={paragraphStyle}>
          <strong>You can reactivate your subscription at any time:</strong>
        </Text>
        <Text style={paragraphStyle}>
          Simply update your payment method and resubscribe to restore your access.
          All your data remains safe and will be available once you reactivate.
        </Text>

        <EmailButton href={reactivateUrl}>Reactivate Subscription</EmailButton>

        <Text style={paragraphStyle}>
          If you no longer wish to use {appName}, no further action is required.
          Your account will remain in this suspended state, and you can reactivate
          at any time in the future.
        </Text>

        <Text style={paragraphStyle}>
          If you have any questions or need assistance, please don&apos;t hesitate
          to contact our support team.
        </Text>

        <Text style={signatureStyle}>
          Thank you for your past business.
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

const suspensionBoxStyle: React.CSSProperties = {
  backgroundColor: "#fef2f2",
  padding: "24px",
  borderRadius: "6px",
  margin: "20px 0",
  border: "2px solid #dc2626",
};

const suspensionHeadingStyle: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 700,
  color: "#dc2626",
  margin: "0 0 12px",
  textTransform: "uppercase",
};

const suspensionTextStyle: React.CSSProperties = {
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

export default SubscriptionSuspendedEmail;
