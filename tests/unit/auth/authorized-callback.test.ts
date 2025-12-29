/**
 * Tests for Auth.js authorized callback - route protection logic
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock the db module
vi.mock("@/lib/db", () => ({
  db: {},
}));

// Import after mocking
import { authConfig } from "@/lib/auth/config";

// Helper to create mock request
function createMockRequest(pathname: string) {
  return {
    nextUrl: {
      pathname,
      toString: () => `http://localhost:3000${pathname}`,
    },
  };
}

// Helper to create mock auth object
function createMockAuth(isLoggedIn: boolean) {
  return isLoggedIn ? { user: { id: "user-123", role: "USER" } } : null;
}

describe("Auth.js Authorized Callback", () => {
  const authorizedCallback = authConfig.callbacks?.authorized;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  if (!authorizedCallback) {
    throw new Error("authorized callback not found in authConfig");
  }

  describe("Public Routes", () => {
    const publicPaths = [
      "/",
      "/pricing",
      "/blog",
      "/blog/some-post",
      "/login",
      "/signup",
      "/forgot-password",
      "/reset-password",
      "/verify-email",
    ];

    it.each(publicPaths)(
      "should allow unauthenticated access to %s",
      (path) => {
        const result = authorizedCallback({
          auth: createMockAuth(false),
          request: createMockRequest(path),
        } as any);

        // Public routes should return true (allow access) for unauthenticated users
        // Auth routes might redirect logged-in users, but should allow non-logged-in
        expect(result).toBe(true);
      }
    );

    it.each(publicPaths)(
      "should allow authenticated access to %s (except auth routes)",
      (path) => {
        const result = authorizedCallback({
          auth: createMockAuth(true),
          request: createMockRequest(path),
        } as any);

        // Auth routes redirect logged-in users, others return true
        const authRoutes = [
          "/login",
          "/signup",
          "/forgot-password",
          "/reset-password",
        ];
        const isAuthRoute = authRoutes.some(
          (route) => path === route || path.startsWith(`${route}/`)
        );

        if (isAuthRoute) {
          // Should redirect to dashboard
          expect(result).toBeInstanceOf(Response);
        } else {
          expect(result).toBe(true);
        }
      }
    );
  });

  describe("Protected Routes - Dashboard", () => {
    const dashboardPaths = [
      "/dashboard",
      "/dashboard/analytics",
      "/dashboard/reports",
    ];

    it.each(dashboardPaths)(
      "should deny unauthenticated access to %s",
      (path) => {
        const result = authorizedCallback({
          auth: createMockAuth(false),
          request: createMockRequest(path),
        } as any);

        expect(result).toBe(false);
      }
    );

    it.each(dashboardPaths)(
      "should allow authenticated access to %s",
      (path) => {
        const result = authorizedCallback({
          auth: createMockAuth(true),
          request: createMockRequest(path),
        } as any);

        expect(result).toBe(true);
      }
    );
  });

  describe("Protected Routes - Settings", () => {
    const settingsPaths = [
      "/settings",
      "/settings/profile",
      "/settings/security",
      "/settings/billing",
    ];

    it.each(settingsPaths)(
      "should deny unauthenticated access to %s",
      (path) => {
        const result = authorizedCallback({
          auth: createMockAuth(false),
          request: createMockRequest(path),
        } as any);

        expect(result).toBe(false);
      }
    );

    it.each(settingsPaths)(
      "should allow authenticated access to %s",
      (path) => {
        const result = authorizedCallback({
          auth: createMockAuth(true),
          request: createMockRequest(path),
        } as any);

        expect(result).toBe(true);
      }
    );
  });

  describe("Protected Routes - Admin", () => {
    const adminPaths = [
      "/admin",
      "/admin/users",
      "/admin/users/123",
      "/admin/plans",
      "/admin/settings",
    ];

    it.each(adminPaths)("should deny unauthenticated access to %s", (path) => {
      const result = authorizedCallback({
        auth: createMockAuth(false),
        request: createMockRequest(path),
      } as any);

      expect(result).toBe(false);
    });

    it.each(adminPaths)("should allow authenticated access to %s", (path) => {
      const result = authorizedCallback({
        auth: createMockAuth(true),
        request: createMockRequest(path),
      } as any);

      // Note: Role-based access (ADMIN only) is handled by requireAdmin() in layout
      // The authorized callback only checks authentication, not authorization
      expect(result).toBe(true);
    });
  });

  describe("Protected Routes - Checkout", () => {
    const checkoutPaths = ["/checkout", "/checkout/success"];

    it.each(checkoutPaths)(
      "should deny unauthenticated access to %s",
      (path) => {
        const result = authorizedCallback({
          auth: createMockAuth(false),
          request: createMockRequest(path),
        } as any);

        expect(result).toBe(false);
      }
    );

    it.each(checkoutPaths)(
      "should allow authenticated access to %s",
      (path) => {
        const result = authorizedCallback({
          auth: createMockAuth(true),
          request: createMockRequest(path),
        } as any);

        expect(result).toBe(true);
      }
    );
  });

  describe("API Routes", () => {
    const apiPaths = [
      "/api/health",
      "/api/auth/session",
      "/api/stripe/checkout",
      "/api/webhooks/stripe",
    ];

    it.each(apiPaths)(
      "should skip auth check for %s (handled by API itself)",
      (path) => {
        const result = authorizedCallback({
          auth: createMockAuth(false),
          request: createMockRequest(path),
        } as any);

        // API routes return true - they handle their own auth
        expect(result).toBe(true);
      }
    );
  });

  describe("Auth Route Redirect", () => {
    const authRoutes = [
      "/login",
      "/signup",
      "/forgot-password",
      "/reset-password",
    ];

    it.each(authRoutes)(
      "should redirect logged-in users from %s to dashboard",
      (path) => {
        const result = authorizedCallback({
          auth: createMockAuth(true),
          request: createMockRequest(path),
        } as any);

        expect(result).toBeInstanceOf(Response);
        if (result instanceof Response) {
          expect(result.headers.get("location")).toContain("/dashboard");
        }
      }
    );
  });

  describe("Unknown Routes", () => {
    it("should deny unauthenticated access to unknown routes", () => {
      const result = authorizedCallback({
        auth: createMockAuth(false),
        request: createMockRequest("/some-random-page"),
      } as any);

      // Any route not in public list should require auth
      expect(result).toBe(false);
    });

    it("should allow authenticated access to unknown routes", () => {
      const result = authorizedCallback({
        auth: createMockAuth(true),
        request: createMockRequest("/some-random-page"),
      } as any);

      expect(result).toBe(true);
    });
  });
});
