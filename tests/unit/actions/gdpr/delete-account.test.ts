import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Mock database
vi.mock("@/lib/db", () => ({
  db: {
    accountDeletionRequest: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
  },
}));

describe("Account Deletion Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("requestAccountDeletion", () => {
    it("should return error when user is not authenticated", async () => {
      const { auth } = await import("@/lib/auth");
      vi.mocked(auth).mockResolvedValue(null as never);

      const { requestAccountDeletion } = await import(
        "@/actions/gdpr/delete-account"
      );
      const result = await requestAccountDeletion({
        confirmation: "DELETE",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });

    it("should return error when confirmation is incorrect", async () => {
      const { auth } = await import("@/lib/auth");

      vi.mocked(auth).mockResolvedValue({
        user: { id: "user123", email: "test@example.com" },
      } as never);

      const { requestAccountDeletion } = await import(
        "@/actions/gdpr/delete-account"
      );
      const result = await requestAccountDeletion({
        confirmation: "wrong",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Please type DELETE to confirm");
    });

    it("should return error when deletion already scheduled", async () => {
      const { auth } = await import("@/lib/auth");
      const { db } = await import("@/lib/db");

      vi.mocked(auth).mockResolvedValue({
        user: { id: "user123", email: "test@example.com" },
      } as never);

      vi.mocked(db.accountDeletionRequest.findUnique).mockResolvedValue({
        id: "request123",
        userId: "user123",
        scheduledFor: new Date(),
        canceledAt: null,
      } as never);

      const { requestAccountDeletion } = await import(
        "@/actions/gdpr/delete-account"
      );
      const result = await requestAccountDeletion({
        confirmation: "DELETE",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Account deletion already scheduled");
    });

    it("should schedule deletion successfully", async () => {
      const { auth } = await import("@/lib/auth");
      const { db } = await import("@/lib/db");

      vi.mocked(auth).mockResolvedValue({
        user: { id: "user123", email: "test@example.com" },
      } as never);

      vi.mocked(db.accountDeletionRequest.findUnique).mockResolvedValue(null);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      vi.mocked(db.accountDeletionRequest.upsert).mockResolvedValue({
        id: "request123",
        userId: "user123",
        scheduledFor: futureDate,
      } as never);

      vi.mocked(db.user.update).mockResolvedValue({} as never);

      const { requestAccountDeletion } = await import(
        "@/actions/gdpr/delete-account"
      );
      const result = await requestAccountDeletion({
        confirmation: "DELETE",
        reason: "No longer needed",
      });

      expect(result.success).toBe(true);
      expect(result.scheduledFor).toBeDefined();
    });
  });

  describe("cancelAccountDeletion", () => {
    it("should return error when user is not authenticated", async () => {
      const { auth } = await import("@/lib/auth");
      vi.mocked(auth).mockResolvedValue(null as never);

      const { cancelAccountDeletion } = await import(
        "@/actions/gdpr/delete-account"
      );
      const result = await cancelAccountDeletion();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });

    it("should return error when no deletion request exists", async () => {
      const { auth } = await import("@/lib/auth");
      const { db } = await import("@/lib/db");

      vi.mocked(auth).mockResolvedValue({
        user: { id: "user123", email: "test@example.com" },
      } as never);

      vi.mocked(db.accountDeletionRequest.findUnique).mockResolvedValue(null);

      const { cancelAccountDeletion } = await import(
        "@/actions/gdpr/delete-account"
      );
      const result = await cancelAccountDeletion();

      expect(result.success).toBe(false);
      expect(result.error).toBe("No active deletion request found");
    });

    it("should cancel deletion successfully", async () => {
      const { auth } = await import("@/lib/auth");
      const { db } = await import("@/lib/db");

      vi.mocked(auth).mockResolvedValue({
        user: { id: "user123", email: "test@example.com" },
      } as never);

      vi.mocked(db.accountDeletionRequest.findUnique).mockResolvedValue({
        id: "request123",
        userId: "user123",
        canceledAt: null,
      } as never);

      vi.mocked(db.accountDeletionRequest.update).mockResolvedValue({
        canceledAt: new Date(),
      } as never);

      vi.mocked(db.user.update).mockResolvedValue({} as never);

      const { cancelAccountDeletion } = await import(
        "@/actions/gdpr/delete-account"
      );
      const result = await cancelAccountDeletion();

      expect(result.success).toBe(true);
    });
  });
});
