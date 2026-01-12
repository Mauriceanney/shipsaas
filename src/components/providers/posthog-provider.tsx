"use client";

/**
 * PostHog Analytics Provider
 * Initializes PostHog and provides context for client-side tracking
 */

import { Suspense, useEffect, useSyncExternalStore } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { initPostHog } from "@/lib/analytics/client";
import { analyticsConfig } from "@/lib/analytics/config";
import { reportWebVitals } from "@/lib/analytics/web-vitals";

/**
 * Subscribe function for useSyncExternalStore (empty - no external state changes)
 */
const emptySubscribe = () => () => {};

/**
 * Hook to check if component is mounted (client-side only)
 * Uses useSyncExternalStore to avoid hydration mismatch
 */
function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

/**
 * Page view tracker component
 * Tracks page views on route changes
 */
function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthogClient = usePostHog();

  useEffect(() => {
    if (pathname && posthogClient) {
      let url = window.origin + pathname;
      if (searchParams?.toString()) {
        url = url + "?" + searchParams.toString();
      }
      posthogClient.capture("$pageview", { $current_url: url });
    }
  }, [pathname, searchParams, posthogClient]);

  return null;
}

/**
 * Suspended page view tracker
 * Only renders after client-side hydration to avoid SSR mismatch
 */
function SuspendedPageView() {
  const isMounted = useIsMounted();

  if (!isMounted) return null;

  return (
    <Suspense fallback={null}>
      <PostHogPageView />
    </Suspense>
  );
}

interface PostHogProviderProps {
  children: React.ReactNode;
}

export function PostHogProvider({ children }: PostHogProviderProps) {
  useEffect(() => {
    // Initialize PostHog
    initPostHog();

    // Initialize Web Vitals tracking
    reportWebVitals();
  }, []);

  // If no PostHog key, render children without provider
  // Note: Don't check typeof window here as it causes hydration mismatch
  if (!analyticsConfig.posthogKey) {
    return <>{children}</>;
  }

  return (
    <PHProvider client={posthog}>
      <SuspendedPageView />
      {children}
    </PHProvider>
  );
}
