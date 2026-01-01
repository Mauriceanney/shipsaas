import { Section, Text, Row, Column } from "@react-email/components";
import * as React from "react";

import { EmailLayout, EmailHeader, EmailFooter } from "./components";

export interface RefundConfirmationEmailProps {
  name?: string;
  planName: string;
  refundAmount: string;
  reason: string;
  appName?: string;
  appUrl?: string;
}

export function RefundConfirmationEmail({
  name,
  planName,
  refundAmount,
  reason,
  appName = "SaaS Boilerplate",
  appUrl = "http://localhost:3000",
}: RefundConfirmationEmailProps) {
  const greeting = name ? `Hi ${name},` : "Hi there,";
  const previewText = `Your refund of ${refundAmount} has been processed`;

  return (
    <EmailLayout preview={previewText}>
      <EmailHeader appName={appName} />
      <Section style={contentStyle}>
        <Text style={greetingStyle}>{greeting}</Text>
        <Text style={headingStyle}>Refund Processed</Text>
        <Text style={paragraphStyle}>
          We have processed a refund for your {planName} subscription. The refund
          details are below:
        </Text>

        <Section style={detailsBoxStyle}>
          <Row>
            <Column style={detailLabelStyle}>Plan</Column>
            <Column style={detailValueStyle}>{planName}</Column>
          </Row>
          <Row>
            <Column style={detailLabelStyle}>Refund Amount</Column>
            <Column style={detailValueStyle}>{refundAmount}</Column>
          </Row>
          <Row>
            <Column style={detailLabelStyle}>Reason</Column>
            <Column style={detailValueStyle}>{reason}</Column>
          </Row>
        </Section>

        <Text style={paragraphStyle}>
          The refund will appear on your original payment method within 5-10
          business days, depending on your financial institution.
        </Text>

        <Text style={paragraphStyle}>
          If you have any questions about this refund, please contact our support
          team.
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

export default RefundConfirmationEmail;
