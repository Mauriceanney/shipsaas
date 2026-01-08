import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoist mocks
const { mockAuth, mockDb, mockSendAdminMessage, mockCreateAuditLog } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockDb: {
    user: {
      findUnique: vi.fn(),
    },
  },
  mockSendAdminMessage: vi.fn(),
  mockCreateAuditLog: vi.fn(),
}));

// Mock dependencies
vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

vi.mock("@/lib/email", () => ({
  sendAdminMessage: mockSendAdminMessage,
}));

vi.mock("@/lib/audit", () => ({
  createAuditLog: mockCreateAuditLog,
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));


import { sendEmailToUser } from "@/actions/admin/send-email";

describe("sendEmailToUser", () => {
  const mockAdminSession = {
    user: {
      id: "admin-123",
      email: "admin@example.com",
      role: "ADMIN",
    },
  };

  const mockTargetUser = {
    id: "user-456",
    email: "user@example.com",
    name: "Test User",
    disabled: false,
  };

  const validInput = {
    userId: "user-456",
    subject: "Test Subject",
    body: "Test message body",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("authentication", () => {
    it("returns error when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const result = await sendEmailToUser(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
      }
    });

    it("returns error when session has no user", async () => {
      mockAuth.mockResolvedValue({ user: null });

      const result = await sendEmailToUser(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
      }
    });
  });

  describe("authorization", () => {
    it("returns error when user is not admin", async () => {
      mockAuth.mockResolvedValue({
        user: { ...mockAdminSession.user, role: "USER" },
      });
      mockDb.user.findUnique.mockResolvedValue({ role: "USER" });

      const result = await sendEmailToUser(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Forbidden");
      }
    });

    it("allows admin role to send email", async () => {
      mockAuth.mockResolvedValue(mockAdminSession);
      mockDb.user.findUnique
        .mockResolvedValueOnce({ role: "ADMIN" }) // Admin check
        .mockResolvedValueOnce(mockTargetUser); // Target user lookup
      mockSendAdminMessage.mockResolvedValue({ success: true, messageId: "123" });
      mockCreateAuditLog.mockResolvedValue({});

      const result = await sendEmailToUser(validInput);

      expect(result.success).toBe(true);
    });
  });

  describe("validation", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockAdminSession);
      mockDb.user.findUnique.mockResolvedValueOnce({ role: "ADMIN" });
    });

    it("returns error for empty subject", async () => {
      const result = await sendEmailToUser({
        ...validInput,
        subject: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("required");
      }
    });

    it("returns error for subject exceeding max length", async () => {
      const result = await sendEmailToUser({
        ...validInput,
        subject: "a".repeat(201),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("200");
      }
    });

    it("returns error for empty body", async () => {
      const result = await sendEmailToUser({
        ...validInput,
        body: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("required");
      }
    });

    it("returns error for empty userId", async () => {
      const result = await sendEmailToUser({
        ...validInput,
        userId: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("required");
      }
    });
  });

  describe("target user validation", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockAdminSession);
      mockDb.user.findUnique.mockResolvedValueOnce({ role: "ADMIN" });
    });

    it("returns error when target user not found", async () => {
      mockDb.user.findUnique.mockResolvedValueOnce(null);

      const result = await sendEmailToUser(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("User not found");
      }
    });

    it("returns error when target user is disabled", async () => {
      mockDb.user.findUnique.mockResolvedValueOnce({
        ...mockTargetUser,
        disabled: true,
      });

      const result = await sendEmailToUser(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Cannot send email to disabled user");
      }
    });
  });

  describe("success cases", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockAdminSession);
      mockDb.user.findUnique
        .mockResolvedValueOnce({ role: "ADMIN" })
        .mockResolvedValueOnce(mockTargetUser);
      mockSendAdminMessage.mockResolvedValue({ success: true, messageId: "msg-123" });
      mockCreateAuditLog.mockResolvedValue({});
    });

    it("sends email with valid input", async () => {
      const result = await sendEmailToUser(validInput);

      expect(result.success).toBe(true);
      expect(mockSendAdminMessage).toHaveBeenCalledWith(
        mockTargetUser.email,
        expect.objectContaining({
          recipientName: mockTargetUser.name,
          subject: validInput.subject,
          body: validInput.body,
          adminName: mockAdminSession.user.email,
        })
      );
    });

    it("uses undefined when name is null", async () => {
      mockDb.user.findUnique
        .mockReset()
        .mockResolvedValueOnce({ role: "ADMIN" })
        .mockResolvedValueOnce({ ...mockTargetUser, name: null });

      await sendEmailToUser(validInput);

      expect(mockSendAdminMessage).toHaveBeenCalledWith(
        mockTargetUser.email,
        expect.objectContaining({
          recipientName: undefined,
        })
      );
    });

    it("creates audit log entry on success", async () => {
      await sendEmailToUser(validInput);

      expect(mockCreateAuditLog).toHaveBeenCalledWith({
        entityType: "User",
        entityId: validInput.userId,
        action: "UPDATE",
        changes: {
          adminEmailSent: {
            old: null,
            new: expect.objectContaining({
              subject: validInput.subject,
              sentBy: mockAdminSession.user.email,
            }),
          },
        },
        userId: mockAdminSession.user.id,
        userEmail: mockAdminSession.user.email,
      });
    });
  });

  describe("error handling", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockAdminSession);
      mockDb.user.findUnique
        .mockResolvedValueOnce({ role: "ADMIN" })
        .mockResolvedValueOnce(mockTargetUser);
    });

    it("handles email provider failures gracefully", async () => {
      mockSendAdminMessage.mockResolvedValue({
        success: false,
        error: "Email provider error",
      });

      const result = await sendEmailToUser(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Failed to send email");
      }
    });

    it("handles database errors gracefully", async () => {
      mockDb.user.findUnique
        .mockReset()
        .mockResolvedValueOnce({ role: "ADMIN" })
        .mockRejectedValueOnce(new Error("DB Error"));

      const result = await sendEmailToUser(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Failed to send email");
      }
    });
  });
});
