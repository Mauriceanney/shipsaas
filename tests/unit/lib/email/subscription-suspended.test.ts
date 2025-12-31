/**
 * Test for subscription suspended email template
 */

import { describe, it, expect } from "vitest";

import { renderSubscriptionSuspendedEmail } from "@/lib/email/templates";

describe("renderSubscriptionSuspendedEmail", () => {
  const baseProps = {
    name: "John Doe",
    planName: "PRO",
    daysOverdue: 10,
    appName: "SaaS Boilerplate",
    appUrl: "http://localhost:3000",
    reactivateUrl: "http://localhost:3000/settings/billing",
  };

  it("renders HTML and text versions", async () => {
    const result = await renderSubscriptionSuspendedEmail(baseProps);

    expect(result).toHaveProperty("html");
    expect(result).toHaveProperty("text");
    expect(result.html).toContain("John Doe");
    expect(result.html).toContain("PRO");
    expect(result.text).toContain("John Doe");
    expect(result.text).toContain("PRO");
  });

  it("includes suspension message", async () => {
    const result = await renderSubscriptionSuspendedEmail(baseProps);

    expect(result.html).toContain("suspended");
    expect(result.html).toContain("10 days");
    expect(result.text).toContain("suspended");
  });

  it("includes reactivate button", async () => {
    const result = await renderSubscriptionSuspendedEmail(baseProps);

    expect(result.html).toContain("Reactivate");
    expect(result.html).toContain("/settings/billing");
  });

  it("works without name", async () => {
    const result = await renderSubscriptionSuspendedEmail({
      ...baseProps,
      name: undefined,
    });

    expect(result.html).toContain("Hi there");
    expect(result.text).toContain("Hi there");
  });

  it("includes all required props", async () => {
    const result = await renderSubscriptionSuspendedEmail(baseProps);

    expect(result.html).toContain("PRO");
    expect(result.html).toContain("10");
    expect(result.html).toContain("SaaS Boilerplate");
  });
});
