import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies BEFORE imports
const { mockAuth, mockDb, mockSendWelcomeEmail, mockLogger } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockDb: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
  mockSendWelcomeEmail: vi.fn(),
  mockLogger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

vi.mock("@/lib/email", () => ({
  sendWelcomeEmail: mockSendWelcomeEmail,
}));

vi.mock("@/lib/logger", () => ({
  logger: mockLogger,
}));

import { checkAndSendWelcomeEmail } from "@/actions/auth/send-welcome-email";

describe("checkAndSendWelcomeEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("authentication", () => {
    it("returns early when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      await checkAndSendWelcomeEmail();

      expect(mockDb.user.findUnique).not.toHaveBeenCalled();
      expect(mockSendWelcomeEmail).not.toHaveBeenCalled();
    });

    it("returns early when session has no user", async () => {
      mockAuth.mockResolvedValue({ user: null });

      await checkAndSendWelcomeEmail();

      expect(mockDb.user.findUnique).not.toHaveBeenCalled();
    });

    it("returns early when session has no user id", async () => {
      mockAuth.mockResolvedValue({ user: { email: "test@example.com" } });

      await checkAndSendWelcomeEmail();

      expect(mockDb.user.findUnique).not.toHaveBeenCalled();
    });
  });

  describe("user lookup", () => {
    it("fetches user with accounts when authenticated", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDb.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
        welcomeEmailSent: true,
        accounts: [],
      });

      await checkAndSendWelcomeEmail();

      expect(mockDb.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-1" },
        select: {
          id: true,
          email: true,
          name: true,
          welcomeEmailSent: true,
          accounts: {
            select: {
              provider: true,
            },
            take: 1,
          },
        },
      });
    });

    it("returns early when user not found", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDb.user.findUnique.mockResolvedValue(null);

      await checkAndSendWelcomeEmail();

      expect(mockSendWelcomeEmail).not.toHaveBeenCalled();
    });

    it("returns early when user has no email", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDb.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: null,
        name: "Test User",
        welcomeEmailSent: false,
        accounts: [],
      });

      await checkAndSendWelcomeEmail();

      expect(mockSendWelcomeEmail).not.toHaveBeenCalled();
    });
  });

  describe("welcome email already sent", () => {
    it("returns early when welcomeEmailSent is true", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDb.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
        welcomeEmailSent: true,
        accounts: [],
      });

      await checkAndSendWelcomeEmail();

      expect(mockSendWelcomeEmail).not.toHaveBeenCalled();
      expect(mockDb.user.update).not.toHaveBeenCalled();
    });
  });

  describe("success cases", () => {
    it("sends welcome email for OAuth user with name", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDb.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "oauth@example.com",
        name: "OAuth User",
        welcomeEmailSent: false,
        accounts: [{ provider: "google" }],
      });
      mockSendWelcomeEmail.mockResolvedValue(undefined);

      await checkAndSendWelcomeEmail();

      expect(mockSendWelcomeEmail).toHaveBeenCalledWith(
        "oauth@example.com",
        "OAuth User"
      );
    });

    it("sends welcome email with default name when user has no name", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDb.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "oauth@example.com",
        name: null,
        welcomeEmailSent: false,
        accounts: [{ provider: "google" }],
      });
      mockSendWelcomeEmail.mockResolvedValue(undefined);

      await checkAndSendWelcomeEmail();

      expect(mockSendWelcomeEmail).toHaveBeenCalledWith(
        "oauth@example.com",
        "there"
      );
    });

    it("marks email as sent after successful send", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDb.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "oauth@example.com",
        name: "Test User",
        welcomeEmailSent: false,
        accounts: [{ provider: "google" }],
      });
      mockSendWelcomeEmail.mockResolvedValue(undefined);
      mockDb.user.update.mockResolvedValue({});

      await checkAndSendWelcomeEmail();

      expect(mockDb.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { welcomeEmailSent: true },
      });
    });

    it("logs success message with provider", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDb.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "oauth@example.com",
        name: "Test User",
        welcomeEmailSent: false,
        accounts: [{ provider: "google" }],
      });
      mockSendWelcomeEmail.mockResolvedValue(undefined);

      await checkAndSendWelcomeEmail();

      expect(mockLogger.info).toHaveBeenCalledWith(
        {
          userId: "user-1",
          provider: "google",
        },
        "Welcome email sent to OAuth user"
      );
    });

    it("logs with unknown provider when no accounts", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDb.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "oauth@example.com",
        name: "Test User",
        welcomeEmailSent: false,
        accounts: [],
      });
      mockSendWelcomeEmail.mockResolvedValue(undefined);

      await checkAndSendWelcomeEmail();

      expect(mockLogger.info).toHaveBeenCalledWith(
        {
          userId: "user-1",
          provider: "unknown",
        },
        "Welcome email sent to OAuth user"
      );
    });
  });

  describe("error handling", () => {
    it("catches and logs errors without throwing", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDb.user.findUnique.mockRejectedValue(new Error("Database error"));

      // Should not throw
      await expect(checkAndSendWelcomeEmail()).resolves.toBeUndefined();

      expect(mockLogger.error).toHaveBeenCalledWith(
        { err: expect.any(Error) },
        "Failed to send welcome email"
      );
    });

    it("handles email send failure gracefully", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDb.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "oauth@example.com",
        name: "Test User",
        welcomeEmailSent: false,
        accounts: [{ provider: "google" }],
      });
      mockSendWelcomeEmail.mockRejectedValue(new Error("SMTP error"));

      // Should not throw
      await expect(checkAndSendWelcomeEmail()).resolves.toBeUndefined();

      expect(mockLogger.error).toHaveBeenCalled();
    });

    it("handles database update failure gracefully", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDb.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "oauth@example.com",
        name: "Test User",
        welcomeEmailSent: false,
        accounts: [{ provider: "google" }],
      });
      mockSendWelcomeEmail.mockResolvedValue(undefined);
      mockDb.user.update.mockRejectedValue(new Error("DB update error"));

      // Should not throw
      await expect(checkAndSendWelcomeEmail()).resolves.toBeUndefined();

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("handles empty string as name (uses empty string, not default)", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDb.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        name: "",
        welcomeEmailSent: false,
        accounts: [],
      });
      mockSendWelcomeEmail.mockResolvedValue(undefined);

      await checkAndSendWelcomeEmail();

      // Code uses ?? which only checks null/undefined, not empty strings
      expect(mockSendWelcomeEmail).toHaveBeenCalledWith(
        "test@example.com",
        ""
      );
    });

    it("handles multiple rapid calls", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDb.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        name: "Test",
        welcomeEmailSent: false,
        accounts: [{ provider: "google" }],
      });
      mockSendWelcomeEmail.mockResolvedValue(undefined);

      await Promise.all([
        checkAndSendWelcomeEmail(),
        checkAndSendWelcomeEmail(),
        checkAndSendWelcomeEmail(),
      ]);

      // Should attempt to send 3 times (race condition possible in real app)
      expect(mockSendWelcomeEmail).toHaveBeenCalledTimes(3);
    });

    it("handles email with special characters", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDb.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "test+special@example.com",
        name: "Test User",
        welcomeEmailSent: false,
        accounts: [{ provider: "google" }],
      });
      mockSendWelcomeEmail.mockResolvedValue(undefined);

      await checkAndSendWelcomeEmail();

      expect(mockSendWelcomeEmail).toHaveBeenCalledWith(
        "test+special@example.com",
        "Test User"
      );
    });
  });
});
