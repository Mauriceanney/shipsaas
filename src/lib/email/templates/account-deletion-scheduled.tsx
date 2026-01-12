/**
 * Account Deletion Scheduled Email Template
 *
 * Sent when a user requests account deletion.
 * GDPR Article 17 - Right to Erasure
 */

import * as React from "react";
import { Section, Text, Link } from "@react-email/components";
import { EmailButton } from "./components/button";
import { EmailFooter } from "./components/footer";
import { EmailHeader } from "./components/header";
import { EmailLayout } from "./components/layout";

export interface AccountDeletionScheduledEmailProps {
  userName: string;
  deletionDate: string;
  cancelUrl: string;
  appName?: string;
  appUrl?: string;
  supportEmail?: string;
}

export function AccountDeletionScheduledEmail({
  userName,
  deletionDate,
  cancelUrl,
  appName = "App",
  appUrl = "http://localhost:3000",
  supportEmail,
}: AccountDeletionScheduledEmailProps) {
  return (
    <EmailLayout preview={`Your ${appName} account is scheduled for deletion`}>
      <EmailHeader appName={appName} />

      <Section style={contentStyle}>
        <Text style={greetingStyle}>Hi {userName},</Text>

        <Text style={textStyle}>
          We&apos;ve received your request to delete your account. Your account
          and all associated data will be permanently deleted on{" "}
          <strong>{deletionDate}</strong>.
        </Text>

        <Section style={alertStyle}>
          <Text style={alertTitleStyle}>30-Day Grace Period</Text>
          <Text style={alertTextStyle}>
            You have until {deletionDate} to cancel this request. After this
            date, your account and all associated data will be permanently
            deleted and cannot be recovered.
          </Text>
        </Section>

        <Text style={textStyle}>
          What happens when your account is deleted:
        </Text>
        <ul style={listStyle}>
          <li style={listItemStyle}>
            Your profile and all account settings will be removed
          </li>
          <li style={listItemStyle}>
            All connected third-party accounts will be unlinked
          </li>
          <li style={listItemStyle}>
            Your subscription has been cancelled (no further charges)
          </li>
          <li style={listItemStyle}>
            All your data will be permanently erased
          </li>
        </ul>

        <Text style={textStyle}>
          Changed your mind? You can cancel the deletion request by clicking the
          button below or logging into your account.
        </Text>

        <EmailButton href={cancelUrl} variant="secondary">
          Cancel Deletion Request
        </EmailButton>

        <Text style={smallTextStyle}>
          If you didn&apos;t request this deletion or have any concerns, please{" "}
          {supportEmail ? (
            <Link href={`mailto:${supportEmail}`} style={linkStyle}>
              contact our support team
            </Link>
          ) : (
            "contact our support team"
          )}{" "}
          immediately.
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
  backgroundColor: "#fff0f0",
  borderRadius: "6px",
  padding: "16px",
  margin: "24px 0",
  border: "1px solid #ffcccc",
};

const alertTitleStyle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 600,
  color: "#cc0000",
  margin: "0 0 8px",
};

const alertTextStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#cc0000",
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

const linkStyle: React.CSSProperties = {
  color: "#667eea",
  textDecoration: "underline",
};

export default AccountDeletionScheduledEmail;
