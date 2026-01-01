import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies BEFORE imports
const mockAuth = vi.hoisted(() => vi.fn());
const mockDb = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}));
const mockSendWelcomeEmail = vi.hoisted(() => vi.fn());
const mockLogger = vi.hoisted(() => ({
  info: vi.fn(),
  error: vi.fn(),
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
      mockAuth.mockResolvedValue({ user: {} });

      await checkAndSendWelcomeEmail();

      expect(mockDb.user.findUnique).not.toHaveBeenCalled();
    });
  });

  describe("user lookup", () => {
    it("fetches user when authenticated", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDb.user.findUnique.mockResolvedValue(null);

      await checkAndSendWelcomeEmail();

      expect(mockDb.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-1" },
        select: {
          id: true,
          email: true,
          name: true,
          welcomeEmailSent: true,
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
        name: "Test",
        welcomeEmailSent: false,
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
        name: "Test",
        welcomeEmailSent: true,
      });

      await checkAndSendWelcomeEmail();

      expect(mockSendWelcomeEmail).not.toHaveBeenCalled();
    });
  });

  describe("success cases", () => {
    it("sends welcome email with user name", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDb.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        name: "John Doe",
        welcomeEmailSent: false,
      });
      mockSendWelcomeEmail.mockResolvedValue(undefined);
      mockDb.user.update.mockResolvedValue({});

      await checkAndSendWelcomeEmail();

      expect(mockSendWelcomeEmail).toHaveBeenCalledWith(
        "test@example.com",
        "John Doe"
      );
    });

    it("sends welcome email with default name when user has no name", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDb.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        name: null,
        welcomeEmailSent: false,
      });
      mockSendWelcomeEmail.mockResolvedValue(undefined);
      mockDb.user.update.mockResolvedValue({});

      await checkAndSendWelcomeEmail();

      expect(mockSendWelcomeEmail).toHaveBeenCalledWith(
        "test@example.com",
        "there"
      );
    });

    it("marks email as sent after successful send", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDb.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        name: "Test",
        welcomeEmailSent: false,
      });
      mockSendWelcomeEmail.mockResolvedValue(undefined);
      mockDb.user.update.mockResolvedValue({});

      await checkAndSendWelcomeEmail();

      expect(mockDb.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { welcomeEmailSent: true },
      });
    });

    it("logs success message", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDb.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        name: "Test",
        welcomeEmailSent: false,
      });
      mockSendWelcomeEmail.mockResolvedValue(undefined);
      mockDb.user.update.mockResolvedValue({});

      await checkAndSendWelcomeEmail();

      expect(mockLogger.info).toHaveBeenCalledWith(
        { userId: "user-1" },
        "Welcome email sent to OAuth user"
      );
    });
  });

  describe("error handling", () => {
    it("catches and logs errors without throwing", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDb.user.findUnique.mockRejectedValue(new Error("DB error"));

      // Should not throw
      await expect(checkAndSendWelcomeEmail()).resolves.toBeUndefined();

      expect(mockLogger.error).toHaveBeenCalled();
    });

    it("handles email send failure gracefully", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDb.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        name: "Test",
        welcomeEmailSent: false,
      });
      mockSendWelcomeEmail.mockRejectedValue(new Error("Email send failed"));

      // Should not throw
      await expect(checkAndSendWelcomeEmail()).resolves.toBeUndefined();

      expect(mockLogger.error).toHaveBeenCalled();
    });

    it("handles database update failure gracefully", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDb.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        name: "Test",
        welcomeEmailSent: false,
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
      });
      mockSendWelcomeEmail.mockResolvedValue(undefined);
      mockDb.user.update.mockResolvedValue({});

      await checkAndSendWelcomeEmail();

      // Empty string should result in "there" fallback (via ?? operator)
      expect(mockSendWelcomeEmail).toHaveBeenCalledWith(
        "test@example.com",
        ""
      );
    });

    it("handles email with special characters", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDb.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "test+tag@example.com",
        name: "Test User",
        welcomeEmailSent: false,
      });
      mockSendWelcomeEmail.mockResolvedValue(undefined);
      mockDb.user.update.mockResolvedValue({});

      await checkAndSendWelcomeEmail();

      expect(mockSendWelcomeEmail).toHaveBeenCalledWith(
        "test+tag@example.com",
        "Test User"
      );
    });
  });
});
