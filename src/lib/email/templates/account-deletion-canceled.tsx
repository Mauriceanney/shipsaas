/**
 * Account Deletion Canceled Email Template
 *
 * Sent when a user cancels their account deletion request.
 * GDPR Article 17 - Right to Erasure
 */

import * as React from "react";
import { Section, Text } from "@react-email/components";
import { EmailButton } from "./components/button";
import { EmailFooter } from "./components/footer";
import { EmailHeader } from "./components/header";
import { EmailLayout } from "./components/layout";

export interface AccountDeletionCanceledEmailProps {
  userName: string;
  appName?: string;
  appUrl?: string;
  supportEmail?: string;
  unsubscribeUrl?: string;
}

export function AccountDeletionCanceledEmail({
  userName,
  appName = "App",
  appUrl = "http://localhost:3000",
  supportEmail,
  unsubscribeUrl,
}: AccountDeletionCanceledEmailProps) {
  return (
    <EmailLayout preview={`Your ${appName} account deletion has been canceled`}>
      <EmailHeader appName={appName} />

      <Section style={contentStyle}>
        <Text style={greetingStyle}>Hi {userName},</Text>

        <Text style={textStyle}>
          Good news! Your account deletion request has been successfully
          canceled. Your account is now fully restored and you can continue
          using {appName} as normal.
        </Text>

        <Section style={successStyle}>
          <Text style={successTitleStyle}>Account Restored</Text>
          <Text style={successTextStyle}>
            Your account is active and all your data remains intact. No
            information has been deleted.
          </Text>
        </Section>

        <Text style={textStyle}>What&apos;s been restored:</Text>
        <ul style={listStyle}>
          <li style={listItemStyle}>
            Full access to your account and settings
          </li>
          <li style={listItemStyle}>All your data and preferences</li>
          <li style={listItemStyle}>
            Connected third-party accounts (if any)
          </li>
        </ul>

        <Text style={textStyle}>
          Note: If you had an active subscription that was cancelled as part of
          the deletion request, you may need to resubscribe to restore premium
          features.
        </Text>

        <EmailButton href={appUrl}>Go to Dashboard</EmailButton>

        <Text style={smallTextStyle}>
          If you didn&apos;t cancel this deletion request or have any concerns,
          please contact our support team immediately for assistance.
        </Text>
      </Section>

      <EmailFooter
        appName={appName}
        appUrl={appUrl}
        supportEmail={supportEmail}
        unsubscribeUrl={unsubscribeUrl}
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

const successStyle: React.CSSProperties = {
  backgroundColor: "#f0fff4",
  borderRadius: "6px",
  padding: "16px",
  margin: "24px 0",
  border: "1px solid #9ae6b4",
};

const successTitleStyle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 600,
  color: "#22543d",
  margin: "0 0 8px",
};

const successTextStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#22543d",
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

const smallTextStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#777777",
  lineHeight: 1.5,
  marginTop: "24px",
};

export default AccountDeletionCanceledEmail;
