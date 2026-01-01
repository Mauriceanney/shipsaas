/**
 * Tests for navigation utilities
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Next.js navigation using hoisted pattern
const { mockRedirect } = vi.hoisted(() => ({
  mockRedirect: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

import { asDynamicRoute, navigateTo, navigateAndRefresh, redirectTo } from "@/lib/navigation";

describe("navigation utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("asDynamicRoute", () => {
    it("preserves absolute paths", () => {
      const route = asDynamicRoute("/dashboard");
      expect(route).toBe("/dashboard");
    });

    it("preserves paths with query parameters", () => {
      const route = asDynamicRoute("/login?callbackUrl=/pricing");
      expect(route).toBe("/login?callbackUrl=/pricing");
    });

    it("preserves full URLs", () => {
      const route = asDynamicRoute("https://stripe.com/checkout");
      expect(route).toBe("https://stripe.com/checkout");
    });

    it("adds leading slash to relative paths", () => {
      const route = asDynamicRoute("dashboard");
      expect(route).toBe("/dashboard");
    });
  });

  describe("navigateTo", () => {
    it("calls router.push with the route", () => {
      const mockRouter = { push: vi.fn() };
      const route = asDynamicRoute("/dashboard");

      navigateTo(mockRouter, route);

      expect(mockRouter.push).toHaveBeenCalledWith("/dashboard");
    });

    it("handles complex URLs", () => {
      const mockRouter = { push: vi.fn() };
      const route = asDynamicRoute("/login/verify-2fa?userId=123&callbackUrl=%2Fdashboard");

      navigateTo(mockRouter, route);

      expect(mockRouter.push).toHaveBeenCalledWith("/login/verify-2fa?userId=123&callbackUrl=%2Fdashboard");
    });
  });

  describe("navigateAndRefresh", () => {
    it("calls push and refresh", () => {
      const mockRouter = { push: vi.fn(), refresh: vi.fn() };
      const route = asDynamicRoute("/dashboard");

      navigateAndRefresh(mockRouter, route);

      expect(mockRouter.push).toHaveBeenCalledWith("/dashboard");
      expect(mockRouter.refresh).toHaveBeenCalled();
    });
  });

  describe("redirectTo", () => {
    it("calls next/navigation redirect", () => {
      mockRedirect.mockImplementation(() => {
        throw new Error("NEXT_REDIRECT");
      });

      expect(() => redirectTo("/settings")).toThrow("NEXT_REDIRECT");
      expect(mockRedirect).toHaveBeenCalledWith("/settings");
    });

    it("handles external URLs", () => {
      mockRedirect.mockImplementation(() => {
        throw new Error("NEXT_REDIRECT");
      });

      expect(() => redirectTo("https://stripe.com/portal")).toThrow("NEXT_REDIRECT");
      expect(mockRedirect).toHaveBeenCalledWith("https://stripe.com/portal");
    });
  });
});
