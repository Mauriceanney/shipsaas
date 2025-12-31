/**
 * Tests for dunning email templates
 */

import { describe, it, expect } from "vitest";
import { render } from "@react-email/render";

import { DunningReminderEmail } from "@/lib/email/templates/dunning-reminder";
import { DunningFinalWarningEmail } from "@/lib/email/templates/dunning-final-warning";

describe("DunningReminderEmail", () => {
  const defaultProps = {
    name: "John Doe",
    planName: "PLUS",
    daysSinceFailed: 3,
    updatePaymentUrl: "https://example.com/portal",
    appName: "Test App",
    appUrl: "https://example.com",
  };

  it("renders with all props", async () => {
    const html = await render(<DunningReminderEmail {...defaultProps} />);

    expect(html).toContain("John Doe");
    expect(html).toContain("PLUS");
    expect(html).toContain("3 days ago");
    expect(html).toContain("https://example.com/portal");
  });

  it("renders without name", async () => {
    const props = { ...defaultProps, name: undefined };
    const html = await render(<DunningReminderEmail {...props} />);

    expect(html).toContain("Hi there");
    expect(html).not.toContain("Hi John");
  });

  it("includes reminder in heading", async () => {
    const html = await render(<DunningReminderEmail {...defaultProps} />);

    expect(html).toContain("Reminder");
  });

  it("has update payment CTA", async () => {
    const html = await render(<DunningReminderEmail {...defaultProps} />);

    expect(html).toContain("Update Payment Method");
  });

  it("renders plain text version", async () => {
    const text = await render(<DunningReminderEmail {...defaultProps} />, { plainText: true });

    expect(text).toContain("John Doe");
    expect(text).toContain("PLUS");
    expect(text).toContain("https://example.com/portal");
  });

  it("includes account still active message", async () => {
    const html = await render(<DunningReminderEmail {...defaultProps} />);

    expect(html).toContain("still active");
  });
});

describe("DunningFinalWarningEmail", () => {
  const defaultProps = {
    name: "Jane Smith",
    planName: "PRO",
    daysSinceFailed: 7,
    suspensionDate: "January 10, 2025",
    updatePaymentUrl: "https://example.com/portal",
    appName: "Test App",
    appUrl: "https://example.com",
  };

  it("renders with all props", async () => {
    const html = await render(<DunningFinalWarningEmail {...defaultProps} />);

    expect(html).toContain("Jane Smith");
    expect(html).toContain("PRO");
    expect(html).toContain("7 days ago");
    expect(html).toContain("January 10, 2025");
    expect(html).toContain("https://example.com/portal");
  });

  it("renders without name", async () => {
    const props = { ...defaultProps, name: undefined };
    const html = await render(<DunningFinalWarningEmail {...props} />);

    expect(html).toContain("Hi there");
    expect(html).not.toContain("Hi Jane");
  });

  it("includes urgent language", async () => {
    const html = await render(<DunningFinalWarningEmail {...defaultProps} />);

    expect(html).toContain("URGENT");
  });

  it("mentions suspension", async () => {
    const html = await render(<DunningFinalWarningEmail {...defaultProps} />);

    expect(html).toContain("suspend");
  });

  it("has prominent CTA", async () => {
    const html = await render(<DunningFinalWarningEmail {...defaultProps} />);

    expect(html).toContain("Update Payment Method");
  });

  it("renders plain text version", async () => {
    const text = await render(<DunningFinalWarningEmail {...defaultProps} />, { plainText: true });

    expect(text).toContain("Jane Smith");
    expect(text).toContain("PRO");
    expect(text).toContain("January 10, 2025");
    expect(text).toContain("https://example.com/portal");
  });

  it("includes final warning message", async () => {
    const html = await render(<DunningFinalWarningEmail {...defaultProps} />);

    expect(html).toContain("final warning");
  });

  it("displays suspension date prominently", async () => {
    const html = await render(<DunningFinalWarningEmail {...defaultProps} />);

    expect(html).toContain("Suspension Date");
    expect(html).toContain("January 10, 2025");
  });
});
