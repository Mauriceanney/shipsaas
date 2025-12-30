/**
 * Invoice receipt email template
 * Sent when a user's subscription payment is successful
 */

import { Section, Text, Row, Column } from "@react-email/components";
import * as React from "react";

import { EmailLayout, EmailHeader, EmailFooter, EmailButton } from "./components";

export interface InvoiceReceiptEmailProps {
  name?: string;
  planName: string;
  amount: string;
  invoiceDate: string;
  invoiceNumber: string;
  billingPeriod?: {
    start: string;
    end: string;
  };
  invoiceUrl: string;
  appName?: string;
  appUrl?: string;
}

/**
 * Invoice receipt email with payment confirmation and invoice details
 */
export function InvoiceReceiptEmail({
  name,
  planName,
  amount,
  invoiceDate,
  invoiceNumber,
  billingPeriod,
  invoiceUrl,
  appName = "SaaS Boilerplate",
  appUrl = "http://localhost:3000",
}: InvoiceReceiptEmailProps) {
  const greeting = name ? `Hi ${name},` : "Hi there,";
  const previewText = `Your payment of ${amount} has been received. Thank you!`;

  return (
    <EmailLayout preview={previewText}>
      <EmailHeader appName={appName} />
      <Section style={contentStyle}>
        <Text style={greetingStyle}>{greeting}</Text>
        <Text style={headingStyle}>Payment Received</Text>
        <Text style={paragraphStyle}>
          Thank you for your payment! Your invoice has been successfully
          processed. Below are the details of your transaction.
        </Text>

        <Section style={detailsBoxStyle}>
          <Row>
            <Column style={detailLabelStyle}>Invoice</Column>
            <Column style={detailValueStyle}>{invoiceNumber}</Column>
          </Row>
          <Row>
            <Column style={detailLabelStyle}>Plan</Column>
            <Column style={detailValueStyle}>{planName}</Column>
          </Row>
          <Row>
            <Column style={detailLabelStyle}>Amount</Column>
            <Column style={detailValueStyle}>{amount}</Column>
          </Row>
          <Row>
            <Column style={detailLabelStyle}>Date</Column>
            <Column style={detailValueStyle}>{invoiceDate}</Column>
          </Row>
          {billingPeriod && (
            <Row>
              <Column style={detailLabelStyle}>Billing Period</Column>
              <Column style={detailValueStyle}>
                {billingPeriod.start} - {billingPeriod.end}
              </Column>
            </Row>
          )}
        </Section>

        <Text style={paragraphStyle}>
          You can view and download your full invoice using the button below.
          This serves as your official receipt for this transaction.
        </Text>

        <EmailButton href={invoiceUrl}>View Invoice</EmailButton>

        <Text style={paragraphStyle}>
          If you have any questions about this invoice or need assistance,
          please don&apos;t hesitate to contact our support team.
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

export default InvoiceReceiptEmail;
