import { describe, expect, it, vi, beforeEach } from "vitest";

// Use vi.hoisted to properly hoist the mock functions
const { mockSendWelcomeEmail } = vi.hoisted(() => ({
  mockSendWelcomeEmail: vi.fn(),
}));

// Mock the email module before importing the config
vi.mock("@/lib/email", () => ({
  sendWelcomeEmail: mockSendWelcomeEmail,
}));

// Import after mocking
import { authConfig } from "@/lib/auth/config";

describe("authConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendWelcomeEmail.mockResolvedValue({
      success: true,
      messageId: "test-message-id",
    });
  });

  describe("events.createUser", () => {
    it("sends welcome email when a new user is created via OAuth", async () => {
      const newUser = {
        id: "user-123",
        email: "newuser@example.com",
        name: "John Doe",
        emailVerified: new Date(),
      };

      // The createUser event should be defined
      expect(authConfig.events?.createUser).toBeDefined();

      // Simulate createUser event (triggered when OAuth creates a new user)
      await authConfig.events?.createUser?.({ user: newUser });

      // Should send welcome email with user's name and email
      expect(mockSendWelcomeEmail).toHaveBeenCalledTimes(1);
      expect(mockSendWelcomeEmail).toHaveBeenCalledWith(
        "newuser@example.com",
        "John Doe"
      );
    });

    it("uses fallback name when user has no name", async () => {
      const newUser = {
        id: "user-456",
        email: "noname@example.com",
        name: null,
        emailVerified: new Date(),
      };

      await authConfig.events?.createUser?.({ user: newUser });

      expect(mockSendWelcomeEmail).toHaveBeenCalledTimes(1);
      expect(mockSendWelcomeEmail).toHaveBeenCalledWith(
        "noname@example.com",
        "there"
      );
    });

    it("does not throw when welcome email fails", async () => {
      const newUser = {
        id: "user-789",
        email: "test@example.com",
        name: "Test User",
        emailVerified: new Date(),
      };

      // Simulate email sending failure
      mockSendWelcomeEmail.mockRejectedValue(new Error("SMTP connection failed"));

      // Should not throw - graceful degradation
      // The createUser event should handle the error internally
      const createUserEvent = authConfig.events?.createUser;
      expect(createUserEvent).toBeDefined();

      // This should complete without throwing
      await createUserEvent!({ user: newUser });

      // Verify the email function was still called
      expect(mockSendWelcomeEmail).toHaveBeenCalledTimes(1);
    });

    it("does not send email when user has no email", async () => {
      const newUser = {
        id: "user-no-email",
        email: null,
        name: "No Email User",
        emailVerified: null,
      };

      await authConfig.events?.createUser?.({ user: newUser });

      expect(mockSendWelcomeEmail).not.toHaveBeenCalled();
    });
  });

  describe("providers", () => {
    it("includes Google provider", () => {
      const googleProvider = authConfig.providers?.find(
        (provider) => {
          // Provider can be a function or object
          const p = typeof provider === "function" ? provider : provider;
          return p.name === "Google" || (p as { id?: string }).id === "google";
        }
      );
      expect(googleProvider).toBeDefined();
    });

    it("includes GitHub provider", () => {
      const githubProvider = authConfig.providers?.find(
        (provider) => {
          const p = typeof provider === "function" ? provider : provider;
          return p.name === "GitHub" || (p as { id?: string }).id === "github";
        }
      );
      expect(githubProvider).toBeDefined();
    });
  });
});
