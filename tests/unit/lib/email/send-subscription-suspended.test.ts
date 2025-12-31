/**
 * Test for sendSubscriptionSuspendedEmail function
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock email provider before imports
vi.mock("@/lib/email/client", () => ({
  getEmailProvider: vi.fn(() => ({
    send: vi.fn().mockResolvedValue({ success: true }),
  })),
  resetEmailProvider: vi.fn(),
}));

import { sendSubscriptionSuspendedEmail } from "@/lib/email";
import { getEmailProvider } from "@/lib/email/client";

describe("sendSubscriptionSuspendedEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends email with correct parameters", async () => {
    const mockSend = vi.fn().mockResolvedValue({ success: true });
    vi.mocked(getEmailProvider).mockReturnValue({
      send: mockSend,
    } as any);

    const result = await sendSubscriptionSuspendedEmail("test@example.com", {
      name: "John Doe",
      planName: "PLUS",
      daysOverdue: 10,
    });

    expect(result.success).toBe(true);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "test@example.com",
        subject: expect.stringContaining("Subscription Suspended"),
      })
    );
  });

  it("includes user name in email", async () => {
    const mockSend = vi.fn().mockResolvedValue({ success: true });
    vi.mocked(getEmailProvider).mockReturnValue({
      send: mockSend,
    } as any);

    await sendSubscriptionSuspendedEmail("test@example.com", {
      name: "John Doe",
      planName: "PLUS",
      daysOverdue: 10,
    });

    const callArgs = mockSend.mock.calls[0]?.[0];
    expect(callArgs?.html).toContain("John Doe");
  });

  it("works without name", async () => {
    const mockSend = vi.fn().mockResolvedValue({ success: true });
    vi.mocked(getEmailProvider).mockReturnValue({
      send: mockSend,
    } as any);

    const result = await sendSubscriptionSuspendedEmail("test@example.com", {
      planName: "PLUS",
      daysOverdue: 10,
    });

    expect(result.success).toBe(true);
  });

  it("includes plan name and days overdue", async () => {
    const mockSend = vi.fn().mockResolvedValue({ success: true });
    vi.mocked(getEmailProvider).mockReturnValue({
      send: mockSend,
    } as any);

    await sendSubscriptionSuspendedEmail("test@example.com", {
      planName: "PRO",
      daysOverdue: 12,
    });

    const callArgs = mockSend.mock.calls[0]?.[0];
    expect(callArgs?.html).toContain("PRO");
    expect(callArgs?.html).toContain("12");
  });

  it("handles send failure gracefully", async () => {
    const mockSend = vi.fn().mockResolvedValue({
      success: false,
      error: "Failed to send",
    });
    vi.mocked(getEmailProvider).mockReturnValue({
      send: mockSend,
    } as any);

    const result = await sendSubscriptionSuspendedEmail("test@example.com", {
      planName: "PLUS",
      daysOverdue: 10,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Failed to send");
  });
});
