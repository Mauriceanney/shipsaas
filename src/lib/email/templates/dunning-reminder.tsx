/**
 * Dunning Reminder Email Template
 *
 * Sent at Day 3 and Day 7 of the dunning flow
 */

import * as React from "react";
import { Section, Text } from "@react-email/components";
import { EmailLayout, EmailHeader, EmailFooter, EmailButton } from "./components";

export interface DunningReminderEmailProps {
  name?: string;
  planName: string;
  amount: string;
  dayNumber: 3 | 7;
  daysRemaining: number;
  updatePaymentUrl: string;
  appName?: string;
  appUrl?: string;
}

/**
 * Dunning reminder email - Day 3 and Day 7
 */
export function DunningReminderEmail({
  name,
  planName,
  amount,
  dayNumber,
  daysRemaining,
  updatePaymentUrl,
  appName = "SaaS App",
  appUrl = "http://localhost:3000",
}: DunningReminderEmailProps) {
  const greeting = name ? `Hi ${name},` : "Hi there,";
  const isUrgent = dayNumber === 7;
  const previewText = isUrgent
    ? `Urgent: Only ${daysRemaining} days left to update your payment`
    : `Reminder: Your ${planName} payment is still pending`;

  return (
    <EmailLayout preview={previewText}>
      <EmailHeader appName={appName} />
      <Section style={contentStyle}>
        <Text style={greetingStyle}>{greeting}</Text>
        <Text style={isUrgent ? urgentHeadingStyle : headingStyle}>
          {isUrgent ? "Urgent: Payment Still Outstanding" : "Payment Reminder"}
        </Text>
        <Text style={paragraphStyle}>
          We wanted to remind you that your payment of <strong>{amount}</strong>{" "}
          for your {planName} subscription is still outstanding.
        </Text>

        <Section style={isUrgent ? urgentAlertBoxStyle : alertBoxStyle}>
          <Text style={isUrgent ? urgentAlertTextStyle : alertTextStyle}>
            {isUrgent ? (
              <>
                <strong>Your subscription will be suspended in {daysRemaining} days</strong>{" "}
                if payment is not received.
              </>
            ) : (
              <>
                You have {daysRemaining} days to update your payment method before
                your subscription is affected.
              </>
            )}
          </Text>
        </Section>

        <Text style={paragraphStyle}>
          To ensure uninterrupted access to your {planName} features, please
          update your payment method now:
        </Text>

        <EmailButton href={updatePaymentUrl}>
          Update Payment Method
        </EmailButton>

        {isUrgent && (
          <Text style={warningStyle}>
            If your subscription is suspended, you will lose access to premium
            features and your data may be affected. Please take action now to
            avoid any disruption.
          </Text>
        )}

        <Text style={paragraphStyle}>
          If you are experiencing any issues or need assistance, our support team
          is here to help.
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
  color: "#f59e0b",
  margin: "0 0 20px",
};

const urgentHeadingStyle: React.CSSProperties = {
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
  backgroundColor: "#fffbeb",
  borderLeft: "4px solid #f59e0b",
  padding: "16px 20px",
  borderRadius: "0 6px 6px 0",
  margin: "20px 0",
};

const alertTextStyle: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: 1.6,
  color: "#92400e",
  margin: 0,
};

const urgentAlertBoxStyle: React.CSSProperties = {
  backgroundColor: "#fef2f2",
  borderLeft: "4px solid #dc2626",
  padding: "16px 20px",
  borderRadius: "0 6px 6px 0",
  margin: "20px 0",
};

const urgentAlertTextStyle: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: 1.6,
  color: "#991b1b",
  margin: 0,
};

const warningStyle: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: 1.6,
  color: "#dc2626",
  backgroundColor: "#fef2f2",
  padding: "12px 16px",
  borderRadius: "6px",
  margin: "16px 0",
};

const signatureStyle: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: 1.6,
  color: "#555555",
  marginTop: "24px",
};

export default DunningReminderEmail;
