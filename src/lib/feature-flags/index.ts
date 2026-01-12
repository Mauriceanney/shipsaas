/**
 * Feature Flags Module
 * PostHog-based feature flags
 */

// Types
export * from "./types";

// Server-side utilities (use in Server Components and Server Actions)
export {
  isFeatureFlagEnabled,
  isFeatureEnabled,
  getAllFeatureFlags,
} from "./server";

// Note: Client-side hooks are in ./client.ts
// Import directly: import { useFeatureFlag } from "@/lib/feature-flags/client"
// This avoids "use client" directive issues in server contexts
