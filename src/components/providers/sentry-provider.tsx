"use client";

/**
 * Sentry Provider
 * Lazy loads Sentry after page is interactive to reduce initial bundle size
 */

import { useEffect, useState } from "react";

import { preloadSentry } from "@/lib/sentry/lazy";

interface SentryProviderProps {
  children: React.ReactNode;
}

export function SentryProvider({ children }: SentryProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Preload Sentry in background after page is interactive
    // This ensures Sentry is ready for subsequent errors without blocking initial load
    const timeoutId = setTimeout(() => {
      preloadSentry();
    }, 3000); // Wait 3 seconds after mount to preload

    return () => clearTimeout(timeoutId);
  }, []);

  // Wait for client-side hydration to avoid SSR mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
