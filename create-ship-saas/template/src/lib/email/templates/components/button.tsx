/**
 * Email button component
 * CTA button for email templates
 */

import * as React from "react";
import { Button as ReactEmailButton, Section } from "@react-email/components";

export interface EmailButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}

/**
 * CTA button component with gradient styling
 */
export function EmailButton({
  href,
  children,
  variant = "primary",
}: EmailButtonProps) {
  const buttonStyle =
    variant === "primary" ? primaryButtonStyle : secondaryButtonStyle;

  return (
    <Section style={buttonContainerStyle}>
      <ReactEmailButton href={href} style={buttonStyle}>
        {children}
      </ReactEmailButton>
    </Section>
  );
}

const buttonContainerStyle: React.CSSProperties = {
  textAlign: "center",
  margin: "30px 0",
};

const primaryButtonStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  color: "#ffffff",
  padding: "14px 30px",
  borderRadius: "6px",
  fontWeight: 600,
  fontSize: "16px",
  textDecoration: "none",
  display: "inline-block",
};

const secondaryButtonStyle: React.CSSProperties = {
  backgroundColor: "#f5f5f5",
  color: "#333333",
  padding: "14px 30px",
  borderRadius: "6px",
  fontWeight: 600,
  fontSize: "16px",
  textDecoration: "none",
  display: "inline-block",
  border: "1px solid #e0e0e0",
};
