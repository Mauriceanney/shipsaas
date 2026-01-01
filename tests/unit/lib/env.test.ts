import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Store original env
const originalEnv = { ...process.env };

describe("Environment Validation", () => {
  beforeEach(() => {
    // Reset modules to ensure fresh env validation
    vi.resetModules();
    // Set minimum required env vars for testing
    process.env = {
      ...originalEnv,
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      AUTH_SECRET: "test-secret-that-is-at-least-32-characters-long",
      STRIPE_SECRET_KEY: "sk_test_mock",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("validateEnv", () => {
    it("should validate with all required env vars present", async () => {
      const { env } = await import("@/lib/env");

      expect(env.DATABASE_URL).toBe("postgresql://test:test@localhost:5432/test");
      expect(env.AUTH_SECRET).toBe("test-secret-that-is-at-least-32-characters-long");
      expect(env.STRIPE_SECRET_KEY).toBe("sk_test_mock");
      expect(env.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
    });

    it("should default NODE_ENV to development", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (process.env as any).NODE_ENV = undefined;
      const { env } = await import("@/lib/env");

      expect(env.NODE_ENV).toBe("development");
    });

    it("should default NEXT_PUBLIC_APP_NAME", async () => {
      const { env } = await import("@/lib/env");

      expect(env.NEXT_PUBLIC_APP_NAME).toBe("ShipSaaS");
    });

    it("should validate DATABASE_URL format", async () => {
      process.env["DATABASE_URL"] = "not-a-valid-url";

      await expect(async () => {
        await import("@/lib/env");
      }).rejects.toThrow();
    });

    it("should validate AUTH_SECRET minimum length", async () => {
      process.env["AUTH_SECRET"] = "too-short";

      await expect(async () => {
        await import("@/lib/env");
      }).rejects.toThrow();
    });

    it("should validate STRIPE_SECRET_KEY prefix", async () => {
      process.env["STRIPE_SECRET_KEY"] = "invalid_key";

      await expect(async () => {
        await import("@/lib/env");
      }).rejects.toThrow();
    });

    it("should validate NEXT_PUBLIC_APP_URL format", async () => {
      process.env["NEXT_PUBLIC_APP_URL"] = "not-a-url";

      await expect(async () => {
        await import("@/lib/env");
      }).rejects.toThrow();
    });

    it("should accept optional REDIS_URL when provided", async () => {
      process.env["REDIS_URL"] = "redis://localhost:6379";
      const { env } = await import("@/lib/env");

      expect(env.REDIS_URL).toBe("redis://localhost:6379");
    });

    it("should accept optional REDIS_PASSWORD when provided", async () => {
      process.env["REDIS_PASSWORD"] = "secret";
      const { env } = await import("@/lib/env");

      expect(env.REDIS_PASSWORD).toBe("secret");
    });

    it("should validate STRIPE_WEBHOOK_SECRET prefix when provided", async () => {
      process.env["STRIPE_WEBHOOK_SECRET"] = "whsec_test";
      const { env } = await import("@/lib/env");

      expect(env.STRIPE_WEBHOOK_SECRET).toBe("whsec_test");
    });

    it("should reject invalid STRIPE_WEBHOOK_SECRET prefix", async () => {
      process.env["STRIPE_WEBHOOK_SECRET"] = "invalid_webhook";

      await expect(async () => {
        await import("@/lib/env");
      }).rejects.toThrow();
    });
  });

  describe("CRON_SECRET validation", () => {
    it("should accept CRON_SECRET when provided with minimum length", async () => {
      process.env["CRON_SECRET"] = "cron-secret-that-is-at-least-32-characters-long";
      const { env } = await import("@/lib/env");

      expect(env.CRON_SECRET).toBe("cron-secret-that-is-at-least-32-characters-long");
    });

    it("should reject CRON_SECRET shorter than 32 characters", async () => {
      process.env["CRON_SECRET"] = "too-short";

      await expect(async () => {
        await import("@/lib/env");
      }).rejects.toThrow();
    });

    it("should allow missing CRON_SECRET in development", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (process.env as any).NODE_ENV = "development";
      delete process.env["CRON_SECRET"];

      const { env } = await import("@/lib/env");

      expect(env.CRON_SECRET).toBeUndefined();
    });

    it("should allow missing CRON_SECRET in test", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (process.env as any).NODE_ENV = "test";
      delete process.env["CRON_SECRET"];

      const { env } = await import("@/lib/env");

      expect(env.CRON_SECRET).toBeUndefined();
    });

    it("should require CRON_SECRET in production", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (process.env as any).NODE_ENV = "production";
      delete process.env["CRON_SECRET"];

      await expect(async () => {
        await import("@/lib/env");
      }).rejects.toThrow();
    });

    it("should require CRON_SECRET with minimum length in production", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (process.env as any).NODE_ENV = "production";
      process.env["CRON_SECRET"] = "too-short-for-production";

      await expect(async () => {
        await import("@/lib/env");
      }).rejects.toThrow();
    });
  });

  describe("getEnv helper", () => {
    it("should return typed env value", async () => {
      const { getEnv } = await import("@/lib/env");

      const dbUrl = getEnv("DATABASE_URL");
      expect(dbUrl).toBe("postgresql://test:test@localhost:5432/test");
    });
  });
});
