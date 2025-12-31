/**
 * Usage Utility Functions
 * Pure utility functions for usage calculations (browser-safe)
 */

import { isUnlimited } from "@/lib/stripe/config";

/**
 * Check if usage is approaching limit (80% threshold)
 */
export function isApproachingLimit(used: number, limit: number): boolean {
  if (isUnlimited(limit)) return false;
  return used >= limit * 0.8;
}

/**
 * Calculate usage percentage
 */
export function getUsagePercentage(used: number, limit: number): number {
  if (isUnlimited(limit)) return 0;
  if (limit === 0) return 100;
  return Math.min(100, Math.round((used / limit) * 100));
}
