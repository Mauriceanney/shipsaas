"use client";

/**
 * Web Vitals tracking
 * Captures Core Web Vitals metrics and sends them to PostHog
 */

import { onCLS, onINP, onLCP, onTTFB } from "web-vitals";
import { trackEvent } from "./client";
import type { CLSMetric, INPMetric, LCPMetric, TTFBMetric } from "web-vitals";

/**
 * Report all Core Web Vitals to PostHog
 * Should be called once on app initialization (client-side only)
 */
export function reportWebVitals(): void {
  // Track Cumulative Layout Shift
  onCLS((metric: CLSMetric) => {
    reportMetric(metric);
  });

  // Track Interaction to Next Paint (replaces deprecated FID)
  onINP((metric: INPMetric) => {
    reportMetric(metric);
  });

  // Track Largest Contentful Paint
  onLCP((metric: LCPMetric) => {
    reportMetric(metric);
  });

  // Track Time to First Byte
  onTTFB((metric: TTFBMetric) => {
    reportMetric(metric);
  });
}

/**
 * Report a single web vital metric to PostHog
 */
function reportMetric(
  metric: CLSMetric | INPMetric | LCPMetric | TTFBMetric
): void {
  trackEvent("web_vital", {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
    navigationType: metric.navigationType,
  });
}
