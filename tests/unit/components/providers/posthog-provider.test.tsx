import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted to ensure mocks are available before vi.mock hoisting
const { mockAnalyticsConfig } = vi.hoisted(() => {
  const mockAnalyticsConfig = {
    posthogKey: "test-key" as string | undefined,
    posthogHost: "https://test.posthog.com",
    enabled: true,
    debug: false,
  };
  return { mockAnalyticsConfig };
});

// Mock dependencies BEFORE imports
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock("posthog-js", () => ({
  default: {
    init: vi.fn(),
    capture: vi.fn(),
    __loaded: false,
  },
}));

vi.mock("posthog-js/react", () => ({
  PostHogProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="ph-provider">{children}</div>
  ),
  usePostHog: vi.fn(),
}));

vi.mock("@/lib/analytics/client", () => ({
  initPostHog: vi.fn(),
}));

vi.mock("@/lib/analytics/config", () => ({
  analyticsConfig: mockAnalyticsConfig,
}));

import { PostHogProvider } from "@/components/providers/posthog-provider";
import { usePathname, useSearchParams } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { initPostHog } from "@/lib/analytics/client";

describe("PostHogProvider", () => {
  // Mock window.origin
  const originalOrigin = window.origin;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "origin", {
      writable: true,
      value: "https://example.com",
    });

    // Reset config to default
    mockAnalyticsConfig.posthogKey = "test-key";

    // Default mocks
    vi.mocked(usePathname).mockReturnValue("/");
    vi.mocked(useSearchParams).mockReturnValue(null as unknown as ReturnType<typeof useSearchParams>);
    vi.mocked(usePostHog).mockReturnValue({
      capture: vi.fn(),
    } as unknown as ReturnType<typeof usePostHog>);
  });

  afterEach(() => {
    Object.defineProperty(window, "origin", {
      writable: true,
      value: originalOrigin,
    });
  });

  describe("when PostHog key is missing", () => {
    it("renders children without PostHog provider", () => {
      mockAnalyticsConfig.posthogKey = undefined;

      render(
        <PostHogProvider>
          <div data-testid="test-child">Test Content</div>
        </PostHogProvider>
      );

      expect(screen.getByTestId("test-child")).toBeInTheDocument();
      expect(screen.queryByTestId("ph-provider")).not.toBeInTheDocument();
    });

    it("still calls initPostHog on mount even without key", () => {
      mockAnalyticsConfig.posthogKey = undefined;

      render(
        <PostHogProvider>
          <div>Test</div>
        </PostHogProvider>
      );

      expect(initPostHog).toHaveBeenCalled();
    });
  });

  describe("when PostHog key is present", () => {
    beforeEach(() => {
      mockAnalyticsConfig.posthogKey = "test-key";
    });

    it("renders children wrapped with PHProvider when key present", () => {
      render(
        <PostHogProvider>
          <div data-testid="test-child">Test Content</div>
        </PostHogProvider>
      );

      expect(screen.getByTestId("ph-provider")).toBeInTheDocument();
      expect(screen.getByTestId("test-child")).toBeInTheDocument();
    });

    it("calls initPostHog on mount", () => {
      render(
        <PostHogProvider>
          <div>Test</div>
        </PostHogProvider>
      );

      expect(initPostHog).toHaveBeenCalledTimes(1);
    });

    it("only calls initPostHog once even with re-renders", () => {
      const { rerender } = render(
        <PostHogProvider>
          <div>Test</div>
        </PostHogProvider>
      );

      expect(initPostHog).toHaveBeenCalledTimes(1);

      rerender(
        <PostHogProvider>
          <div>Test Updated</div>
        </PostHogProvider>
      );

      expect(initPostHog).toHaveBeenCalledTimes(1);
    });
  });

  describe("page view tracking", () => {
    beforeEach(() => {
      mockAnalyticsConfig.posthogKey = "test-key";
    });

    it("tracks page view on initial render with pathname", async () => {
      const mockCapture = vi.fn();
      vi.mocked(usePathname).mockReturnValue("/dashboard");
      vi.mocked(useSearchParams).mockReturnValue(null as unknown as ReturnType<typeof useSearchParams>);
      vi.mocked(usePostHog).mockReturnValue({
        capture: mockCapture,
      } as unknown as ReturnType<typeof usePostHog>);

      render(
        <PostHogProvider>
          <div>Test</div>
        </PostHogProvider>
      );

      await waitFor(() => {
        expect(mockCapture).toHaveBeenCalledWith("$pageview", {
          $current_url: "https://example.com/dashboard",
        });
      });
    });

    it("tracks page view with search params", async () => {
      const mockCapture = vi.fn();
      const mockSearchParams = {
        toString: () => "tab=settings&view=profile",
      } as unknown as ReturnType<typeof useSearchParams>;

      vi.mocked(usePathname).mockReturnValue("/settings");
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams);
      vi.mocked(usePostHog).mockReturnValue({
        capture: mockCapture,
      } as unknown as ReturnType<typeof usePostHog>);

      render(
        <PostHogProvider>
          <div>Test</div>
        </PostHogProvider>
      );

      await waitFor(() => {
        expect(mockCapture).toHaveBeenCalledWith("$pageview", {
          $current_url: "https://example.com/settings?tab=settings&view=profile",
        });
      });
    });

    it("does not track page view when pathname is null", async () => {
      const mockCapture = vi.fn();
      vi.mocked(usePathname).mockReturnValue(null as unknown as string);
      vi.mocked(usePostHog).mockReturnValue({
        capture: mockCapture,
      } as unknown as ReturnType<typeof usePostHog>);

      render(
        <PostHogProvider>
          <div>Test</div>
        </PostHogProvider>
      );

      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(mockCapture).not.toHaveBeenCalled();
    });

    it("does not track page view when posthog client is null", async () => {
      const mockCapture = vi.fn();
      vi.mocked(usePathname).mockReturnValue("/dashboard");
      vi.mocked(usePostHog).mockReturnValue(null as unknown as ReturnType<typeof usePostHog>);

      render(
        <PostHogProvider>
          <div>Test</div>
        </PostHogProvider>
      );

      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(mockCapture).not.toHaveBeenCalled();
    });
  });

  describe("Suspense boundary", () => {
    beforeEach(() => {
      mockAnalyticsConfig.posthogKey = "test-key";
    });

    it("works with Suspense boundary and renders children", () => {
      render(
        <PostHogProvider>
          <div data-testid="suspense-child">Suspense Test</div>
        </PostHogProvider>
      );

      expect(screen.getByTestId("suspense-child")).toBeInTheDocument();
    });

    it("renders page view tracker inside Suspense", async () => {
      const mockCapture = vi.fn();
      vi.mocked(usePathname).mockReturnValue("/test");
      vi.mocked(usePostHog).mockReturnValue({
        capture: mockCapture,
      } as unknown as ReturnType<typeof usePostHog>);

      render(
        <PostHogProvider>
          <div>Test</div>
        </PostHogProvider>
      );

      await waitFor(() => {
        expect(mockCapture).toHaveBeenCalledWith("$pageview", {
          $current_url: "https://example.com/test",
        });
      });
    });
  });

  describe("accessibility", () => {
    beforeEach(() => {
      mockAnalyticsConfig.posthogKey = "test-key";
    });

    it("does not add extra wrapper elements affecting layout", () => {
      render(
        <PostHogProvider>
          <main data-testid="main-content">Main Content</main>
        </PostHogProvider>
      );

      const mainElement = screen.getByTestId("main-content");
      expect(mainElement.tagName).toBe("MAIN");
    });

    it("does not interfere with child component accessibility", () => {
      render(
        <PostHogProvider>
          <button aria-label="Test Button">Click Me</button>
        </PostHogProvider>
      );

      const button = screen.getByRole("button", { name: "Test Button" });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAccessibleName("Test Button");
    });
  });
});
