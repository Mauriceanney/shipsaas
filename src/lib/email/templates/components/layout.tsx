/**
 * Base email layout component
 * Provides consistent structure for all email templates
 */

import * as React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Preview,
  Font,
} from "@react-email/components";

export interface EmailLayoutProps {
  preview: string;
  children: React.ReactNode;
}

/**
 * Base layout wrapper for all email templates
 * Includes HTML structure, fonts, and responsive container
 */
export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head>
        <Font fontFamily="system-ui" fallbackFontFamily="Verdana" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>{children}</Container>
      </Body>
    </Html>
  );
}

const bodyStyle: React.CSSProperties = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
  margin: 0,
  padding: "20px 0",
};

const containerStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  maxWidth: "600px",
  borderRadius: "8px",
  overflow: "hidden",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
};
