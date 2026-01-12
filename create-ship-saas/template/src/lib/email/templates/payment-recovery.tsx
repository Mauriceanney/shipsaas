/**
 * Payment Recovery Email Template
 *
 * Sent when a payment is successfully recovered after dunning
 */

import * as React from "react";
import { Section, Text } from "@react-email/components";
import { EmailLayout, EmailHeader, EmailFooter, EmailButton } from "./components";

export interface PaymentRecoveryEmailProps {
  name?: string;
  planName: string;
  amount: string;
  dashboardUrl: string;
  appName?: string;
  appUrl?: string;
}

/**
 * Payment recovery success email
 */
export function PaymentRecoveryEmail({
  name,
  planName,
  amount,
  dashboardUrl,
  appName = "SaaS App",
  appUrl = "http://localhost:3000",
}: PaymentRecoveryEmailProps) {
  const greeting = name ? `Hi ${name},` : "Hi there,";
  const previewText = `Great news! Your ${planName} subscription is active again`;

  return (
    <EmailLayout preview={previewText}>
      <EmailHeader appName={appName} />
      <Section style={contentStyle}>
        <Text style={greetingStyle}>{greeting}</Text>
        <Text style={headingStyle}>Payment Successful!</Text>
        <Text style={paragraphStyle}>
          Great news! Your payment of <strong>{amount}</strong> has been
          successfully processed, and your {planName} subscription is now active
          again.
        </Text>

        <Section style={successBoxStyle}>
          <Text style={successTextStyle}>
            All your {planName} features have been restored. Thank you for
            updating your payment information!
          </Text>
        </Section>

        <Text style={paragraphStyle}>
          You now have full access to all your premium features. Jump back in and
          continue where you left off:
        </Text>

        <EmailButton href={dashboardUrl}>Go to Dashboard</EmailButton>

        <Text style={paragraphStyle}>
          Thank you for being a valued customer. If you have any questions or need
          assistance, our support team is always here to help.
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
  color: "#16a34a",
  margin: "0 0 20px",
};

const paragraphStyle: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: 1.6,
  color: "#555555",
  margin: "0 0 16px",
};

const successBoxStyle: React.CSSProperties = {
  backgroundColor: "#f0fdf4",
  borderLeft: "4px solid #16a34a",
  padding: "16px 20px",
  borderRadius: "0 6px 6px 0",
  margin: "20px 0",
};

const successTextStyle: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: 1.6,
  color: "#166534",
  margin: 0,
};

const signatureStyle: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: 1.6,
  color: "#555555",
  marginTop: "24px",
};

export default PaymentRecoveryEmail;
