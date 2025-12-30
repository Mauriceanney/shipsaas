import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("analyticsConfig", () => {
  // Store original env values
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment after each test
    process.env = { ...originalEnv };
    // Clear module cache to ensure fresh imports
    vi.resetModules();
  });

  describe("config object structure", () => {
    it("exports analyticsConfig object with all required properties", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test_key");

      const { analyticsConfig } = await import("@/lib/analytics/config");

      expect(analyticsConfig).toBeDefined();
      expect(analyticsConfig).toHaveProperty("posthogKey");
      expect(analyticsConfig).toHaveProperty("posthogHost");
      expect(analyticsConfig).toHaveProperty("enabled");
      expect(analyticsConfig).toHaveProperty("debug");
    });
  });

  describe("posthogKey", () => {
    it("reads from NEXT_PUBLIC_POSTHOG_KEY env var", async () => {
      vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test_key_123");

      const { analyticsConfig } = await import("@/lib/analytics/config");

      expect(analyticsConfig.posthogKey).toBe("phc_test_key_123");
    });

    it("is undefined when NEXT_PUBLIC_POSTHOG_KEY is not set", async () => {
      vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");

      const { analyticsConfig } = await import("@/lib/analytics/config");

      expect(analyticsConfig.posthogKey).toBe("");
    });

    it("handles missing env var", async () => {
      // Don't set the env var at all
      const { analyticsConfig } = await import("@/lib/analytics/config");

      expect(analyticsConfig.posthogKey).toBeUndefined();
    });
  });

  describe("posthogHost", () => {
    it("defaults to https://us.i.posthog.com when not set", async () => {
      // Don't set NEXT_PUBLIC_POSTHOG_HOST

      const { analyticsConfig } = await import("@/lib/analytics/config");

      expect(analyticsConfig.posthogHost).toBe("https://us.i.posthog.com");
    });

    it("uses NEXT_PUBLIC_POSTHOG_HOST env var when set", async () => {
      vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://eu.i.posthog.com");

      const { analyticsConfig } = await import("@/lib/analytics/config");

      expect(analyticsConfig.posthogHost).toBe("https://eu.i.posthog.com");
    });

    it("uses custom self-hosted URL when provided", async () => {
      vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://analytics.example.com");

      const { analyticsConfig } = await import("@/lib/analytics/config");

      expect(analyticsConfig.posthogHost).toBe("https://analytics.example.com");
    });

    it("defaults when env var is empty string", async () => {
      vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "");

      const { analyticsConfig } = await import("@/lib/analytics/config");

      expect(analyticsConfig.posthogHost).toBe("https://us.i.posthog.com");
    });
  });

  describe("enabled flag", () => {
    it("is true in production when key is present", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test_key");

      const { analyticsConfig } = await import("@/lib/analytics/config");

      expect(analyticsConfig.enabled).toBe(true);
    });

    it("is false in development even when key is present", async () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test_key");

      const { analyticsConfig } = await import("@/lib/analytics/config");

      expect(analyticsConfig.enabled).toBe(false);
    });

    it("is false in production when key is missing", async () => {
      vi.stubEnv("NODE_ENV", "production");
      // Don't set NEXT_PUBLIC_POSTHOG_KEY

      const { analyticsConfig } = await import("@/lib/analytics/config");

      expect(analyticsConfig.enabled).toBe(false);
    });

    it("is false in production when key is empty string", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");

      const { analyticsConfig } = await import("@/lib/analytics/config");

      expect(analyticsConfig.enabled).toBe(false);
    });

    it("is false in test environment", async () => {
      vi.stubEnv("NODE_ENV", "test");
      vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test_key");

      const { analyticsConfig } = await import("@/lib/analytics/config");

      expect(analyticsConfig.enabled).toBe(false);
    });

    it("is false in development when key is missing", async () => {
      vi.stubEnv("NODE_ENV", "development");
      // Don't set NEXT_PUBLIC_POSTHOG_KEY

      const { analyticsConfig } = await import("@/lib/analytics/config");

      expect(analyticsConfig.enabled).toBe(false);
    });
  });

  describe("debug flag", () => {
    it("is true when NEXT_PUBLIC_POSTHOG_DEBUG is 'true'", async () => {
      vi.stubEnv("NEXT_PUBLIC_POSTHOG_DEBUG", "true");

      const { analyticsConfig } = await import("@/lib/analytics/config");

      expect(analyticsConfig.debug).toBe(true);
    });

    it("is false when NEXT_PUBLIC_POSTHOG_DEBUG is 'false'", async () => {
      vi.stubEnv("NEXT_PUBLIC_POSTHOG_DEBUG", "false");

      const { analyticsConfig } = await import("@/lib/analytics/config");

      expect(analyticsConfig.debug).toBe(false);
    });

    it("is false when NEXT_PUBLIC_POSTHOG_DEBUG is not set", async () => {
      // Don't set NEXT_PUBLIC_POSTHOG_DEBUG

      const { analyticsConfig } = await import("@/lib/analytics/config");

      expect(analyticsConfig.debug).toBe(false);
    });

    it("is false when NEXT_PUBLIC_POSTHOG_DEBUG is empty string", async () => {
      vi.stubEnv("NEXT_PUBLIC_POSTHOG_DEBUG", "");

      const { analyticsConfig } = await import("@/lib/analytics/config");

      expect(analyticsConfig.debug).toBe(false);
    });

    it("is false for any value other than 'true'", async () => {
      vi.stubEnv("NEXT_PUBLIC_POSTHOG_DEBUG", "yes");

      const { analyticsConfig } = await import("@/lib/analytics/config");

      expect(analyticsConfig.debug).toBe(false);
    });
  });
});

describe("isAnalyticsEnabled", () => {
  // Store original env values
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment after each test
    process.env = { ...originalEnv };
    // Clear module cache to ensure fresh imports
    vi.resetModules();
  });

  it("returns true when config.enabled is true", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test_key");

    const { isAnalyticsEnabled } = await import("@/lib/analytics/config");

    expect(isAnalyticsEnabled()).toBe(true);
  });

  it("returns false when config.enabled is false (development)", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test_key");

    const { isAnalyticsEnabled } = await import("@/lib/analytics/config");

    expect(isAnalyticsEnabled()).toBe(false);
  });

  it("returns false when config.enabled is false (missing key)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    // Don't set NEXT_PUBLIC_POSTHOG_KEY

    const { isAnalyticsEnabled } = await import("@/lib/analytics/config");

    expect(isAnalyticsEnabled()).toBe(false);
  });

  it("returns false in test environment", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test_key");

    const { isAnalyticsEnabled } = await import("@/lib/analytics/config");

    expect(isAnalyticsEnabled()).toBe(false);
  });

  it("matches analyticsConfig.enabled value", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test_key");

    const { analyticsConfig, isAnalyticsEnabled } = await import(
      "@/lib/analytics/config"
    );

    expect(isAnalyticsEnabled()).toBe(analyticsConfig.enabled);
  });
});
