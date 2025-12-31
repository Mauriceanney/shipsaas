import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Mock database
vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
    dataExportRequest: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("Data Export Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("requestDataExport", () => {
    it("should return error when user is not authenticated", async () => {
      const { auth } = await import("@/lib/auth");
      vi.mocked(auth).mockResolvedValue(null as never);

      const { requestDataExport } = await import("@/actions/gdpr/export-data");
      const result = await requestDataExport();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });

    it("should return error when export request already pending", async () => {
      const { auth } = await import("@/lib/auth");
      const { db } = await import("@/lib/db");

      vi.mocked(auth).mockResolvedValue({
        user: { id: "user123", email: "test@example.com" },
      } as never);

      vi.mocked(db.dataExportRequest.findFirst).mockResolvedValue({
        id: "request123",
        userId: "user123",
        status: "PENDING",
      } as never);

      const { requestDataExport } = await import("@/actions/gdpr/export-data");
      const result = await requestDataExport();

      expect(result.success).toBe(false);
      expect(result.error).toBe("A data export request is already in progress");
    });

    it("should create export request successfully", async () => {
      const { auth } = await import("@/lib/auth");
      const { db } = await import("@/lib/db");

      vi.mocked(auth).mockResolvedValue({
        user: { id: "user123", email: "test@example.com" },
      } as never);

      vi.mocked(db.dataExportRequest.findFirst).mockResolvedValue(null);
      vi.mocked(db.dataExportRequest.create).mockResolvedValue({
        id: "new-request-123",
        userId: "user123",
        status: "PENDING",
      } as never);

      const { requestDataExport } = await import("@/actions/gdpr/export-data");
      const result = await requestDataExport();

      expect(result.success).toBe(true);
      expect(result.requestId).toBe("new-request-123");
    });
  });

  describe("generateUserDataExport", () => {
    it("should generate complete user data export", async () => {
      const { db } = await import("@/lib/db");

      vi.mocked(db.user.findUnique).mockResolvedValue({
        id: "user123",
        email: "test@example.com",
        name: "Test User",
        createdAt: new Date("2024-01-01"),
        accounts: [{ provider: "google", createdAt: new Date("2024-01-01") }],
        subscription: { plan: "PLUS", status: "ACTIVE", createdAt: new Date("2024-01-01") },
      } as never);

      const { generateUserDataExport } = await import("@/actions/gdpr/export-data");
      const result = await generateUserDataExport("user123");

      expect(result.user.id).toBe("user123");
      expect(result.user.email).toBe("test@example.com");
      expect(result.accounts).toHaveLength(1);
      expect(result.subscription).not.toBeNull();
    });

    it("should throw error for non-existent user", async () => {
      const { db } = await import("@/lib/db");

      vi.mocked(db.user.findUnique).mockResolvedValue(null);

      const { generateUserDataExport } = await import("@/actions/gdpr/export-data");

      await expect(generateUserDataExport("nonexistent")).rejects.toThrow(
        "User not found"
      );
    });
  });
});
