import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies BEFORE imports
vi.mock("web-vitals", () => ({
  onCLS: vi.fn(),
  onINP: vi.fn(),
  onLCP: vi.fn(),
  onTTFB: vi.fn(),
}));

vi.mock("@/lib/analytics/client", () => ({
  trackEvent: vi.fn(),
}));

vi.mock("@/lib/analytics/config", () => ({
  analyticsConfig: {
    posthogKey: "phc_test_key",
  },
}));

import { onCLS, onINP, onLCP, onTTFB } from "web-vitals";
import { trackEvent } from "@/lib/analytics/client";
import { reportWebVitals } from "@/lib/analytics/web-vitals";

import type { CLSMetric, INPMetric, LCPMetric, TTFBMetric } from "web-vitals";

describe("Web Vitals Tracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("reportWebVitals", () => {
    it("registers all web vitals listeners", () => {
      // Execute
      reportWebVitals();

      // Assert - all listeners registered
      expect(onCLS).toHaveBeenCalledTimes(1);
      expect(onINP).toHaveBeenCalledTimes(1);
      expect(onLCP).toHaveBeenCalledTimes(1);
      expect(onTTFB).toHaveBeenCalledTimes(1);
    });

    it("tracks CLS metric when callback is triggered", () => {
      // Setup
      vi.mocked(onCLS).mockImplementation((callback) => {
        const metric: CLSMetric = {
          name: "CLS",
          value: 0.05,
          rating: "good",
          delta: 0.05,
          id: "v3-123",
          navigationType: "navigate",
          entries: [],
        };
        callback(metric);
      });

      // Execute
      reportWebVitals();

      // Assert
      expect(trackEvent).toHaveBeenCalledWith("web_vital", {
        name: "CLS",
        value: 0.05,
        rating: "good",
        id: "v3-123",
        navigationType: "navigate",
      });
    });

    it("tracks LCP metric when callback is triggered", () => {
      // Setup
      vi.mocked(onLCP).mockImplementation((callback) => {
        const metric: LCPMetric = {
          name: "LCP",
          value: 2400,
          rating: "good",
          delta: 2400,
          id: "v3-456",
          navigationType: "navigate",
          entries: [],
        };
        callback(metric);
      });

      // Execute
      reportWebVitals();

      // Assert
      expect(trackEvent).toHaveBeenCalledWith("web_vital", {
        name: "LCP",
        value: 2400,
        rating: "good",
        id: "v3-456",
        navigationType: "navigate",
      });
    });

    it("tracks INP metric when callback is triggered", () => {
      // Setup
      vi.mocked(onINP).mockImplementation((callback) => {
        const metric: INPMetric = {
          name: "INP",
          value: 150,
          rating: "good",
          delta: 150,
          id: "v3-101",
          navigationType: "navigate",
          entries: [],
        };
        callback(metric);
      });

      // Execute
      reportWebVitals();

      // Assert
      expect(trackEvent).toHaveBeenCalledWith("web_vital", {
        name: "INP",
        value: 150,
        rating: "good",
        id: "v3-101",
        navigationType: "navigate",
      });
    });

    it("tracks TTFB metric when callback is triggered", () => {
      // Setup
      vi.mocked(onTTFB).mockImplementation((callback) => {
        const metric: TTFBMetric = {
          name: "TTFB",
          value: 300,
          rating: "good",
          delta: 300,
          id: "v3-102",
          navigationType: "navigate",
          entries: [],
        };
        callback(metric);
      });

      // Execute
      reportWebVitals();

      // Assert
      expect(trackEvent).toHaveBeenCalledWith("web_vital", {
        name: "TTFB",
        value: 300,
        rating: "good",
        id: "v3-102",
        navigationType: "navigate",
      });
    });

    it("tracks metric with needs-improvement rating", () => {
      // Setup
      vi.mocked(onCLS).mockImplementation((callback) => {
        const metric: CLSMetric = {
          name: "CLS",
          value: 0.15,
          rating: "needs-improvement",
          delta: 0.15,
          id: "v3-200",
          navigationType: "navigate",
          entries: [],
        };
        callback(metric);
      });

      // Execute
      reportWebVitals();

      // Assert
      expect(trackEvent).toHaveBeenCalledWith("web_vital", {
        name: "CLS",
        value: 0.15,
        rating: "needs-improvement",
        id: "v3-200",
        navigationType: "navigate",
      });
    });

    it("tracks metric with poor rating", () => {
      // Setup
      vi.mocked(onLCP).mockImplementation((callback) => {
        const metric: LCPMetric = {
          name: "LCP",
          value: 5000,
          rating: "poor",
          delta: 5000,
          id: "v3-300",
          navigationType: "navigate",
          entries: [],
        };
        callback(metric);
      });

      // Execute
      reportWebVitals();

      // Assert
      expect(trackEvent).toHaveBeenCalledWith("web_vital", {
        name: "LCP",
        value: 5000,
        rating: "poor",
        id: "v3-300",
        navigationType: "navigate",
      });
    });

    it("tracks metrics with different navigation types", () => {
      // Setup
      vi.mocked(onCLS).mockImplementation((callback) => {
        const metric: CLSMetric = {
          name: "CLS",
          value: 0.05,
          rating: "good",
          delta: 0.05,
          id: "v3-400",
          navigationType: "reload",
          entries: [],
        };
        callback(metric);
      });

      // Execute
      reportWebVitals();

      // Assert
      expect(trackEvent).toHaveBeenCalledWith("web_vital", {
        name: "CLS",
        value: 0.05,
        rating: "good",
        id: "v3-400",
        navigationType: "reload",
      });
    });

    it("tracks metrics with back-forward navigation", () => {
      // Setup
      vi.mocked(onLCP).mockImplementation((callback) => {
        const metric: LCPMetric = {
          name: "LCP",
          value: 1800,
          rating: "good",
          delta: 1800,
          id: "v3-500",
          navigationType: "back-forward",
          entries: [],
        };
        callback(metric);
      });

      // Execute
      reportWebVitals();

      // Assert
      expect(trackEvent).toHaveBeenCalledWith("web_vital", {
        name: "LCP",
        value: 1800,
        rating: "good",
        id: "v3-500",
        navigationType: "back-forward",
      });
    });

    it("can be called multiple times without duplicate registrations", () => {
      // Execute multiple times
      reportWebVitals();
      reportWebVitals();
      reportWebVitals();

      // Assert - should only register once per call (3 times total)
      expect(onCLS).toHaveBeenCalledTimes(3);
      expect(onINP).toHaveBeenCalledTimes(3);
      expect(onLCP).toHaveBeenCalledTimes(3);
      expect(onTTFB).toHaveBeenCalledTimes(3);
    });
  });
});
