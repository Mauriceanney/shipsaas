"use client";

/**
 * PostHog Analytics Provider
 * Initializes PostHog and provides context for client-side tracking
 */

import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { Suspense, useEffect } from "react";

import { initPostHog } from "@/lib/analytics/client";
import { analyticsConfig } from "@/lib/analytics/config";

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
        url = `${url}?${searchParams.toString()}`;
      }
      posthogClient.capture("$pageview", { $current_url: url });
    }
  }, [pathname, searchParams, posthogClient]);

  return null;
}

/**
 * Suspended page view tracker
 */
function SuspendedPageView() {
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
    initPostHog();
  }, []);

  // If no PostHog key or SSR, render children without provider
  if (!analyticsConfig.posthogKey || typeof window === "undefined") {
    return <>{children}</>;
  }

  return (
    <PHProvider client={posthog}>
      <SuspendedPageView />
      {children}
    </PHProvider>
  );
}
