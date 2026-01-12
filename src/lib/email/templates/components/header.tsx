/**
 * Email header component
 * Displays app branding at the top of emails
 */

import * as React from "react";
import { Section, Text } from "@react-email/components";

export interface EmailHeaderProps {
  appName?: string;
}

/**
 * Email header with gradient background and app name
 */
export function EmailHeader({ appName = "App" }: EmailHeaderProps) {
  return (
    <Section style={headerStyle}>
      <Text style={logoStyle}>{appName}</Text>
    </Section>
  );
}

const headerStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  padding: "30px 40px",
};

const logoStyle: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: 700,
  margin: 0,
  lineHeight: 1.2,
};
