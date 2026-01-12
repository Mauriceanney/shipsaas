/**
 * Data Export Ready Email Template
 *
 * Sent when a user's data export is ready for download.
 * GDPR Article 20 - Right to Data Portability
 */

import * as React from "react";
import { Section, Text } from "@react-email/components";
import { EmailButton } from "./components/button";
import { EmailFooter } from "./components/footer";
import { EmailHeader } from "./components/header";
import { EmailLayout } from "./components/layout";

export interface DataExportReadyEmailProps {
  userName: string;
  downloadUrl: string;
  expiresAt: string;
  appName?: string;
  appUrl?: string;
  supportEmail?: string;
}

export function DataExportReadyEmail({
  userName,
  downloadUrl,
  expiresAt,
  appName = "App",
  appUrl = "http://localhost:3000",
  supportEmail,
}: DataExportReadyEmailProps) {
  return (
    <EmailLayout preview="Your data export is ready for download">
      <EmailHeader appName={appName} />

      <Section style={contentStyle}>
        <Text style={greetingStyle}>Hi {userName},</Text>

        <Text style={textStyle}>
          Great news! Your personal data export is ready for download. This
          export contains all the data we have stored about you, in a
          machine-readable JSON format.
        </Text>

        <EmailButton href={downloadUrl}>Download Your Data</EmailButton>

        <Section style={alertStyle}>
          <Text style={alertTitleStyle}>Important</Text>
          <Text style={alertTextStyle}>
            This download link will expire on{" "}
            <strong>{expiresAt}</strong>. Please download your data before then.
          </Text>
        </Section>

        <Text style={textStyle}>
          Your export includes:
        </Text>
        <ul style={listStyle}>
          <li style={listItemStyle}>Account information and profile data</li>
          <li style={listItemStyle}>Connected accounts and login history</li>
          <li style={listItemStyle}>Session information</li>
          <li style={listItemStyle}>Subscription and billing data</li>
          <li style={listItemStyle}>Email preferences</li>
        </ul>

        <Text style={textStyle}>
          If you have any questions about your data or need assistance, please
          don&apos;t hesitate to contact our support team.
        </Text>
      </Section>

      <EmailFooter
        appName={appName}
        appUrl={appUrl}
        supportEmail={supportEmail}
      />
    </EmailLayout>
  );
}

const contentStyle: React.CSSProperties = {
  padding: "30px 40px",
};

const greetingStyle: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 600,
  color: "#333333",
  margin: "0 0 20px",
};

const textStyle: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: 1.6,
  color: "#555555",
  margin: "0 0 16px",
};

const alertStyle: React.CSSProperties = {
  backgroundColor: "#fff8e6",
  borderRadius: "6px",
  padding: "16px",
  margin: "24px 0",
  border: "1px solid #ffe066",
};

const alertTitleStyle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 600,
  color: "#856404",
  margin: "0 0 8px",
};

const alertTextStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#856404",
  margin: 0,
  lineHeight: 1.5,
};

const listStyle: React.CSSProperties = {
  margin: "0 0 16px",
  paddingLeft: "24px",
};

const listItemStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#555555",
  marginBottom: "8px",
  lineHeight: 1.5,
};

export default DataExportReadyEmail;
