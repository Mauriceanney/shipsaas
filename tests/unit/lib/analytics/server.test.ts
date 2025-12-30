import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted to ensure mocks are available before vi.mock hoisting
const { mockCapture, mockIdentify, mockShutdown, MockPostHog } = vi.hoisted(
  () => {
    const mockCapture = vi.fn();
    const mockIdentify = vi.fn();
    const mockShutdown = vi.fn().mockResolvedValue(undefined);
    const MockPostHog = vi.fn().mockImplementation(() => ({
      capture: mockCapture,
      identify: mockIdentify,
      shutdown: mockShutdown,
    }));
    return { mockCapture, mockIdentify, mockShutdown, MockPostHog };
  }
);

vi.mock("posthog-node", () => ({
  PostHog: MockPostHog,
}));

vi.mock("@/lib/analytics/config", () => ({
  analyticsConfig: {
    posthogKey: "test-key",
    posthogHost: "https://test.posthog.com",
    enabled: true,
    debug: false,
  },
}));

import {
  getPostHogClient,
  trackServerEvent,
  identifyUserServer,
  shutdownAnalytics,
} from "@/lib/analytics/server";

describe("analytics/server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPostHogClient", () => {
    it("creates PostHog client with correct config on first call", () => {
      const client = getPostHogClient();

      expect(client).not.toBeNull();
      expect(MockPostHog).toHaveBeenCalledWith("test-key", {
        host: "https://test.posthog.com",
        flushAt: 20,
        flushInterval: 10000,
      });
    });

    it("returns same instance on subsequent calls (singleton)", () => {
      const client1 = getPostHogClient();
      const client2 = getPostHogClient();

      expect(client1).toBe(client2);
    });
  });

  describe("trackServerEvent", () => {
    it("calls client.capture with correct params", () => {
      getPostHogClient();

      trackServerEvent("user-123", "subscription_created", {
        plan: "pro",
        amount: 2000,
      });

      expect(mockCapture).toHaveBeenCalledWith({
        distinctId: "user-123",
        event: "subscription_created",
        properties: {
          plan: "pro",
          amount: 2000,
        },
      });
    });

    it("calls client.capture without properties", () => {
      getPostHogClient();

      trackServerEvent("user-456", "user_logged_in");

      expect(mockCapture).toHaveBeenCalledWith({
        distinctId: "user-456",
        event: "user_logged_in",
        properties: undefined,
      });
    });

    it("handles empty properties object", () => {
      getPostHogClient();

      trackServerEvent("user-789", "page_viewed", {});

      expect(mockCapture).toHaveBeenCalledWith({
        distinctId: "user-789",
        event: "page_viewed",
        properties: {},
      });
    });
  });

  describe("identifyUserServer", () => {
    it("calls client.identify with correct params", () => {
      getPostHogClient();

      identifyUserServer("user-123", {
        email: "user@example.com",
        name: "Test User",
        plan: "pro",
      });

      expect(mockIdentify).toHaveBeenCalledWith({
        distinctId: "user-123",
        properties: {
          email: "user@example.com",
          name: "Test User",
          plan: "pro",
        },
      });
    });

    it("calls client.identify with minimal properties", () => {
      getPostHogClient();

      identifyUserServer("user-456", {
        email: "minimal@example.com",
      });

      expect(mockIdentify).toHaveBeenCalledWith({
        distinctId: "user-456",
        properties: {
          email: "minimal@example.com",
        },
      });
    });
  });

  describe("shutdownAnalytics", () => {
    it("calls client.shutdown() when client exists", async () => {
      getPostHogClient();

      await shutdownAnalytics();

      expect(mockShutdown).toHaveBeenCalledTimes(1);
    });

    it("resolves successfully when shutdown completes", async () => {
      getPostHogClient();

      const shutdownPromise = shutdownAnalytics();

      await expect(shutdownPromise).resolves.toBeUndefined();
    });
  });

  describe("edge cases", () => {
    it("handles special characters in event names", () => {
      getPostHogClient();

      trackServerEvent("user-1", "subscription:created", { test: true });

      expect(mockCapture).toHaveBeenCalledWith({
        distinctId: "user-1",
        event: "subscription:created",
        properties: { test: true },
      });
    });

    it("handles complex property values", () => {
      getPostHogClient();

      const complexProperties = {
        nested: { value: "test" },
        array: [1, 2, 3],
        boolean: true,
        number: 42,
        null: null,
        undefined: undefined,
      };

      trackServerEvent("user-1", "complex_event", complexProperties);

      expect(mockCapture).toHaveBeenCalledWith({
        distinctId: "user-1",
        event: "complex_event",
        properties: complexProperties,
      });
    });

    it("handles long user IDs", () => {
      getPostHogClient();

      const longUserId = "a".repeat(500);

      trackServerEvent(longUserId, "test_event");

      expect(mockCapture).toHaveBeenCalledWith({
        distinctId: longUserId,
        event: "test_event",
        properties: undefined,
      });
    });
  });
});
