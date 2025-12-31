import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  classifyError,
  getUserFriendlyMessage,
  shouldShowTechnicalDetails,
  getErrorTitle,
  getErrorDescription,
} from "@/lib/errors/messages";

describe("Error Messages", () => {
  describe("classifyError", () => {
    it("classifies database connection errors", () => {
      const error = new Error("Connection refused to database");
      expect(classifyError(error)).toBe("database");
    });

    it("classifies Prisma errors", () => {
      const error = new Error("Prisma client error: Query timeout");
      expect(classifyError(error)).toBe("database");
    });

    it("classifies timeout errors", () => {
      const error = new Error("Request timeout exceeded");
      expect(classifyError(error)).toBe("database");
    });

    it("classifies ECONNREFUSED errors", () => {
      const error = new Error("ECONNREFUSED 127.0.0.1:5432");
      expect(classifyError(error)).toBe("database");
    });

    it("classifies network errors", () => {
      const error = new Error("Network request failed");
      expect(classifyError(error)).toBe("network");
    });

    it("classifies fetch errors", () => {
      const error = new Error("Failed to fetch data");
      expect(classifyError(error)).toBe("network");
    });

    it("classifies CORS errors", () => {
      const error = new Error("CORS policy blocked request");
      expect(classifyError(error)).toBe("network");
    });

    it("classifies authentication errors", () => {
      const error = new Error("Unauthorized access");
      expect(classifyError(error)).toBe("authentication");
    });

    it("classifies session errors", () => {
      const error = new Error("Session expired");
      expect(classifyError(error)).toBe("authentication");
    });

    it("classifies token errors", () => {
      const error = new Error("Invalid token");
      expect(classifyError(error)).toBe("authentication");
    });

    it("classifies authorization errors", () => {
      const error = new Error("Forbidden: insufficient permissions");
      expect(classifyError(error)).toBe("authorization");
    });

    it("classifies permission errors", () => {
      const error = new Error("Permission denied");
      expect(classifyError(error)).toBe("authorization");
    });

    it("classifies access denied errors", () => {
      const error = new Error("Access denied to resource");
      expect(classifyError(error)).toBe("authorization");
    });

    it("classifies validation errors", () => {
      const error = new Error("Validation failed for input");
      expect(classifyError(error)).toBe("validation");
    });

    it("classifies invalid input errors", () => {
      const error = new Error("Invalid email format");
      expect(classifyError(error)).toBe("validation");
    });

    it("returns unknown for unrecognized errors", () => {
      const error = new Error("Something unexpected happened");
      expect(classifyError(error)).toBe("unknown");
    });

    it("handles empty error messages", () => {
      const error = new Error("");
      expect(classifyError(error)).toBe("unknown");
    });
  });

  describe("getUserFriendlyMessage", () => {
    it("returns database message for database errors", () => {
      const error = new Error("Prisma connection failed");
      const message = getUserFriendlyMessage(error);
      expect(message).toContain("database");
      expect(message).toContain("try again");
    });

    it("returns network message for network errors", () => {
      const error = new Error("Network request failed");
      const message = getUserFriendlyMessage(error);
      expect(message).toContain("connect");
    });

    it("returns authentication message for auth errors", () => {
      const error = new Error("Unauthorized");
      const message = getUserFriendlyMessage(error);
      expect(message).toContain("session");
    });

    it("returns authorization message for permission errors", () => {
      const error = new Error("Forbidden");
      const message = getUserFriendlyMessage(error);
      expect(message).toContain("permission");
    });

    it("returns validation message for validation errors", () => {
      const error = new Error("Validation failed");
      const message = getUserFriendlyMessage(error);
      expect(message).toContain("invalid");
    });

    it("returns generic message for unknown errors", () => {
      const error = new Error("Unknown error");
      const message = getUserFriendlyMessage(error);
      expect(message).toContain("Something went wrong");
    });
  });

  describe("shouldShowTechnicalDetails", () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("returns true in development mode", () => {
      vi.stubEnv("NODE_ENV", "development");
      expect(shouldShowTechnicalDetails()).toBe(true);
    });

    it("returns false in production mode", () => {
      vi.stubEnv("NODE_ENV", "production");
      expect(shouldShowTechnicalDetails()).toBe(false);
    });

    it("returns false in test mode", () => {
      vi.stubEnv("NODE_ENV", "test");
      expect(shouldShowTechnicalDetails()).toBe(false);
    });
  });

  describe("getErrorTitle", () => {
    it("returns dashboard title for dashboard context", () => {
      expect(getErrorTitle("dashboard")).toBe("Error loading dashboard");
    });

    it("returns settings title for settings context", () => {
      expect(getErrorTitle("settings")).toBe("Error loading settings");
    });

    it("returns admin title for admin context", () => {
      expect(getErrorTitle("admin")).toBe("Error loading admin panel");
    });
  });

  describe("getErrorDescription", () => {
    it("returns dashboard description for dashboard context", () => {
      const description = getErrorDescription("dashboard");
      expect(description).toContain("dashboard");
      expect(description).toContain("try again");
    });

    it("returns settings description for settings context", () => {
      const description = getErrorDescription("settings");
      expect(description).toContain("settings");
      expect(description).toContain("try again");
    });

    it("returns admin description for admin context", () => {
      const description = getErrorDescription("admin");
      expect(description).toContain("admin");
      expect(description).toContain("try again");
    });
  });
});
