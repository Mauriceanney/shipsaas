import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock dependencies BEFORE imports
vi.mock("posthog-js");
vi.mock("@/lib/analytics/config");

import posthog from "posthog-js";
import { analyticsConfig } from "@/lib/analytics/config";
import {
  identifyUser,
  trackEvent,
  trackPageView,
  setUserProperties,
  resetAnalytics,
  optInAnalytics,
  optOutAnalytics,
  getPostHog,
} from "@/lib/analytics/client";

import type { Session } from "next-auth";

describe("Analytics Client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initPostHog", () => {
    let originalWindow: typeof globalThis.window;

    beforeEach(() => {
      originalWindow = globalThis.window;
      // Reset module to clear isInitialized flag for initPostHog tests
      vi.resetModules();
    });

    afterEach(() => {
      // Restore window
      if (!originalWindow) {
        // @ts-expect-error - Restoring undefined window
        delete globalThis.window;
      } else {
        globalThis.window = originalWindow;
      }
    });

    it("initializes PostHog with correct config when key is present", async () => {
      // Re-import mocks after resetModules
      const { analyticsConfig: config } = await import("@/lib/analytics/config");
      const posthogModule = await import("posthog-js");
      const { initPostHog } = await import("@/lib/analytics/client");

      // Mock config
      vi.mocked(config).posthogKey = "phc_test_key";
      vi.mocked(config).posthogHost = "https://test.posthog.com";
      vi.mocked(config).debug = false;

      // Mock posthog.init
      const mockInit = vi.fn();
      vi.mocked(posthogModule.default).init = mockInit;

      // Execute
      initPostHog();

      // Assert
      expect(mockInit).toHaveBeenCalledWith("phc_test_key", {
        api_host: "https://test.posthog.com",
        person_profiles: "identified_only",
        capture_pageview: false,
        capture_pageleave: true,
        opt_out_capturing_by_default: true,
        loaded: expect.any(Function),
      });
    });

    it("calls debug when debug mode is enabled", async () => {
      // Re-import mocks after resetModules
      const { analyticsConfig: config } = await import("@/lib/analytics/config");
      const posthogModule = await import("posthog-js");
      const { initPostHog } = await import("@/lib/analytics/client");

      // Mock config
      vi.mocked(config).posthogKey = "phc_test_key";
      vi.mocked(config).posthogHost = "https://test.posthog.com";
      vi.mocked(config).debug = true;

      // Mock posthog instance
      const mockDebug = vi.fn();
      const mockPostHogInstance = { debug: mockDebug };

      const mockInit = vi.fn((_, options) => {
        // Call the loaded callback with mock instance
        if (options?.loaded) {
          options.loaded(mockPostHogInstance);
        }
      });
      // @ts-expect-error - Mock returns void but PostHog.init returns PostHog
      vi.mocked(posthogModule.default).init = mockInit;

      // Execute
      initPostHog();

      // Assert
      expect(mockDebug).toHaveBeenCalled();
    });

    it("does not call debug when debug mode is disabled", async () => {
      // Re-import mocks after resetModules
      const { analyticsConfig: config } = await import("@/lib/analytics/config");
      const posthogModule = await import("posthog-js");
      const { initPostHog } = await import("@/lib/analytics/client");

      // Mock config
      vi.mocked(config).posthogKey = "phc_test_key";
      vi.mocked(config).posthogHost = "https://test.posthog.com";
      vi.mocked(config).debug = false;

      // Mock posthog instance
      const mockDebug = vi.fn();
      const mockPostHogInstance = { debug: mockDebug };

      const mockInit = vi.fn((_, options) => {
        // Call the loaded callback with mock instance
        if (options?.loaded) {
          options.loaded(mockPostHogInstance);
        }
      });
      // @ts-expect-error - Mock returns void but PostHog.init returns PostHog
      vi.mocked(posthogModule.default).init = mockInit;

      // Execute
      initPostHog();

      // Assert
      expect(mockDebug).not.toHaveBeenCalled();
    });

    it("does nothing when window is undefined", async () => {
      // Remove window first
      // @ts-expect-error - Testing server-side behavior
      delete globalThis.window;

      // Re-import mocks after resetModules
      const { analyticsConfig: config } = await import("@/lib/analytics/config");
      const posthogModule = await import("posthog-js");
      const { initPostHog } = await import("@/lib/analytics/client");

      // Mock config
      vi.mocked(config).posthogKey = "phc_test_key";

      // Mock posthog.init
      const mockInit = vi.fn();
      vi.mocked(posthogModule.default).init = mockInit;

      // Execute
      initPostHog();

      // Assert
      expect(mockInit).not.toHaveBeenCalled();
    });

    it("does nothing when posthog key is missing", async () => {
      // Re-import mocks after resetModules
      const { analyticsConfig: config } = await import("@/lib/analytics/config");
      const posthogModule = await import("posthog-js");
      const { initPostHog } = await import("@/lib/analytics/client");

      // Mock config without key
      vi.mocked(config).posthogKey = undefined;

      // Mock posthog.init
      const mockInit = vi.fn();
      vi.mocked(posthogModule.default).init = mockInit;

      // Execute
      initPostHog();

      // Assert
      expect(mockInit).not.toHaveBeenCalled();
    });

    it("does nothing when posthog key is empty string", async () => {
      // Re-import mocks after resetModules
      const { analyticsConfig: config } = await import("@/lib/analytics/config");
      const posthogModule = await import("posthog-js");
      const { initPostHog } = await import("@/lib/analytics/client");

      // Mock config with empty key
      vi.mocked(config).posthogKey = "";

      // Mock posthog.init
      const mockInit = vi.fn();
      vi.mocked(posthogModule.default).init = mockInit;

      // Execute
      initPostHog();

      // Assert
      expect(mockInit).not.toHaveBeenCalled();
    });
  });

  describe("identifyUser", () => {
    it("identifies user with ID and plan when session has subscription", () => {
      // Mock config
      vi.mocked(analyticsConfig).posthogKey = "phc_test_key";

      // Mock posthog.identify
      const mockIdentify = vi.fn();
      vi.mocked(posthog).identify = mockIdentify;

      // Mock session
      const session = {
        user: {
          id: "user-123",
          email: "test@example.com",
        },
        subscription: {
          plan: "PRO",
        },
        expires: "2024-12-31",
      } as Session & { subscription?: { plan: string } };

      // Execute
      identifyUser(session);

      // Assert
      expect(mockIdentify).toHaveBeenCalledWith("user-123", {
        plan: "PRO",
      });
    });

    it("identifies user with FREE plan when no subscription", () => {
      // Mock config
      vi.mocked(analyticsConfig).posthogKey = "phc_test_key";

      // Mock posthog.identify
      const mockIdentify = vi.fn();
      vi.mocked(posthog).identify = mockIdentify;

      // Mock session without subscription
      const session = {
        user: {
          id: "user-456",
          email: "free@example.com",
        },
        expires: "2024-12-31",
      } as Session;

      // Execute
      identifyUser(session);

      // Assert
      expect(mockIdentify).toHaveBeenCalledWith("user-456", {
        plan: "FREE",
      });
    });

    it("does nothing when posthog key is missing", () => {
      // Mock config without key
      vi.mocked(analyticsConfig).posthogKey = undefined;

      // Mock posthog.identify
      const mockIdentify = vi.fn();
      vi.mocked(posthog).identify = mockIdentify;

      // Mock session
      const session = {
        user: {
          id: "user-123",
          email: "test@example.com",
        },
        expires: "2024-12-31",
      } as Session;

      // Execute
      identifyUser(session);

      // Assert
      expect(mockIdentify).not.toHaveBeenCalled();
    });

    it("does nothing when session is null", () => {
      // Mock config
      vi.mocked(analyticsConfig).posthogKey = "phc_test_key";

      // Mock posthog.identify
      const mockIdentify = vi.fn();
      vi.mocked(posthog).identify = mockIdentify;

      // Execute with null session
      // @ts-expect-error - Testing null case
      identifyUser(null);

      // Assert
      expect(mockIdentify).not.toHaveBeenCalled();
    });

    it("does nothing when session has no user", () => {
      // Mock config
      vi.mocked(analyticsConfig).posthogKey = "phc_test_key";

      // Mock posthog.identify
      const mockIdentify = vi.fn();
      vi.mocked(posthog).identify = mockIdentify;

      // Execute with session without user
      const session = {
        expires: "2024-12-31",
      } as Session;

      identifyUser(session);

      // Assert
      expect(mockIdentify).not.toHaveBeenCalled();
    });

    it("does nothing when session user has no ID", () => {
      // Mock config
      vi.mocked(analyticsConfig).posthogKey = "phc_test_key";

      // Mock posthog.identify
      const mockIdentify = vi.fn();
      vi.mocked(posthog).identify = mockIdentify;

      // Execute with user without ID
      const session = {
        user: {
          email: "test@example.com",
        },
        expires: "2024-12-31",
      } as Session;

      identifyUser(session);

      // Assert
      expect(mockIdentify).not.toHaveBeenCalled();
    });
  });

  describe("trackEvent", () => {
    it("tracks event with name and properties", () => {
      // Mock config
      vi.mocked(analyticsConfig).posthogKey = "phc_test_key";

      // Mock posthog.capture
      const mockCapture = vi.fn();
      vi.mocked(posthog).capture = mockCapture;

      // Execute
      trackEvent("feature_used", {
        feature: "export",
        format: "pdf",
      });

      // Assert
      expect(mockCapture).toHaveBeenCalledWith("feature_used", {
        feature: "export",
        format: "pdf",
      });
    });

    it("tracks event with name only when no properties", () => {
      // Mock config
      vi.mocked(analyticsConfig).posthogKey = "phc_test_key";

      // Mock posthog.capture
      const mockCapture = vi.fn();
      vi.mocked(posthog).capture = mockCapture;

      // Execute
      trackEvent("button_clicked");

      // Assert
      expect(mockCapture).toHaveBeenCalledWith("button_clicked", undefined);
    });

    it("does nothing when posthog key is missing", () => {
      // Mock config without key
      vi.mocked(analyticsConfig).posthogKey = undefined;

      // Mock posthog.capture
      const mockCapture = vi.fn();
      vi.mocked(posthog).capture = mockCapture;

      // Execute
      trackEvent("event_name");

      // Assert
      expect(mockCapture).not.toHaveBeenCalled();
    });

    it("handles complex property values", () => {
      // Mock config
      vi.mocked(analyticsConfig).posthogKey = "phc_test_key";

      // Mock posthog.capture
      const mockCapture = vi.fn();
      vi.mocked(posthog).capture = mockCapture;

      // Execute with complex properties
      trackEvent("complex_event", {
        stringProp: "value",
        numberProp: 42,
        booleanProp: true,
        arrayProp: [1, 2, 3],
        objectProp: { nested: "value" },
      });

      // Assert
      expect(mockCapture).toHaveBeenCalledWith("complex_event", {
        stringProp: "value",
        numberProp: 42,
        booleanProp: true,
        arrayProp: [1, 2, 3],
        objectProp: { nested: "value" },
      });
    });
  });

  describe("trackPageView", () => {
    it("tracks pageview with $pageview event and $current_url property", () => {
      // Mock config
      vi.mocked(analyticsConfig).posthogKey = "phc_test_key";

      // Mock posthog.capture
      const mockCapture = vi.fn();
      vi.mocked(posthog).capture = mockCapture;

      // Execute
      trackPageView("/dashboard");

      // Assert
      expect(mockCapture).toHaveBeenCalledWith("$pageview", {
        $current_url: "/dashboard",
      });
    });

    it("tracks pageview with full URL", () => {
      // Mock config
      vi.mocked(analyticsConfig).posthogKey = "phc_test_key";

      // Mock posthog.capture
      const mockCapture = vi.fn();
      vi.mocked(posthog).capture = mockCapture;

      // Execute
      trackPageView("https://example.com/pricing");

      // Assert
      expect(mockCapture).toHaveBeenCalledWith("$pageview", {
        $current_url: "https://example.com/pricing",
      });
    });

    it("does nothing when posthog key is missing", () => {
      // Mock config without key
      vi.mocked(analyticsConfig).posthogKey = undefined;

      // Mock posthog.capture
      const mockCapture = vi.fn();
      vi.mocked(posthog).capture = mockCapture;

      // Execute
      trackPageView("/page");

      // Assert
      expect(mockCapture).not.toHaveBeenCalled();
    });
  });

  describe("setUserProperties", () => {
    it("sets user properties with provided data", () => {
      // Mock config
      vi.mocked(analyticsConfig).posthogKey = "phc_test_key";

      // Mock posthog.setPersonProperties
      const mockSetPersonProperties = vi.fn();
      vi.mocked(posthog).setPersonProperties = mockSetPersonProperties;

      // Execute
      setUserProperties({
        subscription: "PRO",
        company_size: "10-50",
      });

      // Assert
      expect(mockSetPersonProperties).toHaveBeenCalledWith({
        subscription: "PRO",
        company_size: "10-50",
      });
    });

    it("sets user properties with empty object", () => {
      // Mock config
      vi.mocked(analyticsConfig).posthogKey = "phc_test_key";

      // Mock posthog.setPersonProperties
      const mockSetPersonProperties = vi.fn();
      vi.mocked(posthog).setPersonProperties = mockSetPersonProperties;

      // Execute
      setUserProperties({});

      // Assert
      expect(mockSetPersonProperties).toHaveBeenCalledWith({});
    });

    it("does nothing when posthog key is missing", () => {
      // Mock config without key
      vi.mocked(analyticsConfig).posthogKey = undefined;

      // Mock posthog.setPersonProperties
      const mockSetPersonProperties = vi.fn();
      vi.mocked(posthog).setPersonProperties = mockSetPersonProperties;

      // Execute
      setUserProperties({ plan: "PRO" });

      // Assert
      expect(mockSetPersonProperties).not.toHaveBeenCalled();
    });

    it("handles complex property values", () => {
      // Mock config
      vi.mocked(analyticsConfig).posthogKey = "phc_test_key";

      // Mock posthog.setPersonProperties
      const mockSetPersonProperties = vi.fn();
      vi.mocked(posthog).setPersonProperties = mockSetPersonProperties;

      // Execute
      setUserProperties({
        preferences: {
          theme: "dark",
          notifications: true,
        },
        features: ["export", "import"],
      });

      // Assert
      expect(mockSetPersonProperties).toHaveBeenCalledWith({
        preferences: {
          theme: "dark",
          notifications: true,
        },
        features: ["export", "import"],
      });
    });
  });

  describe("resetAnalytics", () => {
    it("calls posthog.reset() when key is present", () => {
      // Mock config
      vi.mocked(analyticsConfig).posthogKey = "phc_test_key";

      // Mock posthog.reset
      const mockReset = vi.fn();
      vi.mocked(posthog).reset = mockReset;

      // Execute
      resetAnalytics();

      // Assert
      expect(mockReset).toHaveBeenCalled();
    });

    it("does nothing when posthog key is missing", () => {
      // Mock config without key
      vi.mocked(analyticsConfig).posthogKey = undefined;

      // Mock posthog.reset
      const mockReset = vi.fn();
      vi.mocked(posthog).reset = mockReset;

      // Execute
      resetAnalytics();

      // Assert
      expect(mockReset).not.toHaveBeenCalled();
    });
  });

  describe("optInAnalytics", () => {
    it("calls posthog.opt_in_capturing() when key is present", () => {
      // Mock config
      vi.mocked(analyticsConfig).posthogKey = "phc_test_key";

      // Mock posthog.opt_in_capturing
      const mockOptIn = vi.fn();
      vi.mocked(posthog).opt_in_capturing = mockOptIn;

      // Execute
      optInAnalytics();

      // Assert
      expect(mockOptIn).toHaveBeenCalled();
    });

    it("does nothing when posthog key is missing", () => {
      // Mock config without key
      vi.mocked(analyticsConfig).posthogKey = undefined;

      // Mock posthog.opt_in_capturing
      const mockOptIn = vi.fn();
      vi.mocked(posthog).opt_in_capturing = mockOptIn;

      // Execute
      optInAnalytics();

      // Assert
      expect(mockOptIn).not.toHaveBeenCalled();
    });
  });

  describe("optOutAnalytics", () => {
    it("calls posthog.opt_out_capturing() when key is present", () => {
      // Mock config
      vi.mocked(analyticsConfig).posthogKey = "phc_test_key";

      // Mock posthog.opt_out_capturing
      const mockOptOut = vi.fn();
      vi.mocked(posthog).opt_out_capturing = mockOptOut;

      // Execute
      optOutAnalytics();

      // Assert
      expect(mockOptOut).toHaveBeenCalled();
    });

    it("does nothing when posthog key is missing", () => {
      // Mock config without key
      vi.mocked(analyticsConfig).posthogKey = undefined;

      // Mock posthog.opt_out_capturing
      const mockOptOut = vi.fn();
      vi.mocked(posthog).opt_out_capturing = mockOptOut;

      // Execute
      optOutAnalytics();

      // Assert
      expect(mockOptOut).not.toHaveBeenCalled();
    });
  });

  describe("getPostHog", () => {
    it("returns posthog instance", () => {
      // Execute
      const result = getPostHog();

      // Assert
      expect(result).toBe(posthog);
    });
  });
});
