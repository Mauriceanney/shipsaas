/**
 * Email footer component
 * Displays company info, unsubscribe links, and legal text
 */

import * as React from "react";
import { Section, Text, Link, Hr } from "@react-email/components";

export interface EmailFooterProps {
  appName?: string | undefined;
  appUrl?: string | undefined;
  unsubscribeUrl?: string | undefined;
  supportEmail?: string | undefined;
}

/**
 * Email footer with unsubscribe link and company info
 */
export function EmailFooter({
  appName = "App",
  appUrl = "http://localhost:3000",
  unsubscribeUrl,
  supportEmail,
}: EmailFooterProps) {
  return (
    <Section style={footerStyle}>
      <Hr style={hrStyle} />
      <Text style={footerTextStyle}>
        This email was sent by{" "}
        <Link href={appUrl} style={linkStyle}>
          {appName}
        </Link>
      </Text>
      {supportEmail && (
        <Text style={footerTextStyle}>
          Need help?{" "}
          <Link href={`mailto:${supportEmail}`} style={linkStyle}>
            Contact support
          </Link>
        </Text>
      )}
      {unsubscribeUrl && (
        <Text style={footerTextStyle}>
          <Link href={unsubscribeUrl} style={unsubscribeLinkStyle}>
            Unsubscribe from these emails
          </Link>
        </Text>
      )}
      <Text style={copyrightStyle}>
        &copy; {new Date().getFullYear()} {appName}. All rights reserved.
      </Text>
    </Section>
  );
}

const footerStyle: React.CSSProperties = {
  padding: "0 40px 30px",
};

const hrStyle: React.CSSProperties = {
  borderColor: "#e0e0e0",
  borderWidth: "1px 0 0 0",
  margin: "20px 0",
};

const footerTextStyle: React.CSSProperties = {
  color: "#666666",
  fontSize: "12px",
  lineHeight: 1.6,
  margin: "0 0 8px",
};

const linkStyle: React.CSSProperties = {
  color: "#667eea",
  textDecoration: "none",
};

const unsubscribeLinkStyle: React.CSSProperties = {
  color: "#999999",
  textDecoration: "underline",
};

const copyrightStyle: React.CSSProperties = {
  color: "#999999",
  fontSize: "11px",
  marginTop: "16px",
};
