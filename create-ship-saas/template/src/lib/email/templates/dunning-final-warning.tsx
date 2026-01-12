/**
 * Dunning Final Warning Email Template
 *
 * Sent at Day 10 - Subscription suspended
 */

import * as React from "react";
import { Section, Text } from "@react-email/components";
import { EmailLayout, EmailHeader, EmailFooter, EmailButton } from "./components";

export interface DunningFinalWarningEmailProps {
  name?: string;
  planName: string;
  amount: string;
  updatePaymentUrl: string;
  appName?: string;
  appUrl?: string;
}

/**
 * Final warning / suspension email - Day 10
 */
export function DunningFinalWarningEmail({
  name,
  planName,
  amount,
  updatePaymentUrl,
  appName = "SaaS App",
  appUrl = "http://localhost:3000",
}: DunningFinalWarningEmailProps) {
  const greeting = name ? `Hi ${name},` : "Hi there,";
  const previewText = `Your ${planName} subscription has been suspended`;

  return (
    <EmailLayout preview={previewText}>
      <EmailHeader appName={appName} />
      <Section style={contentStyle}>
        <Text style={greetingStyle}>{greeting}</Text>
        <Text style={headingStyle}>Subscription Suspended</Text>
        <Text style={paragraphStyle}>
          Due to non-payment of <strong>{amount}</strong>, your {planName}{" "}
          subscription has been suspended.
        </Text>

        <Section style={alertBoxStyle}>
          <Text style={alertTextStyle}>
            <strong>What this means:</strong>
          </Text>
          <ul style={alertListStyle}>
            <li>You no longer have access to {planName} features</li>
            <li>Your account has been downgraded to the Free plan</li>
            <li>Your data is preserved, but some features may be limited</li>
          </ul>
        </Section>

        <Text style={paragraphStyle}>
          <strong>Don&apos;t worry!</strong> You can reactivate your subscription
          at any time by updating your payment method and the outstanding balance
          will be automatically charged:
        </Text>

        <EmailButton href={updatePaymentUrl}>Reactivate Subscription</EmailButton>

        <Section style={infoBoxStyle}>
          <Text style={infoTextStyle}>
            <strong>Need help?</strong> If you are experiencing financial
            difficulties or have questions about your account, please contact our
            support team. We are here to help and may be able to work out a
            solution together.
          </Text>
        </Section>

        <Text style={paragraphStyle}>
          We hope to see you back soon!
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
  margin: "0 0 8px",
};

const alertListStyle: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: 1.6,
  color: "#991b1b",
  margin: 0,
  paddingLeft: "20px",
};

const infoBoxStyle: React.CSSProperties = {
  backgroundColor: "#f3f4f6",
  padding: "16px 20px",
  borderRadius: "6px",
  margin: "20px 0",
};

const infoTextStyle: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: 1.6,
  color: "#4b5563",
  margin: 0,
};

const signatureStyle: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: 1.6,
  color: "#555555",
  marginTop: "24px",
};

export default DunningFinalWarningEmail;
